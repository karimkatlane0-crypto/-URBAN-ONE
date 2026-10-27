package ai.seva.enterprise.diagnostics

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Index
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.withTransaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

/**
 * OPTIONAL online-only SEVA integration. NOT packaged in the 2.5.0 offline app.
 * Never persist complete URLs, query strings, tokens, headers, prompts or response bodies.
 */
@Entity(tableName = "network_error_logs", indices = [Index(value = ["isSynced"])])
data class NetworkErrorLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long,
    val host: String,
    val method: String,
    val errorCode: Int?,
    val errorCategory: String,
    val isSynced: Boolean = false
)

@Dao
interface NetworkErrorDao {
    @Insert
    suspend fun insertLog(log: NetworkErrorLogEntity)

    @Query("SELECT COUNT(*) FROM network_error_logs WHERE isSynced = 0")
    suspend fun getUnsyncedErrorsCount(): Int

    @Query("SELECT COUNT(*) FROM network_error_logs WHERE isSynced = 0")
    fun observeUnsyncedErrorsCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM network_error_logs")
    fun observeTotalErrorsCount(): Flow<Int>

    @Query("DELETE FROM network_error_logs WHERE timestamp < :cutoffMillis")
    suspend fun purgeOlderThan(cutoffMillis: Long): Int
}

@Database(entities = [NetworkErrorLogEntity::class], version = 1, exportSchema = true)
abstract class NetworkDiagnosticsDatabase : RoomDatabase() {
    abstract fun errorDao(): NetworkErrorDao
}

/** Recording and threshold-crossing are one database transaction. */
class NetworkErrorRecorder(
    private val database: NetworkDiagnosticsDatabase,
    private val onThresholdReached: (Int) -> Unit
) {
    companion object { const val CRITICAL_THRESHOLD = 5 }

    suspend fun record(host: String, method: String, code: Int?, category: String) {
        val newCount: Int? = database.withTransaction {
            val dao = database.errorDao()
            val before = dao.getUnsyncedErrorsCount()
            dao.insertLog(
                NetworkErrorLogEntity(
                    timestamp = System.currentTimeMillis(),
                    host = host.take(255),
                    method = method.take(16),
                    errorCode = code,
                    errorCategory = category.take(80)
                )
            )
            val after = dao.getUnsyncedErrorsCount()
            if (before < CRITICAL_THRESHOLD && after >= CRITICAL_THRESHOLD) after else null
        }
        // Only the first threshold crossing generates a notification.
        if (newCount != null) onThresholdReached(newCount)
    }
}

/**
 * Attach ONLY to an explicitly configured, authenticated OkHttp client for an online variant.
 * 429, 5xx and IOExceptions are operational failures; 4xx auth errors are not "network offline".
 * No background uploads are started here. A real sync needs separate opt-in and auth.
 */
class NetworkErrorInterceptor(private val recorder: NetworkErrorRecorder) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        try {
            val response = chain.proceed(request)
            if (response.code == 429 || response.code >= 500) {
                persist(request.url.host, request.method, response.code, "HTTP_FAILURE")
            }
            return response
        } catch (error: IOException) {
            persist(request.url.host, request.method, null, error.javaClass.simpleName)
            throw error
        }
    }

    private fun persist(host: String, method: String, code: Int?, category: String) {
        // OkHttp interception already runs off the UI thread; commit before returning.
        // Diagnostics failures must never override the original network result.
        try {
            runBlocking(Dispatchers.IO) { recorder.record(host, method, code, category) }
        } catch (_: Exception) {
            // Production integration should count diagnostics failures with an in-memory metric.
        }
    }
}

object NetworkNotificationHelper {
    private const val CHANNEL_ID = "seva_network_alerts_channel"
    private const val NOTIFICATION_ID = 2002

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "SEVA Avvisi di rete", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Soglia di errori operativi di rete non sincronizzati"
            }
            context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    @SuppressLint("MissingPermission")
    fun showNetworkErrorAlert(context: Context, unsyncedCount: Int) {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
        ) return
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return

        val intent: Intent = context.packageManager
            .getLaunchIntentForPackage(context.packageName) ?: return
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        createChannel(context)
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("SEVA: controlla la diagnostica")
            .setContentText("$unsyncedCount errori di rete da esaminare.")
            .setStyle(NotificationCompat.BigTextStyle().bigText(
                "$unsyncedCount eventi operativi non sincronizzati. Non indicano " +
                    "necessariamente errori consecutivi o assenza di Internet."
            ))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }
}

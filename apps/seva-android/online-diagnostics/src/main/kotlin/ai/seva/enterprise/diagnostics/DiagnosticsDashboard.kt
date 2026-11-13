package ai.seva.enterprise.diagnostics

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class NetworkErrorStats(val unsynced: Int = 0, val total: Int = 0)

/**
 * Room Flow updates on insert; unlike a one-time loadErrorStats(), this reflects
 * changes whenever the dashboard resumes and avoids reloading on each composition.
 */
class DiagnosticsViewModel(dao: NetworkErrorDao) : ViewModel() {
    val errorStats: StateFlow<NetworkErrorStats> = combine(
        dao.observeUnsyncedErrorsCount(),
        dao.observeTotalErrorsCount()
    ) { unsynced, total -> NetworkErrorStats(unsynced, total) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), NetworkErrorStats())
}

@Composable
fun MainDashboardScreen(
    dashboardViewModel: DiagnosticsViewModel,
    navigateToDiagnostics: () -> Unit
) {
    val stats by dashboardViewModel.errorStats.collectAsStateWithLifecycle()
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ErrorSummaryWidget(stats = stats, onCardClick = navigateToDiagnostics)
        NotificationPermissionAction()
        // Compose the remainder of the ONLINE dashboard here.
    }
}

@Composable
fun ErrorSummaryWidget(stats: NetworkErrorStats, onCardClick: () -> Unit) {
    Card(onClick = onCardClick, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Diagnostica di rete", style = MaterialTheme.typography.titleMedium)
            Text("Eventi da esaminare: " + stats.unsynced)
            Text("Eventi totali registrati: " + stats.total)
            Text("I log restano locali; la sincronizzazione non è attiva.")
        }
    }
}

/** Never prompts on launch; the user explicitly taps to opt into alerts. */
@Composable
fun NotificationPermissionAction() {
    val context = LocalContext.current
    if (Build.VERSION.SDK_INT < 33 ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED
    ) return
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* Honor denial: no repeated automatic prompt. */ }
    Button(onClick = { launcher.launch(Manifest.permission.POST_NOTIFICATIONS) }) {
        Text("Abilita notifiche diagnostiche")
    }
}

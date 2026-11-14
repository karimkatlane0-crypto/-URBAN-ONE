package ai.seva.enterprise.config

/**
 * Public configuration adapted from the supplied SynapsyProdConfig.kt.
 *
 * This belongs to the optional Kotlin diagnostics library. The Java offline APK
 * and the browser-owned TWA session remain separate. These constants contain no
 * API credentials and grant no access to the Site or an external provider.
 */
object SynapsyProdConfig {
    const val BASE_URL = "https://seva.karimkatlane0.chatgpt.site/"
    const val SYNC_GATEWAY_URL = BASE_URL + "api/synapsy/"

    // No account-scoped, authenticated Room outbox is implemented in this library.
    // Network error logs are diagnostics; they are not queued CRM or payment writes.
    const val ENABLE_OFFLINE_ROOM_QUEUE = false

    // Policy for a future native speech client. This library has no TTS engine
    // and does not disable or control TalkBack or another system screen reader.
    const val RESPECT_SYSTEM_SCREEN_READER = true
}

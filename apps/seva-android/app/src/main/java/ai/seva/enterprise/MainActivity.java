package ai.seva.enterprise;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Offline-first SEVA 2.5 Executive Consolidated QA APK. The HTML is bundled inside
 * this APK; no automatic network, account sign-in, payment or real AI execution.
 * Data is isolated in app WebView localStorage and can be exported by SAF.
 */
public final class MainActivity extends Activity {
    private static final int BACKUP_REQUEST = 7242;
    private static final String BASE_URL = "https://appassets.androidplatform.net/";
    private WebView browser;
    private String pendingBackup;

    private final class BackupActions {
        @JavascriptInterface public void exportJson(final String raw) {
            exportSaf(raw,"seva-offline-v1","SEVA-obiettivi-backup.json");
        }
        @JavascriptInterface public void exportIntentJson(final String raw) {
            exportSaf(raw,"seva-intents-v1","SEVA-intenzioni-locali.json");
        }
        @JavascriptInterface public void openWhatsApp(final String value) {
            // Only bundled offline source can call this native bridge; it is not accessible to remote pages.
            if (value == null || value.trim().isEmpty() || value.length() > 450) return;
            final String safe = value.trim();
            runOnUiThread(() -> {
                try {
                    final Uri uri = Uri.parse("https://wa.me/?text=" + Uri.encode(safe));
                    startActivity(new Intent(Intent.ACTION_VIEW,uri));
                } catch (Exception e) { notifyUser("Nessuna app per aprire il messaggio."); }
            });
        }
    }
    private void exportSaf(final String raw,final String expectedSchema,final String filename) {
        if (raw == null || raw.length() > 1000000 || !raw.startsWith("{")) return;
        try {
            if (!expectedSchema.equals(new JSONObject(raw).optString("schema"))) return;
        } catch (Exception ignored) { return; }
        runOnUiThread(() -> {
            pendingBackup = raw;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE,filename);
            try { startActivityForResult(intent,BACKUP_REQUEST); }
            catch (Exception e) { pendingBackup = null; notifyUser("Impossibile aprire il salvataggio."); }
        });
    }

    private void notifyUser(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    private String assetHtml() throws Exception {
        try (InputStream input = getAssets().open("seva-offline.html");
             ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1) bytes.write(buffer, 0, read);
            return bytes.toString("UTF-8");
        }
    }

    @Override @SuppressLint("SetJavaScriptEnabled")
    public void onCreate(Bundle state) {
        super.onCreate(state);
        browser = new WebView(this);
        browser.setBackgroundColor(0xff071528);
        setContentView(browser);
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                // Bundled local-only interface: block outbound navigation.
                return true;
            }
        });
        browser.addJavascriptInterface(new BackupActions(), "SevaAndroid");
        try {
            browser.loadDataWithBaseURL(BASE_URL, assetHtml(), "text/html", "UTF-8", null);
        } catch (Exception e) {
            notifyUser("Pacchetto locale incompleto.");
            browser.loadDataWithBaseURL(BASE_URL,
                "<html><body style='background:#071528;color:white'><h1>SEVA</h1><p>Interfaccia locale non disponibile.</p></body></html>",
                "text/html", "UTF-8", null);
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != BACKUP_REQUEST) return;
        String content = pendingBackup;
        pendingBackup = null;
        if (resultCode != RESULT_OK || data == null || data.getData() == null || content == null) return;
        Uri destination = data.getData();
        try (OutputStream out = getContentResolver().openOutputStream(destination)) {
            if (out == null) throw new IllegalStateException("No output stream");
            out.write(content.getBytes(StandardCharsets.UTF_8));
            out.flush();
            notifyUser("Backup SEVA salvato.");
        } catch (Exception e) { notifyUser("Salvataggio non riuscito: riprova."); }
    }

    @Override public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (browser != null) {
            browser.removeJavascriptInterface("SevaAndroid");
            browser.destroy();
            browser = null;
        }
        super.onDestroy();
    }
}
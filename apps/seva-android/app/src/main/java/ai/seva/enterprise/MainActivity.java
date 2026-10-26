package ai.seva.enterprise;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.net.Uri;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceError;

/**
 * SEVA QA shell. Loads the separately hosted private SEVA website.
 * Does NOT bundle the Enterprise Node service, AI credentials, payments or data.
 * Do not claim purchase or authentication acceptance without device QA.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "seva.karimkatlane0.chatgpt.site";
    private static final String HOME = "https://" + HOST + "/";
    private WebView browser;

    private static boolean trusted(Uri uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme())
                && HOST.equalsIgnoreCase(uri.getHost())
                && uri.getPort() == -1;
    }

    private void openExternally(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (ActivityNotFoundException ignored) {
            // No browser installed. Do not open unverified links inside SEVA.
        }
    }

    private void showUnavailable() {
        String html = "<!doctype html><html lang='it'><meta name='viewport' content='width=device-width, initial-scale=1'>" +
            "<style>body{font-family:sans-serif;background:#101d33;color:#f2f7ff;padding:38px 18px;line-height:1.6}" +
            "a{color:#ffd18b}h1{font-size:28px}</style><h1>SEVA</h1><p>Il sito sicuro SEVA non è raggiungibile.</p>" +
            "<p>Verifica la connessione Internet. Nessun pagamento viene eseguito dall'app Android.</p>" +
            "<p><a href='" + HOME + "'>Riprova connessione</a></p></html>";
        browser.loadDataWithBaseURL(HOME, html, "text/html", "UTF-8", null);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        browser = new WebView(this);
        browser.setBackgroundColor(0xff101d33);
        setContentView(browser);
        WebSettings s = browser.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) s.setSafeBrowsingEnabled(true);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(browser, false);
        browser.setWebChromeClient(new WebChromeClient());
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                if (!req.isForMainFrame()) return false;
                Uri target = req.getUrl();
                if (trusted(target)) return false;
                openExternally(target);
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) showUnavailable();
            }
        });
        browser.loadUrl(HOME);
    }

    @Override public void onBackPressed() {
        if (browser != null && browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (browser != null) { browser.destroy(); browser = null; }
        super.onDestroy();
    }
}

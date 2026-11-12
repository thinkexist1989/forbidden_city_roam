package com.yangluo.forbiddencity;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.MimeTypeMap;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public class PalaceActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private FrameLayout frame;
    private View fullscreen;
    private WebChromeClient.CustomViewCallback fullscreenCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        frame = new FrameLayout(this);
        web = new WebView(this);
        web.setBackgroundColor(0xff17201f);
        frame.addView(web);
        setContentView(frame);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.getSettings().setUseWideViewPort(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!HOST.equals(uri.getHost()) || !"https".equals(uri.getScheme())) return null;
                String path = uri.getPath();
                try {
                    if (path == null || !path.startsWith("/") || uri.getPathSegments().contains(".."))
                        throw new IOException("Invalid asset path");
                    InputStream stream = getAssets().open(path.substring(1));
                    return new WebResourceResponse(mimeType(path), null, stream);
                } catch (IOException missing) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, null);
                }
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (ActivityNotFoundException noBrowser) {
                        Toast.makeText(PalaceActivity.this, "请安装浏览器以查看原始资料", Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreen != null) { callback.onCustomViewHidden(); return; }
                fullscreen = view;
                fullscreenCallback = callback;
                frame.addView(view);
                frame.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            }
            @Override public void onHideCustomView() { leaveFullscreen(); }
        });
        web.loadUrl("https://" + HOST + "/index.html");
    }

    private static String mimeType(String path) {
        String extension = path.substring(path.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        switch (extension) {
            case "js": return "application/javascript";
            case "glb": return "model/gltf-binary";
            case "woff2": return "font/woff2";
            case "ttf": return "font/ttf";
            default:
                String type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                return type != null ? type : "application/octet-stream";
        }
    }

    private void leaveFullscreen() {
        if (fullscreen == null) return;
        frame.removeView(fullscreen);
        fullscreen = null;
        frame.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        fullscreenCallback.onCustomViewHidden();
        fullscreenCallback = null;
    }

    @Override public void onBackPressed() {
        if (fullscreen != null) { leaveFullscreen(); return; }
        web.evaluateJavascript("(()=>{const p=document.getElementById('panel');if(p&&!p.hidden){" +
                "document.getElementById('close').click();return true}const b=document.getElementById('overview');" +
                "if(b&&b.getAttribute('aria-pressed')==='true'){b.click();return true}return false})()",
                handled -> { if (!"true".equals(handled)) finish(); });
    }

    @Override protected void onPause() {
        web.evaluateJavascript("(()=>{const a=document.querySelector('audio');if(a&&!a.paused){" +
                "a.dataset.resumeOnReturn='1';a.pause()}})()", null);
        web.onPause();
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        web.onResume();
        web.evaluateJavascript("(()=>{const a=document.querySelector('audio');if(a&&a.dataset.resumeOnReturn){" +
                "delete a.dataset.resumeOnReturn;a.play().catch(()=>{})}})()", null);
    }

    @Override protected void onDestroy() {
        frame.removeAllViews();
        web.destroy();
        super.onDestroy();
    }
}

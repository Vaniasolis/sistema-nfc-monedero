package com.cashlessJV.nfcapp; // 🌟 Deja tu package oficial intacto

import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.MifareUltralight;
import android.nfc.tech.Ndef;
import android.nfc.tech.NfcA;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private NfcAdapter nfcAdapter;
    private PendingIntent pendingIntent;
    private IntentFilter[] intentFilters;
    private String[][] techLists;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Inicializamos el lector físico de tu Samsung S25
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);

        if (nfcAdapter != null) {
            Intent intent = new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_MUTABLE;
            pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

            IntentFilter tagDetected = new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED);
            IntentFilter techDetected = new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED);
            intentFilters = new IntentFilter[]{tagDetected, techDetected};
            techLists = new String[][]{
                    new String[]{NfcA.class.getName()},
                    new String[]{MifareUltralight.class.getName()},
                    new String[]{Ndef.class.getName()}
            };
        }

        // 🌟 2. EL TRUCO DEL COMENTARIO DE GOOGLE: DESBLOQUEAMOS EL WEBVIEW DE CAPACITOR
        // Forzamos un pequeño retraso de milisegundos para asegurar que el navegador ya despertó
        getWindow().getDecorView().post(new Runnable() {
            @Override
            public void run() {
                if (bridge != null && bridge.getWebView() != null) {
                    WebView miNavegadorApp = bridge.getWebView();
                    WebSettings configuracionVisual = miNavegadorApp.getSettings();

                    // 🔥 ENCENDEMOS EL MOTOR DE JAVASCRIPT EXCLUSIVO DEL HARDWARE
                    configuracionVisual.setJavaScriptEnabled(true);
                    configuracionVisual.setDomStorageEnabled(true);
                    configuracionVisual.setAllowFileAccess(true);
                    configuracionVisual.setAllowContentAccess(true);

                    System.out.println("BÚNKER WEBVIEW: ¡Puente de hardware y canales de JavaScript activados con éxito total!");
                }
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (nfcAdapter != null && pendingIntent != null) {
            nfcAdapter.enableForegroundDispatch(this, pendingIntent, intentFilters, techLists);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (nfcAdapter != null) {
            nfcAdapter.disableForegroundDispatch(this);
        }
    }

    // 🚀 CANAL DE INYECCIÓN FORZADA: Dispara el texto directamente saltándose los bloqueos de Android
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(intent.getAction()) ||
                NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction())) {

            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                byte[] idBytes = tag.getId();
                if (idBytes != null) {
                    // Convertimos los bytes del chip agregando los dos puntos (:) automáticamente
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < idBytes.length; i++) {
                        sb.append(String.format("%02X", idBytes[i]));
                        if (i < idBytes.length - 1) {
                            sb.append(":");
                        }
                    }
                    final String codigoUIDFormateado = sb.toString().toUpperCase();

                    // ¡Disparamos el código directo al JavaScript desbloqueado!
                    if (this.bridge != null && this.bridge.getWebView() != null) {
                        this.bridge.getWebView().post(new Runnable() {
                            @Override
                            public void run() {
                                // Ejecuta la inyección forzada directo en la ventana global del celular
                                String scriptJS = "if(window.recibirNfcNativo) { window.recibirNfcNativo('" + codigoUIDFormateado + "'); }";
                                bridge.getWebView().evaluateJavascript(scriptJS, null);
                            }
                        });
                    }
                }
            }
        }

        if (this.bridge != null) {
            this.bridge.onNewIntent(intent);
        }
    }
}

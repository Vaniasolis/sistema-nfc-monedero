import { useEffect } from 'react';

// 🛰️ MÓDULO CONTROLADOR INTEGRAL NATIVO (EL RECEPTOR DEL TIMBRE DE JAVA)
export function useNfcRadar(setCodigoNfc, setPulseraVenta) {
  useEffect(() => {
    let subscripcionActiva = true;

    // 🌟 EL PUENTE DE CHATGPT INTEGRADO AL MOTOR COMERCIAL:
    // Forzamos el registro en la ventana global del navegador del celular
    window.recibirNfcNativo = function(uidDetectado) {
      if (!uidDetectado || !subscripcionActiva) return;
      
      console.log("¡ÉXITO EN EL PUENTE! Ficha NFC detectada:", uidDetectado);
      
      try {
        // 🚀 INYECCIÓN DIRECTA AL DOM VISUAL: Buscamos el input y le estampamos el texto con puntos
        const casillasInput = document.querySelectorAll('input[type="text"]');
        casillasInput.forEach(input => {
          input.value = uidDetectado;
          // Forzamos a React a enterarse del cambio de texto de forma obligatoria
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Sincronizamos tus variables de respaldo de Taquilla y Punto de Venta
        if (typeof setCodigoNfc === 'function') setCodigoNfc(uidDetectado);
        if (typeof setPulseraVenta === 'function') setPulseraVenta(uidDetectado);

        // Zumbido físico premium de confirmación contable en tu Samsung S25
        if (navigator.vibrate) navigator.vibrate(100);

        // Disparamos la alerta de control de ChatGPT para festejar en la pantalla
        alert("Ficha NFC Leída con Éxito: " + uidDetectado);

      } catch (error) {
        console.error("MÓDULO NFC: Error al procesar el impacto global:", error);
      }
    };

    // Mensaje de control para asegurar que el WebView ya la tiene lista
    console.log("Función global 'recibirNfcNativo' registrada en el WebView de Capacitor.");

    // Limpieza milimétrica para evitar fugas de memoria o procesos colgados
    return () => {
      subscripcionActiva = false;
      delete window.recibirNfcNativo;
    };
  }, [setCodigoNfc, setPulseraVenta]);
}

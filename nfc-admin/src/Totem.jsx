import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Totem({ alSalir }) {
  // 📡 TU SERVIDOR REAL DE PRODUCTION EN VIVO
  // ⚠️ RECUERDA: Cambia esto por tu URL de Railway real (ej: https://tu-backend.up.railway.app)
  const [apiUrl] = useState("https://railway.app");
  
  const [uidFiltro, setUidFiltro] = useState('');
  const [pulseraInfo, setPulseraInfo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeEspera, setMensajeEspera] = useState('👋 ACERCA TU PULSERA PARA CONSULTAR');

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // 👁️ EL VIGILANTE AUTOMÁTICO: Revisa la casilla continuamente para no usar el dedo
  useEffect(() => {
    const revisarCasillaEnCaliente = () => {
      if (inputRef.current) {
        const textoInyectado = inputRef.current.value.trim().toUpperCase();
        
        // Si el lector ya escribió las 20 letras con puntos y la pantalla sigue en espera
        if (textoInyectado.length >= 20 && !pulseraInfo && !cargando) {
          console.log("👁️ El Vigilante detectó el ID inyectado:", textoInyectado);
          
          // Sincronizamos el estado visual de React
          setUidFiltro(textoInyectado);
          
          // Lanzamos la consulta directa a Railway automáticamente
          consultarDatosTotem(textoInyectado);
        }
      }
    };

    // Revisa la casilla cada 400 milisegundos de forma silenciosa
    const intervaloVigilante = setInterval(revisarCasillaEnCaliente, 400);

    return () => clearInterval(intervaloVigilante); // Limpieza de hilos al salir
  }, [pulseraInfo, cargando]);

  // 🔒 CORRECCIÓN 1: Se restauró el useEffect que estaba roto y colgado aquí
  useEffect(() => {
    const forzarEnfoque = () => { if (inputRef.current) inputRef.current.focus(); };
    
    forzarEnfoque();
    window.addEventListener('click', forzarEnfoque);
    
    return () => {
      window.removeEventListener('click', forzarEnfoque);
      if (window.Capacitor && window.Capacitor.Plugins) {
        const { NFC } = window.Capacitor.Plugins;
        if (NFC) NFC.removeAllListeners();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const iniciarTemporizadorRegreso = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPulseraInfo(null);
      setUidFiltro('');
      setMensajeEspera('👋 ACERCA TU PULSERA PARA CONSULTAR');
    }, 8000); // 8 segundos de privacidad
  };

  const consultarDatosTotem = async (uid) => {
    if (!uid || !uid.trim()) return;
    const uidLimpio = uid.trim().toUpperCase();
    
    setCargando(true);
    setMensajeEspera('🔍 Buscando datos en la nube...');
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      // Consulta directa a tu servidor de Railway
      const resPulseras = await axios.get(`${apiUrl}/pulseras?_nocache=${new Date().getTime()}`);
      
      const pulseraMatch = resPulseras.data.find(p => 
        (p.codigo_nfc || p.codigo || '').trim().toUpperCase() === uidLinter || 
        (p.codigo_nfc || p.codigo || '').trim().toUpperCase() === uidLimpio
      );

      if (!pulseraMatch) {
        setMensajeEspera(`ℹ️ La pulsera [${uidLimpio}] no está registrada.`);
        setCargando(false);
        setUidFiltro('');
        iniciarTemporizadorRegreso();
        return;
      }

      setPulseraInfo(pulseraMatch);
      setCargando(false);
      setUidFiltro('');
      iniciarTemporizadorRegreso();

    } catch (err) {
      console.error("Error en consulta:", err);
      setMensajeEspera('❌ Error de conexión con el servidor.');
      setCargando(false);
      setUidFiltro('');
      iniciarTemporizadorRegreso();
    }
  };

  // 🌟 CORRECCIÓN 2: Se agregó la función que le hacía falta al Formulario para procesar el "Enter" del Tótem
  const handleSubmitFormulario = (e) => {
    e.preventDefault();
    if (inputRef.current) {
      const valorRealForm = inputRef.current.value.trim().toUpperCase();
      if (valorRealForm === '') return;
      console.log("📝 Formulario enviado con código:", valorRealForm);
      consultarDatosTotem(valorRealForm);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a', color: '#ffffff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '20px', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>
      
      {alSalir && (
        <button onClick={alSalir} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✕ Salir</button>
      )}

      {!pulseraInfo && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ fontSize: '80px' }}>💳</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', maxWidth: '350px', lineHeight: '1.4' }}>{mensajeEspera}</h1>
          
          {/* 💻 CASILLA DE CONSULTA UNIFICADA (Celular y Laptop) */}
          <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '5px' }}>
              [Acerque su ficha o presione Enter al completarse el código]
            </p>
            <form onSubmit={handleSubmitFormulario}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ej: 04:B3:4F..."
                value={uidFiltro}
                onChange={(e) => setUidFiltro(e.target.value)}
                autoFocus
                style={{ 
                  backgroundColor: '#1e293b', 
                  color: '#38bdf8', 
                  border: '1px solid #334155', 
                  padding: '10px 15px', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  textAlign: 'center', 
                  outline: 'none', 
                  width: '280px', 
                  fontWeight: 'bold' 
                }}
              />
            </form>
          </div>
        </div>
      )}

      {pulseraInfo && (
        <div style={{ width: '100%', maxWidth: '450px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', letterSpacing: '2px', display: 'block', marginBottom: '5px' }}>TAG NFC LEÍDO</span>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#f8fafc' }}>🆔 {pulseraInfo.codigo_nfc || pulseraInfo.codigo}</h2>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '40px 20px', borderRadius: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', color: '#e0f2fe', fontWeight: '600' }}>SALDO DISPONIBLE</span>
            <div style={{ fontSize: '60px', fontWeight: '900', marginTop: '10px', color: '#ffffff' }}>
              ${parseFloat(pulseraInfo.saldo || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', paddingBottom: '10px', marginTop: '20px' }}>
            La pantalla se limpiará automáticamente en unos segundos...
          </div>
        </div>
      )}
    </div>
  );
}

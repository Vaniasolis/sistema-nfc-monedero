import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Totem({ alSalir }) {
  // 📡 TU SERVIDOR REAL DE PRODUCTION EN VIVO
  // 📡 TU ENLACE DE PRODUCCIÓN REAL (Indestructible y sin comillas invertidas)
const [apiUrl] = useState("https://sistema-nfc-monedero-production.up.railway.app");
  
  const [uidFiltro, setUidFiltro] = useState('');
  const [pulseraInfo, setPulseraInfo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeEspera, setMensajeEspera] = useState('👋 ACERCA TU PULSERA PARA CONSULTAR');

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (window.Capacitor) {
      const { NFC } = window.Capacitor.Plugins;
      if (NFC) {
        NFC.addListener('nfcTagScanned', (datosTag) => {
          const idFisico = datosTag.id || datosTag.uid;
          if (idFisico) {
            const uidLimpio = idFisico.replace(/:/g, '').toUpperCase();
            consultarDatosTotem(uidLimpio);
          }
        });
      }
    }

    const forzarEnfoque = () => { if (inputRef.current) inputRef.current.focus(); };
    forzarEnfoque();
    window.addEventListener('click', forzarEnfoque);
    return () => {
      window.removeEventListener('click', forzarEnfoque);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ⏱️ TEMPORIZADOR DE AUTO-CIERRE PURIFICADO CONTRA ALERTAS FANTASMA
    const iniciarTemporizadorRegreso = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPulseraInfo(null);
      // 🌟 SOLUCIÓN: Eliminamos la línea de setHistorial que causaba el quiebre
      setUidFiltro(''); 
      setMensajeEspera('👋 ACERCA TU PULSERA PARA CONSULTAR');
    }, 8000);
  };


  const consultarDatosTotem = async (uid) => {
    if (!uid || !uid.trim()) return;
    const uidLimpio = uid.trim().toUpperCase().replace('C-', '');
    
    setCargando(true);
    setMensajeEspera('🔍 Buscando datos en la nube...');
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      // 🌟 CONSULTA DE PULSERAS CONECTADA A TU ENLACE REAL Y DINÁMICO
      const resPulseras = await axios.get(`${apiUrl}/pulseras`);
      
      const pulseraMatch = resPulseras.data.find(p => 
        (p.codigo_nfc || p.codigo || '').replace('C-', '').trim().toUpperCase() === uidLimpio
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
      console.error("Error en consulta del Tótem:", err);
      setMensajeEspera('❌ Error de conexión con el servidor.');
      setCargando(false);
      setUidFiltro('');
      iniciarTemporizadorRegreso();
    }
  };

  const manejarSubmitTeclado = (e) => {
    if (e.key === 'Enter') {
      consultarDatosTotem(uidFiltro);
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
          
          <div style={{ marginTop: '15px' }}>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '5px' }}>[Modo Laptop: Teclea el ID de la pulsera y presiona Enter para simular]</p>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ej: NFC001"
              value={uidFiltro}
              onChange={(e) => setUidFiltro(e.target.value)}
              onKeyDown={manejarSubmitTeclado}
              style={{ backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '10px 15px', borderRadius: '8px', fontSize: '16px', textAlign: 'center', outline: 'none', width: '200px', fontWeight: 'bold' }}
            />
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
        </div>
      )}
    </div>
  );
}

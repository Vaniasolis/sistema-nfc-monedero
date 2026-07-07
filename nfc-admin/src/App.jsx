import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {

    // 🌟 Estado para controlar la pantalla de bienvenida de gala (PÁGALA AQUÍ ARRIBA)
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  // 📡 1. URL DINÁMICA (Primero declaramos la variable de internet)
  //const [apiUrlDinamica, setApiUrlDinamica] = useState("https://sistema-nfc-monedero-production.up.railway.app");
  const [apiUrlDinamica, setApiUrlDinamica] = useState(import.meta.env.VITE_API_URL || "https://railway.app");


  // 🧠 2. FUNCIÓN DE CAMBIO DE CANAL (Ahora sí va adentro de App y puede usar setApiUrlDinamica)
  const cambiarCanalEvento = (nuevoEnlace, elementoSelect) => {
    const claveIntroducida = prompt('🔒 Introduzca el código maestro de administrador para cambiar de evento:');
    
    if (claveIntroducida === '123') {
      setApiUrlDinamica(nuevoEnlace);
      alert('✅ Código correcto. Sintonizando nuevo canal de evento en la nube...');
    } else {
      alert('❌ Código incorrecto. Acceso denegado.');
      if (elementoSelect) {
        elementoSelect.value = apiUrlDinamica;
      }
    }
  };

  // 📱 3. TUS ESTADOS (El bloque que me mostraste antes empieza justo aquí)
  const [pestañaActiva, setPestañaActiva] = useState('pulseras');
  // Estados de Pulseras
  const [pulseras, setPulseras] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoNfc, setCodigoNfc] = useState('');
  const [tipoAccesoId, setTipoAccesoId] = useState('');
  const [saldo, setSaldo] = useState('');

  // Estados de Productos y Catálogo
  const [productos, setProductos] = useState([]);
  const [pulseraVenta, setPulseraVenta] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  
  // Estados: Control del modal de productos
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [stockProducto, setStockProducto] = useState('');

  // 🌟 NUEVOS ESTADOS PARA LA VENTANA DE HISTORIAL Y REVERSIÓN QUIRÚRGICA
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [historialVentas, setHistorialVentas] = useState([]);
  const [pulseraSeleccionadaHistorial, setPulseraSeleccionadaHistorial] = useState('');

  
    // 📱 CONFIGURACIÓN DE ARRANQUE Y DETECTOR DE CAMBIO DE EVENTO
useEffect(() => {
  // 1. Limpiamos las tablas inmediatamente para que no se queden congeladas
  setPulseras([]);
  setProductos([]);
  // 2. Traemos los datos del servidor que se acaba de seleccionar
  cargarPulseras();
  cargarProductos();
}, [apiUrlDinamica]); 
    // 🎟️ FUNCIÓN CORRECTA PARA LEER LAS PULSERAS DESDE RAILWAY
  const cargarPulseras = async () => {
    try { 
      const res = await axios.get(`${apiUrlDinamica}/pulseras`); 
      setPulseras(res.data); 
    } catch (e) { 
      console.error("Error al cargar pulseras desde la nube:", e); 
    }
  };

  // 🍺 FUNCIÓN DE CARGA DE BEBIDAS DINÁMICA ULTRA-BLINDADA PARA AMBOS EVENTOS
   const cargarProductos = async () => {
    try {
      const res = await axios.get(`${apiUrlDinamica}/productos`);
      setProductos(res.data);
      
      if (res.data.length > 0) {
        // 🌟 REVISA ESTA LÍNEA: Debe tener el [0] después de res.data
        setProductoSeleccionado(res.data[0].id.toString()); 
      } else {
        setProductoSeleccionado('');
      }
    } catch (err) {
      console.error("Error al cargar catálogo de bebidas:", err);
    }
  };

    // ➕ FUNCIÓN CORRECTA PARA REGISTRAR EN LA NUBE
  const guardarPulsera = async () => {
    try {
      const res = await axios.post(`${apiUrlDinamica}/pulseras`, {
        codigo_nfc: codigoNfc,
        tipo_acceso_id: parseInt(tipoAccesoId),
        saldo: parseFloat(saldo)
      });

      if (res.status === 200 || res.status === 201 || res.data.guardado) {
        setCodigoNfc('');
        setTipoAccesoId('');
        setSaldo('');
        setMostrarModal(false);
        
        // Volvemos a leer internet para actualizar la pantalla
        cargarPulseras();
        alert('¡Pulsera guardada con éxito en la nube!');
      }
    } catch (e) {
      console.error("Falla al guardar:", e);
      alert('Error de red al conectar con el servidor de Railway');
    }
  };
 
  const guardarProducto = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrlDinamica}/productos`, { 
        nombre: nombreProducto, 
        precio: parseFloat(precioProducto), 
        stock: parseInt(stockProducto) 
      });
      if (res.data.guardado) {
        setNombreProducto(''); 
        setPrecioProducto(''); 
        setStockProducto(''); 
        setMostrarModalProducto(false); 
        cargarProductos();
        alert('¡Bebida añadida con éxito!');
      }
    } catch (e) { 
      alert('Error al registrar producto'); 
    }
  };

    // 💸 PROCESAR COMPRA CASHLESS EN LA BARRA (CORREGIDA)
    // 💸 1. FUNCIÓN EXCLUSIVA PARA COBRAR EN LA BARRA (BOTÓN VERDE)
  const procesarVenta = async (e) => {
    e.preventDefault();
    if (!pulseraVenta || !productoSeleccionado) return;

    try {
      const res = await axios.post(`${apiUrlDinamica}/ventas`, {
        codigo_nfc: pulseraVenta.trim().toUpperCase(),
        producto_id: parseInt(productoSeleccionado)
      });
      alert(res.data.mensaje);
      setPulseraVenta('');
      cargarPulseras();
      cargarProductos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error en cobro.');
    }
  };

  // 🎟️ 2. FUNCIÓN EXCLUSIVA PARA RECARGAR SALDO (TAQUILLA PRINCIPAL)
  const manejarRecarga = async (e) => {
    e.preventDefault();
    
    // 🌟 REGLA DE ORO: Usamos 'codigoNfc' y 'saldo' que son tus variables reales de los inputs
    if (!codigoNfc || !saldo) {
      alert('Por favor, ingresa el código de pulsera y el monto en la taquilla para recargar.');
      return;
    }
    
    try {
      const res = await axios.put(`${apiUrlDinamica}/pulseras/recargar`, {
        codigo_nfc: codigoNfc.trim(),
        monto: parseFloat(saldo) // Lee el número limpio de tu casilla de saldo
      });
      
      alert(res.data.mensaje || '¡Recarga exitosa!');
      setCodigoNfc(''); // Limpia la casilla
      setSaldo('');     // Limpia el saldo
      cargarPulseras(); // Recarga tus tablas en tiempo real
    } catch (err) {
      console.error("Error en recarga:", err);
      alert(err.response?.data?.error || 'Error al intentar procesar la recarga en Railway');
    }
  };

  const descargarExcelProductos = async () => {
    try {
      const res = await axios.get(`${apiUrlDinamica}/reporte-ventas`);
      const datosReporte = res.data;
      if (!datosReporte || datosReporte.length === 0) { 
        alert("Aún no se han realizado ventas para exportar."); 
        return; 
      }
      const datosFormateados = datosReporte.map(item => {
        const pNum = Math.round(parseFloat(item.precio_articulo));
        let nBebida = `Bebida de $${pNum}`;
        if (pNum === 250) nBebida = "Wisky";
        if (pNum === 180) nBebida = "Cerveza";
        if (pNum === 200) nBebida = "Piña Colada";
        return { 
          "Bebida / Artículo": nBebida, 
          "Precio Unitario ($)": pNum, 
          "Cantidad Total Vendida": `${item.cantidad_vendida} pzas`, 
          "Monto Recaudado Total ($)": parseFloat(item.total_recaudado) 
        };
      });
      const hoja = XLSX.utils.json_to_sheet(datosFormateados);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Ventas Totales");
      XLSX.writeFile(libro, "Reporte_Ventas_Final.xlsx");
    } catch (error) { 
      alert("Error al procesar y descargar el reporte de ventas."); 
    }
  };

  const obtenerTextoAcceso = (id) => {
    if (id === 1) return 'General'; 
    if (id === 2) return 'VIP'; 
    if (id === 3) return 'Cover'; 
    if (id === 4) return 'Backstage'; 
    if (id === 5) return 'coCortesia'; 
    return 'Otro';
  }

  return (
    
        mostrarBienvenida ? (
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          background: 'linear-gradient(180deg, #090d16 0%, #111827 60%, #030712 100%)', // Fondo Negro Carbón y Azul Noche de lujo
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '50px 24px', 
          boxSizing: 'border-box',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999, // Se superpone de forma limpia al arrancar
          fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif"
        }}>
          
          {/* TOP: Pestaña minimalista */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              color: '#94a3b8', 
              fontSize: '9px', 
              fontWeight: '600', 
              letterSpacing: '4px',
              border: '1px solid rgba(128, 125, 143, 0.6)',
              backdropFilter: 'blur(10px)'
            }}>
               EASYCASHLESS • MULTI- EVENTO
            </div>
          </div>

          {/* CENTER: Orbe Dorado Champaña y Textos */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', position: 'relative' }}>
            
            {/* ✨ El Orbe de Luz Dorada */}
            <div style={{ 
              width: '280px', 
              height: '280px', 
              borderRadius: '50%', 
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0) 70%)', 
              position: 'absolute',
              top: '-50px',
              zIndex: 1,
              filter: 'blur(10px)'
            }} />

            {/* 👑 ISOTIPO DE MARCA PREMIUM REDISEÑADO (EFECTO CRISTAL Y ORO PULIDO) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', zIndex: 2 }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '50%', // Círculo perfecto
                background: 'rgba(255, 255, 255, 0.05)', // Efecto cristal translúcido
                backdropFilter: 'blur(8px)',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                // 🌟 Borde metálico de oro pulido
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(#111827, #111827), linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                // 🌟 Sombra con resplandor neón dorado
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(212, 175, 55, 0.2)',
                position: 'relative'
              }}>
                {/* Letra 'E' fina y elegante en color oro champaña */}
                <span style={{ 
                  fontWeight: '300', 
                  fontSize: '22px', 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f3e5ab 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "system-ui, sans-serif"
                }}>E</span>
              </div>
              
              {/* Texto de la marca con tipografía estilizada y mayor espacio entre letras */}
              <span style={{ 
                color: '#ffffff', 
                fontWeight: '400', 
                fontSize: '16px', 
                letterSpacing: '5px',
                fontFamily: "system-ui, sans-serif",
                background: 'linear-gradient(90deg, #ffffff 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                EASYCASHLESS
              </span>
            </div>

            {/* Título de Alto Impacto */}
            <h1 style={{ color: '#ffffff', fontSize: '45px', fontWeight: '300', margin: '0 0 16px 0', lineHeight: '1.25', zIndex: 2, letterSpacing: '-0.5px' }}>
              BIENVENIDO<br />
              <span style={{ fontWeight: '700', background: 'linear-gradient(90deg, #ffffff 0%, #f3e5ab 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                
              </span>
            </h1>

            {/* Resumen guía */}
            <p style={{ color: '#94a3b8', 
              fontSize: '15px', // Bajamos a 15px para que respire mejor en pantallas móviles
              margin: '15px auto 0 auto', // Agrega espacio arriba y centra la caja horizontalmente
              maxWidth: '280px', 
              lineHeight: '1.6', 
              fontFamily: "system-ui, Roboto, sans-serif", // Quitamos la coma rota
              zIndex: 2, 
              fontWeight: '400', // Un grosor más fino (400) evita el empastamiento visual
              textAlign: 'center', // 🌟 CENTRA EL TEXTO DE FORMA ABSOLUTA
              width: '100%'}}>
             Gestiona saldos, accesos y consumos en barras de forma inmediata
            </p>
          </div>

          {/* BOTTOM: Botón Ovalado de Acción */}
          <button 
            type="button"
            onClick={() => setMostrarBienvenida(false)} // Oculta esta pantalla web y abre tu app
            style={{ 
              width: '100%', 
              maxWidth: '290px', 
              padding: '16px 0', 
              borderRadius: '30px', 
              border: 'none', 
              background: 'linear-gradient(90deg, #72736c 0%, #f8fafc 100%)', 
              color: '#0f172a', 
              fontWeight: '700', 
              fontSize: '19px', 
              cursor: 'pointer', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4)',
              letterSpacing: '2px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            COMENZAR ➔
          </button>

        </div>
      ):      

      // 🌟 REGLA DE ORO DE DISEÑO: Agregamos un colchón de relleno superior (paddingTop) para obligar a Android a bajar todo el diseño
    <div style={{ padding: '15px', paddingTop: '35px', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: 'transparent', boxSizing: 'border-box' }}>
      
      {/* 🎛️ SELECTOR DE CANAL INTELIGENTE MULTI-EVENTO CORREGIDO CON TUS ENLACES REALES */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
        <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>CANAL:</label>
        <select 
          value={apiUrlDinamica}
          onChange={(e) => cambiarCanalEvento(e.target.value, e.target)}
          style={{ backgroundColor: '#0f172a', color: '#2c909e', border: '1px solid #2c909e', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {/* 🌟 Canal 1: Tu primer servidor real de toda la vida */}
          <option value="https://sistema-nfc-monedero-production.up.railway.app">🎟️ Evento 1 (Principal)</option>
          
          {/* 🌟 Canal 2: Tu segundo servidor duplicado con la palabra copy-1 */}
          <option value="https://sistema-nfc-monedero-copy-1-production.up.railway.app">🎵 Evento 2 (Copia)</option>
        </select>
      </div>
      
      {/* 🧭 BARRA DE PESTAÑAS ADAPTADA PARA TOUCH */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#e9ecef', padding: '5px', borderRadius: '8px' }}>
        <button 
          onClick={() => setPestañaActiva('pulseras')} 
          style={{
            flex: 1, padding: '14px', cursor: 'pointer', fontSize: '16px',
            backgroundColor: pestañaActiva === 'pulseras' ? '#007bff' : 'transparent', 
            color: pestañaActiva === 'pulseras' ? 'white' : '#495057', 
            border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s'
          }}
        >
          🎟️ Pulseras
        </button>
        <button onClick={() => setPestañaActiva('productos')} 
          style={{
            flex: 1, padding: '14px', cursor: 'pointer', fontSize: '16px',
            backgroundColor: pestañaActiva === 'productos' ? '#007bff' : 'transparent', 
            color: pestañaActiva === 'productos' ? 'white' : '#495057', 
            border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s'
          }}
        >
          🍺 Punto de Venta
        </button>
      </div>

            {/* 🎟️ CONTENEDOR DE LA PESTAÑA DE PULSERAS AJUSTADO PARA EL BOTÓN FLOTANTE */}
      {pestañaActiva === 'pulseras' && (
        <div>
          {/* Bloque Gris de Estadísticas */}
          <div style={{ display: "flex", marginBottom: "15px" }}>
            <div style={{ flex: 1, border: "1px solid #ced4da", padding: "15px", borderRadius: "8px", backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <h4 style={{ margin: 0, color: '#6c757d', fontSize: '14px', uppercase: 'true' }}>Total Pulseras</h4>
              <h2 style={{ margin: '5px 0 0 0', color: '#212529' }}>{pulseras.length}</h2>
            </div>
          </div>

          {/* 📱 TABLA ADAPTADA CON TODAS LAS COLUMNAS REALES DE TU FOTO + ACCIÓN */}
          <div style={{ width: '100%', margin: '12px 0', boxSizing: 'border-box' }}>
            <table border="1" cellPadding="4" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderColor: '#dee2e6', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f5', color: '#495057', fontSize: '12px' }}>
                  <th style={{ padding: '8px 4px' }}>NFC</th>
                  <th style={{ padding: '8px 4px' }}>Acceso</th>
                  <th style={{ padding: '8px 4px' }}>Saldo</th>
                  <th style={{ padding: '8px 4px' }}>Caja</th>
                  <th style={{ padding: '8px 4px' }}>Acción</th> {/* 🌟 Tu nueva columna de protección */}
                </tr>
              </thead>
              <tbody>
                {pulseras.map((p) => (
                  <tr key={p.codigo_nfc} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ fontWeight: '500', padding: '10px 4px', wordBreak: 'break-all', fontSize: '12px' }}>{p.codigo_nfc}</td>
                     <td style={{ padding: '10px 4px', fontSize: '12px', color: '#17a2b8', fontWeight: 'bold' }}>
            {p.tipo_acceso || p.acceso || 'General'}
          </td>
                    <td style={{ fontWeight: 'bold', color: '#28a745', padding: '10px 4px' }}>${p.saldo}</td>
                    
                    {/* Columna Caja: Botón de Recargar de tu foto */}
                    <td style={{ padding: '10px 4px' }}>
                      <button type="button" onClick={async () => {
                        const m = prompt(`¿Cuánto saldo deseas recargar a la pulsera ${p.codigo_nfc}?`);
                        if (!m || isNaN(m) || parseFloat(m) <= 0) { alert('Monto inválido.'); return; }
                        try {
                          await axios.put(`${apiUrlDinamica}/pulseras/recargar`, { codigo_nfc: p.codigo_nfc, monto: parseFloat(m) });
                          alert('¡Recarga exitosa!'); cargarPulseras();
                        } catch (e) { alert('No se pudo procesar la recarga.'); }
                      }} style={{ padding: '6px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>💵 Recargar</button>
                    </td>

                    {/* Columna Acción: 🗑️ Bote de Basura con Candado admin123 */}
                    <td style={{ padding: '10px 4px' }}>
                      <button 
                        type="button" 
                        onClick={async () => {
                          const claveSeguridad = prompt('🔒 AUTORIZACIÓN REQUERIDA:\nIntroduzca la clave de administrador para eliminar esta pulsera de la caja:');
                          if (!claveSeguridad) return;

                          if (claveSeguridad !== 'admin123') {
                            alert('❌ Clave incorrecta. Acción denegada.');
                            return;
                          }

                          if (!window.confirm(`¿Confirmas la eliminación permanente de la pulsera ${p.codigo_nfc}?`)) {
                            return;
                          }

                          try {
                            const res = await axios.delete(`${apiUrlDinamica}/pulseras/eliminar/${p.codigo_nfc}`);
                            alert(res.data.mensaje);
                            cargarPulseras(); 
                          } catch (e) {
                            alert(e.response?.data?.error || 'No se pudo eliminar la pulsera.');
                          }
                        }} 
                        style={{ padding: '6px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>

                  </tr>
                ))}
                {pulseras.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', color: '#6c757d' }}>No hay pulseras registradas.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* 🔵 TU BOTÓN FLOTANTE ORIGINAL RECONSTRUIDO */}
          <button 
            type="button" 
            onClick={() => setMostrarModal(true)} // 🌟 REEMPLAZA AQUÍ con el nombre exacto de tu función original
            style={{ position: 'fixed', bottom: '80px', right: '20px', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', border: 'none', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
          >
            +
          </button>

        </div>
      )}

      {pestañaActiva === 'productos' && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          
          {/* Módulo de Venta Móvil (Ancho Completo) */}
          <div style={{ border: '1px solid #ced4da', padding: '20px', borderRadius: '8px', width: '100%', backgroundColor: 'white', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#212529' }}>📱 Registrar Cobro</h3>
            <form onSubmit={procesarVenta} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* 📱 CASILLA DE LECTURA DE PULSERA NFC CORREGIDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>Escanear Pulsera NFC:</label>
                <input 
                  type="text" 
                  value={pulseraVenta} 
                  onChange={(e) => setPulseraVenta(e.target.value)} 
                  placeholder="Ej: NFC0001" 
                  required 
                  style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#0f172a', color: 'white', fontSize: '16px', boxSizing: 'border-box' }} 
                />
              </div>
              

              {/* 🍺 MENÚ DESPLEGABLE DE ARTÍCULOS CORREGIDO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>Seleccionar Artículo:</label>
                <select 
                  value={productoSeleccionado} 
                  onChange={(e) => setProductoSeleccionado(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '15px', cursor: 'pointer' }}
                >
                  {/* 🌟 REGLA DE ORO: Recorremos los productos del evento de forma inteligente */}
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id} style={{ backgroundColor: '#0f172a', color: 'white' }}>
                      {prod.nombre} - ${prod.precio} (Stock: {prod.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Verde Original de Cobros */}
              <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '2px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                Confirmar Compra Cashless
              </button>
              {/* ↩️ BOTÓN DE EMERGENCIA DE REVERSIÓN AUTÓNOMO */}
              {/* ↩️ BOTÓN INTELIGENTE: ABRE LA NUEVA VENTANA DE HISTORIAL DE COMPRAS */}
              <button 
                type="button" 
                onClick={async () => {
                  const codigoPulsera = prompt('Por favor, ingresa o escanea el código de la pulsera para ver su historial de compras:');
                  if (!codigoPulsera || !codigoPulsera.trim()) return;

                  const uidLimpio = codigoPulsera.trim().toUpperCase();

                  try {
                    // Consultamos el historial al servidor dinámico activo (Canal 1 o Canal 2)
                    const res = await axios.get(`${apiUrlDinamica}/ventas/historial/${uidLimpio}`);
                    
                    if (res.data.length === 0) {
                      alert('ℹ️ Esta pulsera no tiene ninguna compra registrada en este evento.');
                      return;
                    }
                    
                    // Guardamos las compras y abrimos la hermosa ventana modal emergente
                    setHistorialVentas(res.data);
                    setPulseraSeleccionadaHistorial(codigoPulsera.trim());
                    setMostrarModalHistorial(true);

                  } catch (e) {
                    console.error("Error al obtener historial:", error);
                    alert('❌ No se pudo conectar con el servidor para leer el historial.');
                  }
                }} 
                style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '6px', border: '1px solid #dc3545', backgroundColor: 'transparent', color: '#dc3545', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', boxSizing: 'border-box' }}
              >
                ↩️ Cancelar Venta Específica / Historial
              </button>

            </form>
          </div>

          {/* Catálogo de Productos Móvil */}
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#212529' }}>🍺 Catálogo de Productos</h3>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button type="button" onClick={async () => {
                  const c1 = window.confirm("¿Estás SEGURO de que deseas finalizar el evento? Esto borrará todas las pulseras, productos e historial.");
                  if (!c1) return;
                  const c2 = prompt("Para confirmar la eliminación absoluta, escribe la palabra: REINICIAR");
                  if (c2 !== "REINICIAR") { alert("Confirmación incorrecta."); return; }
                   try {
                    // 🌟 CORREGIDO AQUÍ: Cambiamos el .post viejo por .delete y apuntamos a /pulseras/limpiar
                    const res = await axios.delete(`${apiUrlDinamica}/pulseras/limpiar`);
                    alert(res.data.mensaje || '🧹 Evento reiniciado con éxito.');
                    cargarPulseras(); 
                    cargarProductos();
                  } catch (err) { 
                    alert("Error al intentar reiniciar el sistema."); 
                  }
                }} 
                style={{ flex: 1, padding: '12px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🧹 Limpiar Evento</button>
                <button type="button" onClick={() => setMostrarModalProducto(true)} style={{ flex: 1, padding: '12px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>➕ Añadir Bebida</button>
              </div>
            </div>

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderColor: '#dee2e6' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f5', color: '#495057' }}><th>ID</th><th>Producto</th><th>Precio</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px 8px' }}>{prod.id}</td>
                    <td style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '500' }}>{prod.nombre}</td>
                    <td style={{ fontWeight: 'bold', padding: '12px 8px' }}>${prod.precio}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px', color: '#6c757d' }}>{prod.stock} pzas</td>
                  </tr>
                ))}
                {productos.length === 0 && <tr><td colSpan="4" style={{ padding: '20px', color: '#6c757d' }}>No hay productos en el catálogo.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENTANA MODAL RESPONSIVA: REGISTRO PULSERAS */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px', color: '#333', boxShadow: '0px 8px 24px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>🎟️ Nueva Pulsera Cashless</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Código NFC:</label>
                <input type="text" value={codigoNfc} onChange={(e) => setCodigoNfc(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Tipo de Acceso:</label>
                {/* ✅ VERSIÓN REPARADA, ESTABLE Y COMPATIBLE CON TU CÓDIGO */}
                <select 
          value={typeof tipoAccesoId !== 'undefined' ? tipoAccesoId : (typeof tipo_acceso_id !== 'undefined' ? tipo_acceso_id : '')} 
          onChange={(e) => {
            if (typeof setTipoAcceso === 'function') {
              setTipoAcceso(e.target.value);
            } else if (typeof setTipoAccesoId === 'function') {
              setTipoAccesoId(e.target.value);
            }
          }}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', display: 'block', marginTop: '5px' }}
        >
          <option value="">-- Seleccione un acceso --</option>
          <option value="General">General</option>
          <option value="VIP">VIP</option>
          <option value="Cover">Cover</option>
          <option value="Backstage">Backstage</option>
          <option value="Cortesia">Cortesia</option>
        </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Saldo Inicial ($):</label>
                <input type="number" step="0.01" value={saldo} onChange={(e) => setSaldo(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Cancelar</button>
                <button type="button" onClick={guardarPulsera} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* VENTANA MODAL RESPONSIVA: REGISTRO PRODUCTOS */}
      {mostrarModalProducto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px', color: '#333', boxShadow: '0px 8px 24px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>🍔 Añadir Nueva Bebida</h3>
            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Nombre de la Bebida:</label>
                <input type="text" value={nombreProducto} onChange={(e) => setNombreProducto(e.target.value)} placeholder="Ej: Whisky" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Precio de Venta ($):</label>
                <input type="number" step="0.01" value={precioProducto} onChange={(e) => setPrecioProducto(e.target.value)} placeholder="Ej: 150" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057' }}>Inventario / Stock:</label>
                <input type="number" value={stockProducto} onChange={(e) => setStockProducto(e.target.value)} placeholder="Ej: 100" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setMostrarModalProducto(false)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Agregar al Menú</button>
              </div>
            </form>
          </div>
        </div>
      )}
       {/* 🖼️ VENTANA MODAL FLOTANTE DE HISTORIAL Y REVERSIÓN QUIRÚRGICA */}
      {mostrarModalHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>📜 Compras de: <strong style={{ color: '#007bff' }}>{pulseraSeleccionadaHistorial}</strong></h3>
              <button onClick={() => setMostrarModalHistorial(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', fontWeight: 'bold' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>Selecciona con tu dedo cuál bebida deseas cancelar del saldo de la pulsera:</p>

            {/* Lista con scroll de artículos comprados */}
            <div style={{ maxHieght: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
              {historialVentas.map((ticket) => (
                <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '13px' }}>🍺 {ticket.producto_nombre || 'Artículo de Barra'}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(ticket.fecha_venta).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>-${ticket.total}</span>
                    
                    {/* Botón de borrado quirúrgico por ID de ticket exacto */}
                    <button 
                      type="button"
                      onClick={async () => {
                        // 🔐 Solicitamos la clave de supervisor antes de eliminar una compra
                        const claveSuper = prompt('🔒 AUTORIZACIÓN DE BARRA:\nIntroduzca la clave de administrador para deshacer este cobro:');
                        if (!claveSuper) return;
                        if (claveSuper !== 'admin123') { alert('❌ Clave incorrecta.'); return; }

                        if (!window.confirm(`¿Confirmas la cancelación de esta compra? Se devolverán $${ticket.total} a la pulsera.`)) return;

                        try {
                          // 📡 Mandamos la orden al backend con el ID del ticket exacto
                          const res = await axios.post(`${apiUrlDinamica}/ventas/revertir`, { venta_id: ticket.id });
                          alert(res.data.mensaje || '¡Reversión completada!');
                          
                          setMostrarModalHistorial(false); // Cerramos la ventana
                          cargarPulseras(); // Refrescamos listas en vivo
                          cargarProductos();
                        } catch (err) {
                          alert(err.response?.data?.error || 'No se pudo procesar la cancelación.');
                        }
                      }}
                      style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                    >
                      ↩️ Cancelar
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 💻 FIRMA DE AUTOR PREMIUM: Ubicada perfectamente al fondo de la pantalla principal */}
      <footer style={{ marginTop: 'auto', padding: '20px 0 10px 0', textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
        Desarrollado con ❤️ por <strong>Vania Solis</strong> &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}

export default App;

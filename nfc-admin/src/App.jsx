import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
  // 📡 ANTENAS DE INTERNET DINÁMICAS: Arranca sintonizado por defecto en tu Evento 1
  const [apiUrlDinamica, setApiUrlDinamica] = useState('https://sistema-nfc-monedero-production.up.railway.app');

  // 🧠 FUNCIÓN DE CAMBIO DE CANAL BLINDADA CON CLAVE ADMINISTRATIVA (NUEVA CONTRACERRADURA)
  const cambiarCanalEvento = (nuevoEnlace, elementoSelect) => {
    // 🔐 Pedimos la clave secreta al operador
    const claveIntroducida = prompt('🔒 Introduzca el código maestro de administrador para cambiar de evento:');
    
    // 🌟 CLAVE MAESTRA DEFINIDA: Clave secreta de seguridad
    if (claveIntroducida === 'admin123') {
      setApiUrlDinamica(nuevoEnlace);
      alert('✅ Código correcto. Sintonizando nuevo canal de evento en la nube...');
      
      setTimeout(() => {
        if (typeof cargarPulseras === 'function') cargarPulseras();
        if (typeof cargarProductos === 'function') cargarProductos();
      }, 300);
    } else {
      alert('❌ Código incorrecto. Acceso denegado para cambiar el evento.');
      
      // 🔄 TRUCO DE ORO: Regresamos el menú visual a la URL que ya estaba activa
      if (elementoSelect) {
        elementoSelect.value = apiUrlDinamica;
      }
    }
  };

  // ... Aquí continúan tus demás funciones como cargarPulseras, procesarVenta, etc. ...
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

   // 🛰️ MOTOR NFC UNIVERSAL: Captura el UID de cualquier chip del planeta (Tarjetas o Pulseras)
  useEffect(() => {
    cargarPulseras();
    cargarProductos();

    // Verificamos si el plugin nativo está montado en el celular
    if (window.nfc) {
      // 🌟 CAMBIO CLAVE: Usamos 'addTagDiscoveredListener' para leer identificadores base (UID)
      window.nfc.addTagDiscoveredListener(
        (nfcEvent) => {
          const tag = nfcEvent.tag;
          if (tag && tag.id) {
            // Convertimos los bytes nativos del chip a una cadena de texto limpia
            const codigoHex = window.nfc.bytesToHexString(tag.id).toUpperCase();
            
            if (codigoHex) {
              setCodigoNfc(codigoHex);
              setMostrarModal(true); // Forzamos al formulario a abrirse con el código inyectado
              alert(`¡Chip NFC Detectado con éxito!\nCódigo: ${codigoHex}`);
            }
          }
        },
        () => console.log('✅ Antena universal NFC del Samsung S25 en línea...'),
        (err) => console.error('❌ Error en hardware NFC:', err)
      );
    }
  }, []);

    // 🎟️ FUNCIÓN CORRECTA PARA LEER LAS PULSERAS DESDE RAILWAY
  const cargarPulseras = async () => {
    try { 
      // Le pedimos la lista a tu servidor en internet de forma limpia
      const res = await axios.get(`${apiUrlDinamica}/pulseras`); 
      setPulseras(res.data); 
    } catch (e) { 
      console.error("Error al cargar pulseras desde la nube:", e); 
    }
  };

  // 🍺 FUNCIÓN CORRECTA PARA LEER LAS BEBIDAS DESDE RAILWAY
  const cargarProductos = async () => {
    try { 
      // Le pedimos el menú a tu servidor en internet
      const res = await axios.get(`${apiUrlDinamica}/productos`); 
      setProductos(res.data); 
    } catch (e) { 
      console.error("Error al cargar productos desde la nube:", e); 
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
    if (!pulseraVenta || !productoSeleccionado) {
      alert('Por favor llene todos los campos del punto de venta');
      return;
    }
    try {
      const res = await axios.post(`${apiUrlDinamica}/ventas`, {
        codigo_nfc: pulseraVenta.trim(),
        producto_id: parseInt(productoSeleccionado)
      });
      alert(res.data.mensaje);
      setPulseraVenta(''); // Limpia la casilla del cajero de la barra
      cargarPulseras();    // Recarga saldos en tiempo real
      cargarProductos();   // Recarga inventarios en tiempo real
    } catch (err) {
      console.error("Error en cobro:", err);
      alert(err.response?.data?.error || 'Falla controlada en ventas');
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
  };

  return (
        // 🌟 REGLA DE ORO DE DISEÑO: Forzamos flex y minHeight para que el pie de página se vaya al fondo real del celular
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
                    <td style={{ padding: '10px 4px', fontSize: '12px' }}>{obtenerTextoAcceso(p.tipo_acceso_id)}</td>
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
              <button 
                type="button" 
                onClick={async () => {
                  const codigoPulsera = prompt('Por favor, ingresa o escanea el código de la pulsera para cancelar su última venta:');
                  if (!codigoPulsera) return;

                  if (!window.confirm(`¿Estás seguro de que deseas cancelar la última venta de la pulsera ${codigoPulsera}?`)) {
                    return;
                  }

                  try {
                    const res = await axios.post(`${apiUrlDinamica}/ventas/revertir`, { codigo_nfc: codigoPulsera });
                    alert(res.data.mensaje || '¡Venta cancelada con éxito!');
                    if (typeof cargarPulseras === 'function') cargarPulseras();
                    if (typeof cargarProductos === 'function') cargarProductos();
                  } catch (e) {
                    console.error("Error en la reversión:", e);
                    alert(e.response?.data?.error || 'Error al intentar revertir la venta.');
                  }
                }} 
                style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '6px', border: '1px solid #dc3545', backgroundColor: 'transparent', color: '#dc3545', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', boxSizing: 'border-box' }}
              >
                ↩️ Cancelar Última Venta / Reversión
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
                    const res = await axios.post(`${apiUrlDinamica}/api/sistema/reiniciar-evento`);
                    alert(res.data.mensaje); cargarPulseras(); cargarProductos();
                  } catch (err) { alert("Error al intentar reiniciar el sistema."); }
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
                <select value={tipoAccesoId} onChange={(e) => setTipoAccesoId(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: 'white', fontSize: '16px' }}>
                  <option value="">-- Seleccione un acceso --</option>
                  <option value="1">General</option><option value="2">VIP</option><option value="3">Cover</option><option value="4">Backstage</option><option value="5">Cortesia</option>
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

      {/* 💻 FIRMA DE AUTOR PREMIUM: Ubicada perfectamente al fondo de la pantalla principal */}
      <footer style={{ marginTop: 'auto', padding: '20px 0 10px 0', textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
        Desarrollado con ❤️ por <strong>Vania Solis</strong> &copy; {new Date().getFullYear()}
      </footer>

    </div>
  );
}

export default App;

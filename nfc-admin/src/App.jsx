import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
  // 🌍 ENLACE REAL Y ACTIVO DE TU PANEL DE RAILWAY:
  const API_URL = 'https://sistema-nfc-monedero-copy-1-production.up.railway.app';
  
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
      const res = await axios.get(`${API_URL}/pulseras`); 
      setPulseras(res.data); 
    } catch (e) { 
      console.error("Error al cargar pulseras desde la nube:", e); 
    }
  };

  // 🍺 FUNCIÓN CORRECTA PARA LEER LAS BEBIDAS DESDE RAILWAY
  const cargarProductos = async () => {
    try { 
      // Le pedimos el menú a tu servidor en internet
      const res = await axios.get(`${API_URL}/productos`); 
      setProductos(res.data); 
    } catch (e) { 
      console.error("Error al cargar productos desde la nube:", e); 
    }
  };

    // ➕ FUNCIÓN CORRECTA PARA REGISTRAR EN LA NUBE
  const guardarPulsera = async () => {
    try {
      const res = await axios.post(`${API_URL}/pulseras`, {
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
      const res = await axios.post(`${API_URL}/productos`, { 
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

    const procesarVenta = async (e) => {
    e.preventDefault();
    try {
      // 🚀 Mandamos los datos limpios al backend usando Axios
      const res = await axios.post(`${API_URL}/ventas`, { 
        codigo_nfc: pulseraVenta, 
        producto_id: parseInt(productoSeleccionado) 
      });

      // 🌟 Alerta única de éxito real
      alert(res.data.mensaje || '¡Compra procesada con éxito!'); 
      
      // Limpiamos los campos del formulario
      setPulseraVenta(''); 
      setProductoSeleccionado(''); 
      
      // 🔄 Recargamos los datos limpios desde internet de forma externa
      cargarPulseras(); 
      cargarProductos();

    } catch (e) { 
      console.error("Falla controlada en ventas:", e);
      alert(e.response?.data?.error || 'Error en la venta'); 
    }
  };

  const descargarExcelProductos = async () => {
    try {
      const res = await axios.get(`${API_URL}/reporte-ventas`);
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
    <div style={{ padding: '15px', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', backgroundColor: 'transparent', boxSizing: 'border-box' }}>
      
      <h2 style={{ textAlign: 'center', margin: '30px 0 20px 0', color: '#1e293b', fontWeight: 'bold', fontSize: '22px' }}>
        🎟️ Panel Cashless NFC
      </h2>
      
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

      {pestañaActiva === 'pulseras' && (
        <div>
          <div style={{ display: "flex", marginBottom: "15px" }}>
            <div style={{ flex: 1, border: "1px solid #ced4da", padding: "15px", borderRadius: "8px", backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
              <h4 style={{ margin: 0, color: '#6c757d', fontSize: '14px', uppercase: 'true' }}>Total Pulseras</h4>
              <h2 style={{ margin: '5px 0 0 0', color: '#212529' }}>{pulseras.length}</h2>
            </div>
          </div>
                    {/* 📱 CONTENEDOR AJUSTADO AL 100% (Sin necesidad de deslizar) */}
          <div style={{ width: '100%', margin: '12px 0', boxSizing: 'border-box' }}>
            
            <table border="1" cellPadding="4" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderColor: '#dee2e6', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f3f5', color: '#495057', fontSize: '12px' }}>
                  <th style={{ padding: '8px 4px' }}>NFC</th>
                  <th style={{ padding: '8px 4px' }}>Acceso</th>
                  <th style={{ padding: '8px 4px' }}>Saldo</th>
                  <th style={{ padding: '8px 4px' }}>Caja</th>
                </tr>
              </thead>
              <tbody>
                {pulseras.map((p) => (
                  <tr key={p.codigo_nfc} style={{ borderBottom: '1px solid #dee2e6' }}>
                    {/* Código NFC con salto de línea automático si es muy largo */}
                    <td style={{ fontWeight: '500', padding: '10px 4px', wordBreak: 'break-all', fontSize: '12px' }}>{p.codigo_nfc}</td>
                    <td style={{ padding: '10px 4px', fontSize: '12px' }}>{obtenerTextoAcceso(p.tipo_acceso_id)}</td>
                    <td style={{ fontWeight: 'bold', color: '#28a745', padding: '10px 4px' }}>${p.saldo}</td>
                    <td style={{ padding: '10px 4px' }}>
                      <button type="button" onClick={async () => {
                        const m = prompt(`¿Cuánto saldo deseas recargar a la pulsera ${p.codigo_nfc}?`);
                        if (!m || isNaN(m) || parseFloat(m) <= 0) { alert('Monto inválido.'); return; }
                        try {
                          await axios.put(`${API_URL}/pulseras/recargar`, { codigo_nfc: p.codigo_nfc, monto: parseFloat(m) });
                          alert('¡Recarga exitosa!'); cargarPulseras();
                        } catch (e) { alert('No se pudo procesar la recarga.'); }
                      }} style={{ padding: '6px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>💵 Recargar</button>
                    </td>
                  </tr>
                ))}
                {pulseras.length === 0 && <tr><td colSpan="4" style={{ padding: '20px', color: '#6c757d' }}>No hay pulseras registradas.</td></tr>}
              </tbody>
            </table>

          </div>

          <button onClick={() => setMostrarModal(true)} style={{ position: 'fixed', bottom: '75px', right: '25px', width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', fontSize: '35px', border: 'none', cursor: 'pointer', boxShadow: '0px 4px 12px rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '300' }}>+</button>
        </div>
      )}

      {pestañaActiva === 'productos' && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          
          {/* Módulo de Venta Móvil (Ancho Completo) */}
          <div style={{ border: '1px solid #ced4da', padding: '20px', borderRadius: '8px', width: '100%', backgroundColor: 'white', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#212529' }}>📱 Registrar Cobro</h3>
            <form onSubmit={procesarVenta} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>Escanear/Ingresar Pulsera:</label>
                <input type="text" value={pulseraVenta} onChange={(e) => setPulseraVenta(e.target.value)} placeholder="Ej: NFC0001" required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px' }}>Seleccionar Artículo:</label>
                <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', backgroundColor: 'white', fontSize: '16px' }}>
                  <option value="">-- Seleccione un artículo --</option>
                  {productos.map((prod) => <option key={prod.id} value={prod.id}>{prod.nombre} (${prod.precio})</option>)}
                </select>
              </div>
              <button type="submit" style={{ padding: '14px', borderRadius: '6px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '5px' }}>Confirmar Compra Cashless</button>
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
                    const res = await axios.post(`${API_URL}/api/sistema/reiniciar-evento`);
                    alert(res.data.mensaje); cargarPulseras(); cargarProductos();
                  } catch (err) { alert("Error al intentar reiniciar el sistema."); }
                }} style={{ flex: 1, padding: '12px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🧹 Limpiar Evento</button>
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

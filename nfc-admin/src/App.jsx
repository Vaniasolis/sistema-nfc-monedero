import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

function App() {
  // 🌍 URL LOCAL PARA PRUEBAS EN TU COMPUTADORA
  const API_URL = 'http://localhost:3000';
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
  
  // Estados: Control del modal de productos y sus campos
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [nombreProducto, setNombreProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [stockProducto, setStockProducto] = useState('');

  useEffect(() => {
    cargarPulseras();
    cargarProductos();
  }, []);

  const cargarPulseras = async () => {
    try {
      const res = await axios.get(`${API_URL}/pulseras`);
      setPulseras(res.data);
    } catch (error) {
      console.error("Error al cargar pulseras:", error);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await axios.get(`${API_URL}/productos`);
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

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
        cargarPulseras();
        alert('Pulsera dada de alta correctamente.');
      }
    } catch (error) {
      console.error("Error al guardar pulsera:", error);
      alert('Error al intentar guardar la pulsera. Verifica los campos.');
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
        alert('¡Bebida/Producto añadido al catálogo con éxito!');
      }
    } catch (error) {
      console.error(error);
      alert('Error al registrar el producto en el catálogo');
    }
  };

  const procesarVenta = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/ventas`, {
        codigo_nfc: pulseraVenta,
        producto_id: parseInt(productoSeleccionado)
      });
      alert(res.data.mensaje);
      setPulseraVenta('');
      setProductoSeleccionado('');
      cargarPulseras();
      cargarProductos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Error al procesar la venta');
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
        const precioNum = Math.round(parseFloat(item.precio_articulo));
        let nombreBebida = `Bebida de $${precioNum}`;
        
        if (precioNum === 250) nombreBebida = "Wisky";
        if (precioNum === 180) nombreBebida = "Cerveza";
        if (precioNum === 200) nombreBebida = "Piña Colada";

        return {
          "Bebida / Artículo": nombreBebida,
          "Precio Unitario ($)": precioNum,
          "Cantidad Total Vendida": `${item.cantidad_vendida} pzas`,
          "Monto Recaudado Total ($)": parseFloat(item.total_recaudado)
        };
      });

      const hoja = XLSX.utils.json_to_sheet(datosFormateados);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Listado de Ventas Totales");
      XLSX.writeFile(libro, "Reporte_Ventas_Final.xlsx");
    } catch (error) {
      console.error(error);
      alert("Error al procesar y descargar el reporte de ventas.");
    }
  };

  const obtenerTextoAcceso = (id) => {
    if (id === 1) return 'General';
    if (id === 2) return 'VIP';
    if (id === 3) return 'Cover';
    if (id === 4) return 'Backstage';
    if (id === 5) return 'Cortesia';
    return 'Otro';
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Sistema NFC</h1>

      {/* 🧭 BARRA DE PESTAÑAS (TABS) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <button 
          onClick={() => setPestañaActiva('pulseras')}
          style={{
            padding: '10px 20px', cursor: 'pointer',
            backgroundColor: pestañaActiva === 'pulseras' ? '#007bff' : '#f0f0f0',
            color: pestañaActiva === 'pulseras' ? 'white' : '#333',
            border: 'none', borderRadius: '5px', fontWeight: 'bold'
          }}
        >
          🎟️ Control de Pulseras
        </button>
        <button 
          onClick={() => setPestañaActiva('productos')}
          style={{
            padding: '10px 20px', cursor: 'pointer',
            backgroundColor: pestañaActiva === 'productos' ? '#007bff' : '#f0f0f0',
            color: pestañaActiva === 'productos' ? 'white' : '#333',
            border: 'none', borderRadius: '5px', fontWeight: 'bold'
          }}
        >
          🍔 Punto de Venta y Catálogo
        </button>
      </div>

      {/* 📊 CONTENIDO DE LA PESTAÑA: PULSERAS */}
      {pestañaActiva === 'pulseras' && (
        <div>
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px", backgroundColor: '#fafafa' }}>
              <h3 style={{ margin: 0, color: '#555' }}>Total Pulseras</h3>
              <h1 style={{ margin: '10px 0 0 0' }}>{pulseras.length}</h1>
            </div>
          </div>

          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>Codigo NFC</th>
                <th>Tipo de Acceso</th>
                <th>Saldo Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pulseras.map((p) => (
                <tr key={p.codigo_nfc}>
                  <td>{p.codigo_nfc}</td>
                  <td>{obtenerTextoAcceso(p.tipo_acceso_id)}</td>
                  <td style={{ fontWeight: 'bold', color: '#28a745' }}>${p.saldo}</td>
                  <td>
                    <button
                      type="button"
                      onClick={async () => {
                        const monto = prompt(`¿Cuánto saldo deseas recargar a la pulsera ${p.codigo_nfc}?`);
                        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
                          alert('Por favor, ingresa un monto válido mayor a 0.');
                          return;
                        }
                        try {
                          await axios.put(`${API_URL}/pulseras/recargar`, {
                            codigo_nfc: p.codigo_nfc,
                            monto: parseFloat(monto)
                          });
                          alert('¡Recarga exitosa!');
                          cargarPulseras(); 
                        } catch (error) {
                          console.error(error);
                          alert('No se pudo procesar la recarga.');
                        }
                      }}
                      style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      💰 Recargar
                    </button>
                  </td>
                </tr>
              ))}
              {pulseras.length === 0 && (
                <tr>
                  <td colSpan="4">No hay pulseras registradas.</td>
                </tr>
              )}
            </tbody>
          </table>

          <button 
            onClick={() => setMostrarModal(true)}
            style={{
              position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px',
              borderRadius: '50%', backgroundColor: '#007bff', color: 'white', fontSize: '30px',
              border: 'none', cursor: 'pointer', boxShadow: '0px 4px 10px rgba(0,0,0,0.2)', zIndex: 999
            }}
          >
            +
          </button>
        </div>
      )}

     {/* 🛒 CONTENIDO DE LA PESTAÑA: PRODUCTOS */}
      {pestañaActiva === 'productos' && (
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '10px', width: '350px', backgroundColor: '#fdfdfd' }}>
            <h3>Simulador de Cobro</h3>
            <form onSubmit={procesarVenta} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Escanear/Ingresar Pulsera:</label>
                               <input type="text" value={pulseraVenta} onChange={(e) => setPulseraVenta(e.target.value)} placeholder="Ej: NFC0001" required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Seleccionar Producto:</label>
                <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: 'white' }}>
                  <option value="">-- Seleccione un artículo --</option>
                  {productos.map((prod) => <option key={prod.id} value={prod.id}>{prod.nombre} (${prod.precio})</option>)}
                </select>
              </div>
              <button type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Compra</button>
            </form>
          </div>

          <div style={{ flex: 1, minWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Catálogo de Alimentos y Bebidas</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={descargarExcelProductos} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>📥 Descargar Reporte Excel</button>
                <button type="button" onClick={() => setMostrarModalProducto(true)} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Añadir Bebida / Articulo</button>
              </div>
            </div>
            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}><th>ID</th><th>Nombre del Producto</th><th>Precio</th><th>Stock disponible</th></tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id}><td>{prod.id}</td><td style={{ textAlign: 'left' }}>{prod.nombre}</td><td style={{ fontWeight: 'bold' }}>${prod.precio}</td><td>{prod.stock} pzas</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENTANA MODAL (REGISTRO PULSERAS) */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '350px', color: '#333', boxShadow: '0px 5px 15px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Registrar Nueva Pulsera</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Código NFC:</label>
                <input type="text" value={codigoNfc} onChange={(e) => setCodigoNfc(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Tipo de Acceso:</label>
                <select value={tipoAccesoId} onChange={(e) => setTipoAccesoId(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: 'white' }}>
  <option value="">-- Seleccione un acceso --</option>
  <option value="1">General</option>
  <option value="2">VIP</option>
  <option value="3">Backstage</option>
  <option value="4">Cover</option>       {/* ➕ NUEVA OPCIÓN VISUAL */}
  <option value="5">Cortesia</option> {/* ➕ NUEVA OPCIÓN VISUAL */}
</select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Saldo Inicial ($):</label>
                <input type="number" step="0.01" value={saldo} onChange={(e) => setSaldo(e.target.value)} required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>Cancelar</button>
                <button type="button" onClick={guardarPulsera} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENTANA MODAL (REGISTRO PRODUCTOS) */}
      {mostrarModalProducto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '350px', color: '#333', boxShadow: '0px 5px 15px rgba(0,0,0,0.5)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Añadir Nueva Bebida</h3>
            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Nombre de la Bebida:</label>
                <input type="text" value={nombreProducto} onChange={(e) => setNombreProducto(e.target.value)} placeholder="Ej: Whisky" required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Precio de Venta ($):</label>
                <input type="number" step="0.01" value={precioProducto} onChange={(e) => setPrecioProducto(e.target.value)} placeholder="Ej: 150" required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold' }}>Inventario / Stock:</label>
                <input type="number" value={stockProducto} onChange={(e) => setStockProducto(e.target.value)} placeholder="Ej: 100" required style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setMostrarModalProducto(false)} style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Agregar al Menú</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
 
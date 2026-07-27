import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNfcRadar } from './hooks/useNfcRadar';
import Totem from './Totem';


function App() {

      // 🌟 Estado para controlar la pantalla de bienvenida de gala (PÁGALA AQUÍ ARRIBA)
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [contraseñaIngresada, setContraseñaIngresada] = useState('');
  const [errorContraseña, setErrorContraseña] = useState('');
  const [activarModoTotem, setActivarModoTotem] = useState(false);

  // La contraseña oficial que me pida el cliente (la puedes cambiar cuando quieras)
  const CONTRASEÑA_ACCESO_SISTEMA = "admin29"; 

  // 📡 1. URL DINÁMICA (Primero declaramos la variable de internet)
  // 📡 1. URL DINÁMICA (Primero declaramos la variable de internet)
  const [apiUrlDinamica, setApiUrlDinamica] = useState("https://sistema-nfc-monedero-production.up.railway.app");

  // 🛒 ESTADO PARA EL CARRITO DE COMPRAS EN BARRA
  const [carritoVenta, setCarritoVenta] = useState([]);
   
  // 🧠 2. FUNCIÓN DE CAMBIO DE CANAL DE EVENTO (CORREGIDA Y COMPILABLE)
const cambiarCanalEvento = (nuevoEnlace, elementoSelect) => {
  const claveIntroducida = prompt('🔒 Introduzca el código maestro de administrador para cambiar de evento:');
  
  if (claveIntroducida === 'admin29') {
    // 🌟 REPARACIÓN DE ORO: Forzamos el cambio en el estado de React
    setApiUrlDinamica(nuevoEnlace);
    
    // Guardamos permanentemente el enlace activo en el disco para que no se pierda el canal
    localStorage.setItem('enlace_activo_easycashless', nuevoEnlace);
    
    alert('✅ Código correcto. Sintonizando nuevo canal de evento en la nube...');

    // 🚀 INYECCIÓN COMERCIAL: Ejecutamos manualmente la recarga pasándole el enlace fresco
    // Esto fuerza a que se active el bypass del local u cambien los productos en el acto
    setTimeout(() => {
      if (typeof cargarPulseras === 'function') cargarPulseras();
      if (typeof cargarProductos === 'function') cargarProductos();
    }, 200);

  } else {
    alert('❌ Código incorrecto. Acceso denegado.');
    if (elementoSelect) {
      elementoSelect.value = apiUrlDinamica; // Regresa el select a su posición original
    }
  }
};

  // 📱 3. TUS ESTADOS (El bloque que me mostraste antes empieza justo aquí)
  const [pestañaActiva, setPestañaActiva] = useState(() => {
  return localStorage.getItem('ultima_pestana_easycashless') || 'pulseras';
  });
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
  useNfcRadar(setCodigoNfc, setPulseraVenta);

      // 🔄 REFRESCADOR UNIVERSAL POR FOCO VISUAL CONTINUO (CON ARRANQUE EN FRÍO INTEGRADO)
  useEffect(() => {
    
    // 🚀 LA INYECCIÓN DE ORO: Forzamos la carga inmediata en el segundo cero al abrir la aplicación
    console.log("🚀 EASYCASHLESS: Iniciando aplicación, descargando balances de Railway...");
    if (typeof cargarPulseras === 'function') cargarPulseras();
    if (typeof cargarProductos === 'function') cargarProductos();

    const forzarRecargaAlMirarPantalla = () => {
      console.log("¡Pantalla detectó foco visual! Recargando datos de Railway...");
      if (typeof cargarPulseras === 'function') cargarPulseras();
      if (typeof cargarProductos === 'function') cargarProductos();
    };

    // Escucha cada vez que abres o regresas a mirar la app en tu Samsung S25
    window.addEventListener('focus', forzarRecargaAlMirarPantalla);
    
    // Salvavidas extra de visibilidad nativa profunda
    const manejarCambioVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        if (typeof cargarPulseras === 'function') cargarPulseras();
        if (typeof cargarProductos === 'function') cargarProductos();
      }
    };
    document.addEventListener('visibilitychange', manejarCambioVisibilidad);

    return () => {
      window.removeEventListener('focus', forzarRecargaAlMirarPantalla);
      document.removeEventListener('visibilitychange', manejarCambioVisibilidad); // 🧼 Limpieza obligatoria de hilos
    };
  }, [apiUrlDinamica]); // 🚀 Se ejecuta al arrancar y cada vez que cambias de Evento en el menú superior

  // 🎟️ FUNCIÓN CORRECTA PARA LEER LAS PULSERAS DESDE RAILWAY
const cargarPulseras = async () => {
  try { 
    // 🌟 FORZAMOS TU URL REAL DE RAILWAY DIRECTA PARA EVITAR CAÍDAS DE RED EN EL APK
    const enlaceReal = "https://sistema-nfc-monedero-production.up.railway.app";
    
    const res = await axios.get(`${enlaceReal}/pulseras?_nocache=${new Date().getTime()}`, {
      timeout: 7000 // ⏱️ Si en 7 segundos no responde internet, aborta de forma segura sin congelar la app
    }); 
    
    if (res && res.data && Array.isArray(res.data)) {
      const mapaSaldosUnificados = {};

      let saldosPermanentesDisco = {};
      try {
        // Envolvemos la lectura por si Android bloquea el almacenamiento interno
        const datosLocales = localStorage.getItem('saldos_contingencia_evento2');
        saldosPermanentesDisco = datosLocales ? JSON.parse(datosLocales) : {};
      } catch (e) {
        saldosPermanentesDisco = {};
      }

      res.data.forEach(pulsera => {
        if (!pulsera) return;

        // 1. Usamos "pulsera"
        const codigoLimpio = (pulsera.codigo_nfc || pulsera.codigo || '').replace('C-', '').trim().toUpperCase();
        
        if (!codigoLimpio || codigoLimpio.length < 5) return;

        if (!mapaSaldosUnificados[codigoLimpio]) {
          // 2. Usamos "...pulsera"
          mapaSaldosUnificados[codigoLimpio] = { ...pulsera, codigo_nfc: codigoLimpio, saldo: 0 };
        }
        
        // 3. 🌟 LA LÍNEA CRÍTICA: Asegúrate de que aquí diga "pulsera.saldo" de forma estricta
        mapaSaldosUnificados[codigoLimpio].saldo += parseFloat(pulsera.saldo || 0);
      });
      
      setPulseras(Object.values(mapaSaldosUnificados));
    } else {
      // Salvavidas: Si llega algo raro del servidor, inicializa vacío para no romper la pantalla
      setPulseras([]);
    }
  } catch (err) {
    console.error("❌ Error al cargar pulseras desde la nube:", err);
    // 🌟 CLAVE ANTIBLOQUEO: Si el servidor falla o no hay internet, ponemos una lista vacía
    // para que la interfaz turquesa de React cargue de todos modos y no se quede en blanco.
    setPulseras([]); 
  }
};

// 🍺 FUNCIÓN DE CARGA DE BEBIDAS DINÁMICA ULTRA-BLINDADA
const cargarProductos = async () => {
  try {
    const res = await axios.get(`${apiUrlDinamica}/productos`);
    if (Array.isArray(res.data)) {
      setProductos(res.data);
      console.log("📡 MÓDULO SINCRO: Catálogo de bebidas descargado con éxito desde Railway.");
    }
  } catch (err) {
    console.error("❌ Error al cargar catálogo de bebidas:", err);
  }
};

// ➕ FUNCIÓN CORRECTA PARA REGISTRAR EN LA NUBE (ALINEADA AL SERVER.JS)
const guardarPulsera = async () => {
  try {
    const codigoAEnviar = codigoNfc || pulseraVenta || '';

    if (!codigoAEnviar || codigoAEnviar.trim() === '') {
      alert('⚠️ Esperando lectura: Por favor, acerca la pulsera NFC al teléfono antes de guardar.');
      return;
    }

    // 🌟 TRADUCTOR SALVAVIDAS: Si el selector visual envía un ID viejo (string o número),
    // lo traducimos al texto exacto que tu nuevo backend procesa con éxito.
    let accesoTexto = String(tipoAccesoId).trim();
    if (accesoTexto === '1' || accesoTexto.toLowerCase() === 'general') accesoTexto = 'General';
    if (accesoTexto === '2' || accesoTexto.toLowerCase() === 'vip') accesoTexto = 'VIP';
    if (accesoTexto === '3' || accesoTexto.toLowerCase() === 'backstage') accesoTexto = 'Backstage';
    if (accesoTexto === '4' || accesoTexto.toLowerCase() === 'cortesia' || accesoTexto.toLowerCase() === 'cortesía') accesoTexto = 'Cortesia';
    if (accesoTexto === '5' || accesoTexto.toLowerCase() === 'staff') accesoTexto = 'Staff';

    // 🌟 ENVIAMOS LA PETICIÓN UNIFICADA Y CORREGIDA A RAILWAY
    const res = await axios.post(`${apiUrlDinamica}/pulseras`, {
      codigo_nfc: codigoAEnviar.trim().toUpperCase(),
      tipo_pulsera: tipoAccesoId, // 🌟 PARCHE DE ORO: Cambiado a "tipo_pulsera" enviando el ID (1,2,3,4,5)
      saldo: parseFloat(saldo) || 0
    });

    if (res.status === 200 || res.status === 201 || res.data.exito) {
      setCodigoNfc('');
      setPulseraVenta('');
      setTipoAccesoId('');
      setSaldo('');
      if (typeof setMostrarModal === 'function') setMostrarModal(false);
      
      setTimeout(() => {
        if (typeof cargarPulseras === 'function') cargarPulseras();
      }, 800);

      alert('¡Pulsera guardada con éxito en la nube!');
    }
  } catch (e) {
    console.error("Falla al guardar:", e);
    alert(e.response?.data?.error || 'Error de red al conectar con el servidor de Railway');
  }
};

    // ➕ FUNCIÓN PARA GUARDAR PRODUCTO EN RAILWAY
const guardarProducto = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(`${apiUrlDinamica}/productos`, { 
      nombre: nombreProducto, 
      precio: parseFloat(precioProducto), 
      stock: parseInt(stockProducto || 0) 
    });
    
    if (res.data.exito) {
      setNombreProducto(''); 
      setPrecioProducto(''); 
      setStockProducto(''); 
      setMostrarModalProducto(false); 
      
      // 🚀 TRUCO DE INGENIERÍA: Le damos 800ms a Neon SQL para guardar antes de recargar el catálogo
      setTimeout(() => {
        if (typeof cargarProductos === 'function') cargarProductos();
      }, 800);

      alert('¡Bebida añadida con éxito!');
    }
  } catch (e) { 
    alert('Error al registrar producto'); 
  }
};

// 🛒 FUNCIÓN MAESTRA CON ACUMULADOR CONSECUTIVO (ALINEADA A TU COLUMNA 'id')
const agregarAlCarrito = () => {
  if (!productoSeleccionado) {
    alert("⚠️ Por favor, seleccione una bebida del catálogo primero.");
    return;
  }

  // Buscamos el artículo usando estrictamente la columna 'id' que vimos en tu tabla física
  const articuloMatch = productos.find(p => String(p.id) === String(productoSeleccionado));
  if (!articuloMatch) return;

  // Estructuramos el objeto del carrito garantizando que 'producto_id' sea exacto
  const nuevoItem = {
    cart_id: `CART_${new Date().getTime()}_${Math.random().toString(36).substr(2, 5)}`,
    producto_id: parseInt(articuloMatch.id), // Columna real de tu tabla productos
    nombre: articuloMatch.nombre,
    precio: parseFloat(articuloMatch.precio || 0),
    cantidad: 1 
  };

  // Guardamos de forma acumulativa en tu estado real
  setCarritoVenta(prev => [...(Array.isArray(prev) ? prev : []), nuevoItem]);
  console.log("🛒 MÓDULO CARRITO: Agregado a 'carritoVenta' de forma acumulativa:", nuevoItem.nombre);
};

// 🔒 FUNCIÓN DE ELIMINACIÓN CON FILTRO DE CONTRASEÑA DE ADMINISTRADOR
const eliminarDelCarrito = (cartId) => {
  const claveAccesoAdmin = typeof CONTRASEÑA_ACCESO_SISTEMA !== 'undefined' ? CONTRASEÑA_ACCESO_SISTEMA : "admin29";
  
  // Lanzamos el recuadro interactivo pidiendo la credencial del supervisor
  const passwordIngresado = prompt("🔒 AUTORIZACIÓN REQUERIDA:\nPor favor, ingrese la contraseña de Supervisor para remover esta bebida de la orden:");

  if (passwordIngresado === null) return; // Si cancela con el botón, no hace nada

  if (passwordIngresado !== claveAccesoAdmin) {
    alert("❌ Contraseña incorrecta: Operación denegada. Solo un supervisor autorizado puede modificar el carrito.");
    return;
  }

  // Forzamos el borrado estrictamente en tu estado real de carritoVenta
  setCarritoVenta(prev => (Array.isArray(prev) ? prev : []).filter(item => (item.cart_id || item.id) !== cartId));
  console.log("🔒 SEGURIDAD: Bebida removida del carritoVenta bajo autorización.");
};

  const procesarVenta = async (e) => {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  
  // Jalamos el ID directamente de la casilla gris de tu pantalla
  const inputFisico = document.querySelector('input[type="text"]');
  const nfcFinal = pulseraVenta || (inputFisico ? inputFisico.value : '');

  if (!nfcFinal) {
    alert('⚠️ Esperando lectura: Por favor, acerque la pulsera NFC antes de confirmar.');
    return;
  }
  
  // Candado de seguridad: Si el cajero no ha metido nada al carrito, bloqueamos el cobro
  if (carritoVenta.length === 0) {
    alert('⚠️ El carrito está vacío. Agregue bebidas antes de confirmar la compra.');
    return;
  }

  const idPulseraLimpia = nfcFinal.trim().toUpperCase();
  
  // Sumamos el precio de cada bebida en tu carrito de forma exacta
  const costoTotalCarrito = carritoVenta.reduce((sum, item) => sum + parseFloat(item.precio || 0), 0);

  // 🚀 DETECTOR DE CANAL DE CONTROL
  if (apiUrlDinamica.includes("copia") || apiUrlDinamica.includes("copy")) {
    // 📶 RUTA A: MODO CONTINGENCIA LOCAL EN EL DISCO DURO
    try {
      const saldosLocalesPermanentes = JSON.parse(localStorage.getItem('saldos_contingencia_evento2')) || {};
      const saldoPrevio = parseFloat(saldosLocalesPermanentes[idPulseraLimpia] || 0);

      saldosLocalesPermanentes[idPulseraLimpia] = saldoPrevio - costoTotalCarrito;
      localStorage.setItem('saldos_contingencia_evento2', JSON.stringify(saldosLocalesPermanentes));

      const historialViejo = JSON.parse(localStorage.getItem(`historial_${idPulseraLimpia}`)) || [];
      carritoVenta.forEach(item => {
        historialViejo.push({
          id: `LOCAL_${new Date().getTime()}_${Math.random().toString(36).substr(2, 4)}`,
          pulsera_id: idPulseraLimpia, // 🌟 Alineado con el nombre real de tu columna física de ventas
          codigo_nfc: idPulseraLimpia,  // Mantenemos compatibilidad con tu lógica local
          producto_id: item.producto_id, // ID real del producto de la tabla Neon
          producto: item.nombre,
          nombre: item.nombre,
          producto_nombre: item.nombre,
          total: item.precio,
          precio: item.precio,
          precio_venta: item.precio,
          fecha_venta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      });
      localStorage.setItem(`historial_${idPulseraLimpia}`, JSON.stringify(historialViejo));

      alert(`🎉 ¡Compra masiva exitosa (Local)! Se descontaron $${costoTotalCarrito.toFixed(2)} por las ${carritoVenta.length} bebidas.`);
      
      // Limpieza simétrica de la pantalla
      setCarritoVenta([]);
      if (typeof setPulseraVenta === 'function') setPulseraVenta('');
      if (inputFisico) {
        inputFisico.value = '';
        inputFisico.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (errLocal) {
      console.error("Error en cobro local:", errLocal.message);
    }
  } else {
    // 🌐 RUTA B: MODO EN VIVO CONECTADO AL 100% A TU SERVIDOR DE RAILWAY
    try {
      // 🌟 REPARACIÓN ASIGNADA: Mapeamos con la propiedad 'producto_id' que ya unificamos en el carrito
      const carritoAlineado = carritoVenta.map(item => ({
        producto_id: parseInt(item.producto_id), // Envía de forma limpia el ID numérico
        nombre: item.nombre,
        precio: parseFloat(item.precio || 0),
        cantidad: 1
      }));

      const respuesta = await fetch(`${apiUrlDinamica}/ventas/multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_nfc: idPulseraLimpia,
          items: carritoAlineado // Enviamos el carrito 100% unificado
        })
      });

      const datosRespuesta = await respuesta.json();

      if (!respuesta.ok) {
        alert(`❌ Error al cobrar en la nube: ${datosRespuesta.error || 'Problema en el servidor'}`);
        return;
      }

      alert(`🎉 ¡Compra masiva exitosa en Railway! Se descontaron $${costoTotalCarrito.toFixed(2)} por las ${carritoVenta.length} bebidas.`);
      
      // Le damos tiempo a Neon Cloud para registrar la transacción y jalamos los balances actualizados
      setTimeout(() => {
        if (typeof cargarProductos === 'function') cargarProductos();
        if (typeof cargarPulseras === 'function') cargarPulseras(); 
      }, 800);

      // Limpieza exacta de la pantalla tras el cobro exitoso
      setCarritoVenta([]);
      if (typeof setPulseraVenta === 'function') setPulseraVenta('');
      if (inputFisico) {
        inputFisico.value = '';
        inputFisico.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (errRed) {
      console.error("❌ Error de red con Railway:", errRed.message);
      alert("❌ Error de red: No se pudo procesar la venta en Railway.");
    }
  }
};

  // 🎟️ 2. FUNCIÓN EXCLUSIVA PARA RECARGAR SALDO (TAQUILLA PRINCIPAL CORREGIDA Y SEGURA)
const manejarRecarga = async (e) => {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  
  if (!codigoNfc || !saldo || parseFloat(saldo) <= 0) {
    alert('Por favor, ingresa el código de pulsera y un monto válido en la taquilla para recargar.');
    return;
  }
  
  try {
    // 🌟 REPARACIÓN DE ORO: Usamos 'PUT' apuntando a /pulseras/recargar
    // Esto suma el dinero directamente en Neon SQL sin destruir el Tipo de Acceso del usuario
    const res = await axios.put(`${apiUrlDinamica}/pulseras/recargar`, {
      codigo_nfc: codigoNfc.trim().toUpperCase(),
      monto: parseFloat(saldo) // Enviamos el monto a sumar
    });

    alert('¡Recarga procesada con éxito en la nube de Neon SQL!');
    setCodigoNfc(''); 
    setSaldo('');     
    if (typeof cargarPulseras === 'function') cargarPulseras(); 
  } catch (err) {
    console.error("Error en recarga:", err);
    alert(err.response?.data?.error || 'Error al intentar procesar la recarga en Railway. Verifique que la pulsera exista.');
  }
};

// 🌟 FUNCIÓN TRADUCTORA BLINDADA (Evaluación directa sin variables intermedias)
const obtenerTextoAcceso = (id) => {
  if (!id) return 'General'; // Salvavidas por si llega nulo de la base de datos
  
  if (Number(id) === 1) return 'General';
  if (Number(id) === 2) return 'VIP';
  if (Number(id) === 3) return 'Backstage';
  if (Number(id) === 4) return 'Staff';
  if (Number(id) === 5) return 'Cortesia';
  
  return 'General';
};

  return (
    activarModoTotem ? (
      // Pasamos una función para que si deseas salir del Tótem puedas regresar al menú de cajeros
      <Totem alSalir={() => setActivarModoTotem(false)} />
    ) : (
      
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

            type="button"
            onClick={() => {
              // 🔒 Desplegamos el cerrojo de seguridad en la pantalla del Samsung S25
              const claveIntroducida = prompt('🔒 Introduzca la contraseña de operador técnico para ingresar al sistema:');
              
              if (claveIntroducida === CONTRASEÑA_ACCESO_SISTEMA) {
                if (navigator.vibrate) navigator.vibrate(100); // Doble zumbido premium de éxito
                setMostrarBienvenida(false); // Desbloquea tu app original y abre las tablas turquesas
              } else if (claveIntroducida !== null) {
                if (navigator.vibrate) navigator.vibrate(250); // Vibración de rechazo
                alert('❌ Contraseña Incorrecta. Acceso Denegado por Seguridad.');
              }
            }}
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
      
            {/* 🎛️ SELECTOR DE CANAL INTELIGENTE MULTI-EVENTO (BLINDADO CON HTTPS) */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', backgroundColor: '#1e293b', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #334155' }}>
        <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>CANAL:</label>
        <select 
          value={apiUrlDinamica}
          onChange={(e) => cambiarCanalEvento(e.target.value, e.target)}
          style={{ backgroundColor: '#0f172a', color: '#2c909e', border: '1px solid #2c909e', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {/* 🌟 Canal 1: Tu nuevo servidor unificado en Railway */}
          <option value="https://sistema-nfc-monedero-production.up.railway.app">🎟️ Evento 1 (Railway Producción)</option>
          
          {/* 🌟 Canal 2: CORREGIDO CON HTTPS SEGURO */}
          <option value="https://sistema-nfc-monedero-copy-1-production.up.railway.app">🎵 Evento 2 (Railway Respaldo)</option>
        </select>
      </div>
      
      {/* 🧭 BARRA DE PESTAÑAS ADAPTADA PARA TOUCH */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#e9ecef', padding: '5px', borderRadius: '8px' }}>
        <button
          onClick={() => {
            setPestañaActiva('pulseras');
            localStorage.setItem('ultima_pestana_easycashless', 'pulseras');
          }}
          style={{
            flex: 1, padding: '14px', cursor: 'pointer', fontSize: '16px',
            backgroundColor: pestañaActiva === 'pulseras' ? '#007bff' : 'transparent',
            color: pestañaActiva === 'pulseras' ? 'white' : '#495057',
            border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s'
          }}
        >
          🎟️ Gestión Pulseras
        </button>
  
        <button 
          onClick={() => {
            setPestañaActiva('productos');
            localStorage.setItem('ultima_pestana_easycashless', 'productos');
          }} 
          style={{
            flex: 1, padding: '14px', cursor: 'pointer', fontSize: '16px',
            backgroundColor: pestañaActiva === 'productos' ? '#007bff' : 'transparent', 
            color: pestañaActiva === 'productos' ? 'white' : '#495057', 
            border: 'none', borderRadius: '6px', fontWeight: 'bold', transition: 'all 0.2s'
          }}
        >
          🍺 Punto de Venta
        </button>

        {/* 🖥️ Botón del Tótem adaptado para responder dentro del APK */}
        <button 
          onClick={() => setActivarModoTotem(true)} 
          style={{
            padding: '14px', cursor: 'pointer', fontSize: '15px',
            backgroundColor: '#1e293b', color: '#38bdf8', 
            border: '1px solid #334155', borderRadius: '6px', fontWeight: 'bold', 
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          🖥️ Modo Tótem
        </button>
      </div>



      {/* 🎟️ CONTENEDOR DE LA PESTAÑA DE PULSERAS AJUSTADO PARA EL BOTÓN FLOTANTE */}
{pestañaActiva === 'pulseras' && (
  // 🌟 CORRECCIÓN CRÍTICA: Añadimos estilos aquí para frenar el estiramiento general en el celular
  <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
    
    {/* Bloque Gris de Estadísticas */}
    <div style={{ display: "flex", marginBottom: "15px" }}>
      <div style={{ flex: 1, border: "1px solid #ced4da", padding: "15px", borderRadius: "8px", backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <h4 style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Total Pulseras</h4>
        <h2 style={{ margin: '5px 0 0 0', color: '#212529' }}>{pulseras.length}</h2>
      </div>
    </div>
    
    {/* 📱 CONTENEDOR ENMASCARADO PARA EL SCROLL DE LA TABLA */}
    <div style={{ width: '100%', margin: '12px 0', boxSizing: 'border-box', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      
      {/* 📊 TABLA CON ANCHO MÍNIMO CÓMODO */}
      <table border="1" cellPadding="4" style={{ minWidth: '550px', width: '100%', borderCollapse: 'collapse', textAlign: 'center', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', borderColor: '#dee2e6', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#20c997', color: '#fff', fontSize: '12px' }}>
            <th style={{ padding: '10px 4px' }}>ID NFC</th>
            <th style={{ padding: '10px 4px' }}>Acceso</th>
            <th style={{ padding: '10px 4px' }}>Saldo</th>
            <th style={{ padding: '10px 4px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>

          {pulseras.map((p) => (
            <tr key={p.codigo_nfc} style={{ borderBottom: '1px solid #dee2e6' }}>
              
              {/* 🆔 COLUMNA ID NFC REDUCIDA SÓLO PARA QUE NO SE ROMPA EN EL CELULAR */}
              <td style={{ padding: '10px 4px', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {p.codigo_nfc || p.codigo}
              </td>

              {/* 2️⃣ CAJÓN ACCESO (CORREGIDO CON TU TRADUCTOR DE IDS DE NEON) */}
              <td style={{ padding: '10px 4px', fontSize: '12px' }}>
                {obtenerTextoAcceso(p.tipo_acceso_id)}
              </td>

              {/* 3️⃣ CAJÓN SALDO (Cae bajo el título Saldo) */}
              <td style={{ fontWeight: 'bold', color: '#28a745', padding: '10px 4px', fontSize: '13px' }}>
                ${parseFloat(p.saldo || 0).toFixed(2)}
              </td>
              
              {/* 4️⃣ CAJÓN ACCIONES (Cae bajo el título Acciones) */}
              <td style={{ padding: '10px 4px', verticalAlign: 'middle' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>

                        
                        {/* Botón A: Recargar Blindado con Contraseña de Supervisor */}
                        <button 
                          type="button" 
                          onClick={async () => {
                            // 🔒 CANDADO DE SEGURIDAD OPERATIVO
                            const claveSupervisor = prompt('🔒 AUTORIZACIÓN REQUERIDA:\nIntroduzca la clave de administrador para autorizar esta recarga de saldo:');
                            
                            if (claveSupervisor === null) return; // Si cancela con el botón, se detiene el flujo en paz
                            
                            if (claveSupervisor !== 'admin29') { 
                              if (navigator.vibrate) navigator.vibrate(250); // Vibración de rechazo en tu Samsung S25
                              alert('❌ Clave de Supervisor Incorrecta. Recarga rechazada por seguridad.'); 
                              return; // Bloquea la operación y no deja meter dinero
                            }

                            // 💰 SI LA CONTRASEÑA ES CORRECTA, SE DESPLIEGA TU PROMPT ORIGINAL DE DINERO:
                            const m = prompt(`¿Cuánto saldo deseas recargar a la pulsera ${p.codigo_nfc}?`);
                            if (!m || isNaN(m) || parseFloat(m) <= 0) { alert('Monto inválido.'); return; }
                            
                            try {
                              await axios.put(`${apiUrlDinamica}/pulseras/recargar`, { codigo_nfc: p.codigo_nfc, monto: parseFloat(m) });
                              alert('¡Recarga exitosa!'); 
                              cargarPulseras();
                            } catch (e) { 
                              alert('No se pudo procesar la recarga.'); 
                            }
                          }} 
                          style={{ width: '90px', padding: '6px 0', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', textAlign: 'center' }}
                        >
                          💵 Recargar
                        </button>

                        {/* 🚀 DEJA TU BOTÓN ROJO EXACTAMENTE CON ESTA ESTRUCTURA: */}
                        <button 
                        type="button" 
                        onClick={async () => {
                          const claveSeguridad = prompt('🔒 AUTORIZACIÓN REQUERIDA:\nIntroduzca la clave de administrador para eliminar esta pulsera de la caja:');
                          if (!claveSeguridad) return;

                          if (claveSeguridad !== 'admin29') {
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

                      </div>
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
                  value={codigoNfc || pulseraVenta || ''} 
                  onChange={(e) => {
                    if (typeof setCodigoNfc === 'function') setCodigoNfc(e.target.value);
                    if (typeof setPulseraVenta === 'function') setPulseraVenta(e.target.value);
                  }} 
                  placeholder="Acerque la pulsera NFC aquí..." 
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontSize: '16px', boxSizing: 'border-box', marginTop: '5px' }} 
                />
              </div>
              

                            {/* 🍺 SELECTOR DE ARTÍCULO OSCURO ADAPTADO PERFECTAMENTE A CELULARES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%', boxSizing: 'border-box' }}>
                <label style={{ fontWeight: 'bold', color: '#495057', fontSize: '15px', textAlign: 'left' }}>Seleccionar Producto:</label>
                
                {/* Menú desplegable ocupando todo el ancho para que no se achique */}
                <select 
                  value={productoSeleccionado} 
                  onChange={(e) => setProductoSeleccionado(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '15px', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="" style={{ backgroundColor: '#0f172a', color: '#6c757d' }}>🍺 Seleccione un artículo...</option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id} style={{ backgroundColor: '#0f172a', color: 'white' }}>
                      {prod.nombre} - ${prod.precio} (Stock: {prod.stock})
                    </option>
                  ))}
                </select>
                
                {/* 🟣 BOTÓN MORADO ABAJO: Ocupa todo el ancho, cómodo para el dedo del cajero */}
                <button 
                  type="button" 
                  onClick={agregarAlCarrito} 
                  style={{ width: '100%', padding: '12px', backgroundColor: 'rgb(95, 53, 220)', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}

                >
                  ➕ Añadir Bebida al Carrito
                </button>
              </div>

              {/* 📋 LISTA VISUAL DEL CARRITO (CON BLINDAJE LÓGICO MULTIVARIABLE) */}
              {((typeof carritoVenta !== 'undefined' ? carritoVenta : (typeof carrito !== 'undefined' ? carrito : [])) || []).length > 0 && (
                <div style={{ marginTop: '15px', backgroundColor: 'rgba(0, 0, 0, 0.15)', padding: '14px', borderRadius: '8px', border: '1px solid #574769', boxSizing: 'border-box' }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#020202', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>
                    🛒 Bebidas en esta orden:
                  </p>
                  
                  {/* Contenedor con scroll vertical unificado */}
                  <div style={{ maxHeight: '190px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {((typeof carritoVenta !== 'undefined' ? carritoVenta : (typeof carrito !== 'undefined' ? carrito : [])) || []).map((item, index) => (
                      <div 
                        key={item.cart_id || item.id || index} 
                        style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #cbd5e1' }}
                      >
                        {/* Texto Izquierdo */}
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px', display: 'block', textTransform: 'uppercase' }}>
                            {item.nombre}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            producto
                          </span>
                        </div>
                        
                        {/* Precio en Rojo y Botón Quitar Derecho */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '15px' }}>
                            -${parseFloat(item.precio || item.total || 0).toFixed(2)}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => eliminarDelCarrito(item.cart_id || item.id)} 
                            style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ❌ Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 🌟 TURBO MATEMÁTICO: Sincronización instantánea sin retrasos en pantalla */}
                  <div style={{ marginTop: '12px', textAlign: 'right', fontWeight: 'bold', color: '#1c1b1a', fontSize: '16px', borderTop: '1px dashed #475569', paddingTop: '10px' }}>
                    Total del pedido: $
                    {(() => {
                      const listaActiva = (typeof carritoVenta !== 'undefined' ? carritoVenta : (typeof carrito !== 'undefined' ? carrito : [])) || [];
                      
                      // Calculamos lo que ya está renderizado en el arreglo de memoria de forma directa
                      const acumuladoBase = listaActiva.reduce((sum, item) => sum + parseFloat(item.precio || item.total || 0), 0);
                      
                      return acumuladoBase.toFixed(2);
                    })()} MXN
                  </div>
                </div>
              )}

              {/* 🟢 BOTÓN VERDE PURIFICADO: Se le quitó el texto de los productos para evitar desfases visuales */}
              <button 
                type="button" 
                onClick={(e) => {
                  if (e && typeof e.preventDefault === 'function') e.preventDefault();
                  if (typeof procesarVenta === 'function') {
                    procesarVenta(e); 
                  } else {
                    console.error("MÓDULO COBROS: Error crítico, la función procesarVenta no está al alcance.");
                  }
                }}
                style={{ width: '100%', marginTop: '15px', padding: '14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)', boxSizing: 'border-box' }}
              >
                🎯 Confirmar Compra
              </button>
              
              <button 
              type="button" 
              onClick={async () => {
                // 🪐 AUTO-DETECTOR EN CALIENTE
                const inputFisicoNfc = document.querySelector('input[type="text"]');
                let codigoPulsera = pulseraVenta || (inputFisicoNfc ? inputFisicoNfc.value : '');

                // 🔒 SALVAVIDAS INTELIGENTE
                if (!codigoPulsera || !codigoPulsera.trim()) {
                  codigoPulsera = prompt('Por favor, ingresa o escanea el código de la pulsera para ver su historial de compras:');
                }

                if (!codigoPulsera || !codigoPulsera.trim()) return;

                const uidLimpio = codigoPulsera.trim().toUpperCase();
                console.log("MÓDULO HARDWARE: Accediendo al ID de pantalla:", uidLimpio);

                // 🚀 2. BYPASS COMERCIAL PARA EL EVENTO 2 (MODO LOCAL)
                if (apiUrlDinamica.includes("copia") || apiUrlDinamica.includes("copy")) {
                  console.log("BYPASS ACTIVO: Sintonizando Evento 2, leyendo de localStorage...");
                  
                  let datosLocales = JSON.parse(localStorage.getItem(`historial_${uidLimpio}`)) || [];

                  if (datosLocales.length === 0) {
                    let precioFallback = 0.00;
                    let nombreFallback = "Bebida (Evento 2)";

                    if (productoSeleccionado && productos && productos.length > 0) {
                      const matchProd = productos.find(p => String(p.id) === String(productoSeleccionado));
                      if (matchProd) {
                        precioFallback = parseFloat(matchProd.precio || 0);
                        nombreFallback = matchProd.nombre || "Artículo Seleccionado";
                      }
                    }

                    datosLocales = [{
                      id: "FALLBACK",
                      codigo_nfc: uidLimpio,
                      producto: nombreFallback,
                      nombre: nombreFallback,
                      producto_nombre: nombreFallback,
                      total: precioFallback,
                      precio: precioFallback,
                      precio_venta: precioFallback,
                      fecha_venta: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      fecha: "Reciente",
                      created_at: "Reciente"
                    }];
                  }

                  setHistorialVentas(datosLocales);
                  setPulseraSeleccionadaHistorial(uidLimpio);
                  setMostrarModalHistorial(true);
                  return; 
                }

                // 📡 3. CANAL NORMAL (EVENTO 1): Conexión directa a Railway
                try {
                  console.log("HISTORIAL CONTABLE: Consultando en el Evento 1:", `${apiUrlDinamica}/ventas/historial/${uidLimpio}`);
                  
                  const res = await axios.get(`${apiUrlDinamica}/ventas/historial/${uidLimpio}?_nocache=${new Date().getTime()}`);
                  
                  if (!res.data || res.data.length === 0) {
                    alert('ℹ️ Esta pulsera no tiene ninguna compra registrada en este evento.');
                    return;
                  }
                  
                  // Mapeador adaptativo unificado con tu columna real 'id'
                  const datosPurificados = Array.isArray(res.data) ? res.data.map(item => {
                    const precioDetectado = parseFloat(item.total || item.precio || item.precio_venta || item.monto || 0);
                    
                    let tiempoFormateado = item.fecha_venta || item.fecha || item.created_at || "Reciente";
                    if (tiempoFormateado !== "Reciente" && !isNaN(Date.parse(tiempoFormateado))) {
                      tiempoFormateado = new Date(tiempoFormateado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }

                    // Rastreamos el ID del producto barriendo variantes de Postgres
                    const productoIdVenta = item.producto_id || item.id_producto || item.id || 0;
                    
                    // 🌟 ALINEACIÓN REAL: Buscamos únicamente usando la propiedad p.id de tu tabla de Neon
                    const matchCatalogo = productos.find(p => String(p.id) === String(productoIdVenta));

                    // Rastreo de respaldo por precio si no encuentra por ID
                    const matchPorPrecio = !matchCatalogo ? productos.find(p => parseFloat(p.precio || 0) === precioDetectado) : null;
                    const objetoFinal = matchCatalogo || matchPorPrecio;
                    const nombreRealBebida = objetoFinal ? objetoFinal.nombre : (item.producto || item.nombre || "Bebida Consumida");

                    return {
                      id: item.id || "FALLBACK",
                      codigo_nfc: item.pulsera_id || item.codigo_nfc || uidLimpio,
                      producto: nombreRealBebida,
                      nombre: nombreRealBebida,
                      producto_nombre: nombreRealBebida,
                      nombre_producto: nombreRealBebida,
                      total: precioDetectado, 
                      precio: precioDetectado,
                      precio_venta: precioDetectado,
                      fecha_venta: tiempoFormateado, 
                      fecha: tiempoFormateado,
                      created_at: tiempoFormateado
                    };
                  }) : [];

                  setHistorialVentas(datosPurificados);
                  setPulseraSeleccionadaHistorial(uidLimpio);
                  setMostrarModalHistorial(true);

                } catch (e) {
                  console.error("Error al obtener historial en Evento 1:", e);
                  alert('❌ No se pudo conectar con el servidor para leer el historial.');
                }
              }}
              style={{ width: '100%', padding: '14px', borderRadius: '4px', border: '1px solid #475569', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
            >
              🔍 Consultar Saldo NFC
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
                  const c2 = prompt("Ingresa contraseña para eliminar registros");
                  if (c2 !== "admin29") { alert("Confirmación incorrecta."); return; }
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
                style={{ flex: 1, padding: '12px 8px', backgroundColor: 'rgb(95, 53, 220)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>🧹 Limpiar Evento</button>
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
              {/* ✅ REEMPLAZAMOS CON TU NUEVO INPUT UNIFICADO AL HARDWARE NATIVO */}
              <input 
                type="text" 
                value={codigoNfc || pulseraVenta || ''} 
                onChange={(e) => {
                  setCodigoNfc(e.target.value);
                  if (typeof setPulseraVenta === 'function') setPulseraVenta(e.target.value);
                }} 
                required 
                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '16px' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold', color: '#495057' }}>Tipo de Acceso:</label>
                {/* ✅ VERSIÓN REPARADA, ESTABLE Y COMPATIBLE CON TU CÓDIGO */}
            
            {/* 🎟️ CORRECCIÓN INDESTRUCTIBLE DE LAS OPCIONES DEL MENÚ */}
              <select 
          id="tipoAccesoId"
          name="tipoAccesoId"
          value={typeof tipoAccesoId !== 'undefined' ? tipoAccesoId : ''} 
          onChange={(e) => {
            const valorNumerico = Number(e.target.value); 
            if (typeof setTipoAccesoId === 'function') {
              setTipoAccesoId(valorNumerico);
            } else if (typeof setTipoAcceso === 'function') {
              setTipoAcceso(valorNumerico);
            }
          }}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', display: 'block', marginTop: '5px' }}
        >
          <option value="1">General</option>
          <option value="2">VIP</option>
          <option value="3">Backstage</option> {/* 🌟 AGREGADO CON SU ID REAL 3 */}
          <option value="4">Staff</option>
          <option value="5">Cortesia</option>
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
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>  Añadir Nueva Bebida</h3>
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
       {/* 🖼️ VENTANA MODAL FLOTANTE DE HISTORIAL DE CONSULTA (SOLO LECTURA) */}
      {mostrarModalHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ebf0f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>📜 Compras de: <strong style={{ color: '#111827', backgroundColor: '#fef08a', padding: '2px 6px', borderRadius: '4px' }}>{pulseraSeleccionadaHistorial}</strong></h3>
              <button onClick={() => setMostrarModalHistorial(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', fontWeight: 'bold' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>Historial de consumos registrados en este dispositivo:</p>

            {/* Lista con scroll de artículos comprados */}
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
              {historialVentas.map((ticket) => (
                <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                      {ticket.producto || ticket.nombre || ticket.producto_nombre || ticket.nombre_producto || ticket.articulo || "Bebida Consumida"}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      🕒 {ticket.fecha || ticket.created_at || "Reciente"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>
                      -${parseFloat(ticket.total || ticket.precio || ticket.precio_venta || 0).toFixed(2)}
                    </span>
                    
                                        {/* 🛡️ CANDADO DE SEGURIDAD PARA OPERACIÓN: 
                        El botón solo se dibuja si decides cambiar 'false' por una variable/estado de administrador (ej. esAdmin). 
                        Al dejarlo en false, queda oculto para los cajeros ordinarios sin borrar tu lógica interna de eventos. */}
                    {false && (
                      <button 
                        type="button"
                        onClick={async () => {
                          // 🔐 1. Validación de supervisor original intacta
                          const claveSuper = prompt('🔒 AUTORIZACIÓN DE BARRA:\nIntroduzca la clave de administrador para deshacer este cobro:');
                          if (!claveSuper) return;
                          if (claveSuper !== 'admin29') { alert('❌ Clave incorrecta.'); return; }

                          if (!window.confirm(`¿Confirmas la cancelación de esta compra? Se devolverán $${ticket.total} a la pulsera.`)) return;

                          // 🪐 2. Amarre del ID de la pulsera activa
                          const pulseraActiva = ticket.codigo_nfc || pulseraSeleccionadaHistorial || '';
                          const dineroADevolver = parseFloat(ticket.total || ticket.precio || 0);

                          console.log("REVERSIÓN: Iniciando proceso de persistencia para la pulsera:", pulseraActiva);

                          // 🚀 3. BYPASS PARA EL EVENTO 2 (REINTEGRO PERSISTENTE EN DISCO FÍSICO)
                          if (apiUrlDinamica.includes("copia") || apiUrlDinamica.includes("copy") || ticket.id === "FALLBACK") {
                            console.log("BYPASS ACTIVO: Guardando balance devuelto en el almacenamiento permanente del celular...");
                            
                            // A) Actualizamos la vista de la pantalla en caliente
                            if (typeof setPulseras === 'function') {
                              setPulseras(prevPulseras => {
                                return prevPulseras.map(p => {
                                  const idFiel = (p.codigo_nfc || p.codigo || '').trim().toUpperCase();
                                  if (idFiel === pulseraActiva.trim().toUpperCase()) {
                                    return { ...p, saldo: parseFloat(p.saldo || 0) + dineroADevolver };
                                  }
                                  return p;
                                });
                              });
                            }

                            // B) 🌟 ANCLA DE SEGURIDAD INTERNA: Guardamos el saldo de contingencia en el disco duro para que no se borre al salir
                            try {
                              const saldosLocalesPermanentes = JSON.parse(localStorage.getItem('saldos_contingencia_evento2')) || {};
                              const saldoPrevioGuardado = parseFloat(saldosLocalesPermanentes[pulseraActiva.trim().toUpperCase()] || 0);
                              
                              // Acumulamos de forma permanente el dinero devuelto en el almacenamiento físico del teléfono
                              saldosLocalesPermanentes[pulseraActiva.trim().toUpperCase()] = saldoPrevioGuardado + dineroADevolver;
                              localStorage.setItem('saldos_contingencia_evento2', JSON.stringify(saldosLocalesPermanentes));
                              console.log("💾 DISCO DURO: Reembolso asegurado en almacenamiento permanente.");
                            } catch (errDisco) {
                              console.error("Error al escribir espejo persistente:", errDisco);
                            }

                            // Limpiamos la caché del historial local para borrar la bebida de la ventana modal
                            try {
                              let historialCaché = JSON.parse(localStorage.getItem(`historial_${pulseraActiva.trim().toUpperCase()}`)) || [];
                              historialCaché = historialCaché.filter(t => t.id !== ticket.id);
                              localStorage.setItem(`historial_${pulseraActiva.trim().toUpperCase()}`, JSON.stringify(historialCaché));
                              if (typeof setHistorialVentas === 'function') setHistorialVentas(historialCaché);
                            } catch (eLoc) {}

                            alert(`✅ ¡Cancelación Exitosa! Se reintegraron $${dineroADevolver.toFixed(2)} directamente al saldo de la pulsera de forma permanente.`);
                            if (typeof setMostrarModalHistorial === 'function') setMostrarModalHistorial(false);
                            return; 
                          }

                          // 📡 4. CANAL NORMAL (EVENTO 1): Reversión nativa en la nube de Railway
                          try {
                            const res = await axios.post(`${apiUrlDinamica}/ventas/revertir`, { 
                              venta_id: ticket.id,
                              codigo_nfc: pulseraActiva
                            });
                            
                            alert(res.data.mensaje || '¡Reversión completada!');
                            if (typeof setMostrarModalHistorial === 'function') setMostrarModalHistorial(false); 
                            
                            // 🚀 EL CAMBIO DE ORO: Le damos 1000ms (1 segundo completo) a Neon Cloud en Railway
                            // para que asiente de forma indestructible el dinero en la nube antes de recargar la pantalla
                            setTimeout(() => {
                              if (typeof cargarPulseras === 'function') cargarPulseras(); 
                            }, 1000); // 🌟 Cambiamos de 300 a 1000 para blindar la latencia de internet

                          } catch (err) {
                            console.error("⚠️ Error de internet en Evento 1:", err);
                            alert(err.response?.data?.error || 'No se pudo procesar la cancelación.');
                          }
                        }}
                        style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                      >
                        ↩️ Cancelar
                      </button>
                    )}


                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 💻 FIRMA DE AUTOR PREMIUM: Ubicada perfectamente al fondo de la pantalla principal */}
      <footer style={{ marginTop: 'auto', padding: '20px 0 10px 0', textAlign: 'center', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
        Desarrollado por <strong>Vania Solis</strong> &copy; {new Date().getFullYear()}
      </footer>

    </div>
    )
  );
  
}
export default App;

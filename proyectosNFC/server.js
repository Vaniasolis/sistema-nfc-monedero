const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 🔌 CONFIGURACIÓN UNIFICADA DE LA BASE DE DATOS NEON
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// 🫀 RUTA DE CONTROL: Verificar que el backend responda en Railway
app.get('/', (req, res) => {
  res.send('🚀 Servidor NFC operando con éxito en la nube de Railway.');
});

// 📦 1. RUTA: OBTENER TODOS LOS PRODUCTOS
app.get('/productos', async (req, res) => {
  try {
    // 🌟 CORRECCIÓN: Cambiamos 'client.query' por 'pool.query'
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET productos:", err.message);
    res.status(500).json({ error: "Fallo en el servidor al leer productos" });
  }
});

// 📦 1. RUTA: OBTENER TODAS LAS PULSERAS (CORREGIDO SIN 'id')
app.get('/pulseras', async (req, res) => {
  try {
    // 🌟 Eliminamos 'ORDER BY id' para evitar el cortocircuito si no existe la columna id
    const resultado = await pool.query('SELECT * FROM pulseras');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET pulseras:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔋 2. RUTA: REGISTRAR UNA NUEVA PULSERA CASHLESS (CORREGIDO CON 'tipo_acceso')
app.post('/pulseras', async (req, res) => {
  const { codigo_nfc, tipo_acceso, saldo } = req.body;
  if (!codigo_nfc) {
    return res.status(400).json({ error: "El código NFC es obligatorio" });
  }
  try {
    // 🌟 Traducimos el texto que viene del formulario a los IDs numéricos de tu foto (4, 3, 2)
    let idNumericoAcceso = 4; // Por defecto asignamos el ID 4 (General/Cover)
    if (tipo_acceso === 'VIP') idNumericoAcceso = 3;
    if (tipo_acceso === 'Staff') idNumericoAcceso = 2;

    // 🚀 Usamos estrictamente tu columna 'tipo_acceso_id' de Neon
    await pool.query(
      'INSERT INTO pulseras (codigo_nfc, tipo_acceso_id, saldo) VALUES ($1, $2, $3) ON CONFLICT (codigo_nfc) DO UPDATE SET tipo_acceso_id = $2, saldo = $3',
      [codigo_nfc, idNumericoAcceso, parseFloat(saldo || 0)]
    );
    res.json({ exito: true, mensaje: "🎉 ¡Pulsera registrada con éxito en Railway!" });
  } catch (err) {
    console.error("❌ Error en POST registrar pulsera:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// 📦 3. RUTA: RECARGAR DINERO A UNA PULSERA (MODAL DE SALDO)
app.put('/pulseras/recargar', async (req, res) => {
  const { codigo_nfc, monto } = req.body;
  if (!codigo_nfc || !monto) {
    return res.status(400).json({ error: "Datos incompletos para la recarga" });
  }
  try {
    // 🌟 UNIFICACIÓN: Cambiamos 'client.query' por 'pool.query' con letras minúsculas
    const busqueda = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    
    if (busqueda.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera no existe" });
    }
    
    const pulsera = busqueda.rows[0]; // Extraemos el primer registro del arreglo clásico .rows
    const nuevoSaldo = parseFloat(pulsera.saldo || 0) + parseFloat(monto);
    
    // 🌟 UNIFICACIÓN: Actualizamos el saldo real usando pool.query en tu Neon SQL
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);
    
    res.json({ exito: true, mensaje: `🔋 Recarga exitosa. Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });
  } catch (err) {
    console.error("❌ Error en PUT recargar Railway:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/// 🍹 3. RUTA: PROCESAR COBRO MÚLTIPLE DESDE EL CARRITO (BOTÓN VERDE INDESTRUCTIBLE)
app.post('/ventas/multiple', async (req, res) => {
  const { codigo_nfc, items } = req.body;
  if (!codigo_nfc || !items || items.length === 0) {
    return res.status(400).json({ error: "Datos incompletos para procesar la venta masiva" });
  }

  try {
    // 🌟 PASO 1: Primero hacemos la búsqueda real en la base de datos (¡Esto faltaba!)
    const busqueda = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (busqueda.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera aproximada no existe en el sistema" });
    }

    // 🌟 PASO 2: Extraemos de forma segura la primera pulsera del arreglo
    const pulsera = busqueda.rows[0]; 
    let costoTotal = 0;

    // PASO 3: Calculamos el costo de las bebidas en el carrito
    items.forEach(item => {
      costoTotal += parseFloat(item.precio) * parseInt(item.cantidad);
    });

    // PASO 4: Validamos el saldo real usando la columna de tu Neon
    const saldoActual = parseFloat(pulsera.saldo || 0);

    if (saldoActual < costoTotal) {
      return res.status(400).json({ error: `Saldo insuficiente. Total orden: $${costoTotal.toFixed(2)}, Saldo disponible: $${saldoActual.toFixed(2)}` });
    }

    const nuevoSaldo = saldoActual - costoTotal;

    // PASO 5: Actualizamos el monedero al milisegundo en tu tabla de Neon SQL
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);

    // 🌟 PASO 6: Ahora sí, al puro final y con los datos calculados, registramos la bitácora de forma segura
    try {
      await pool.query('INSERT INTO ventas (codigo_nfc, monto) VALUES ($1, $2)', [codigo_nfc, costoTotal]);
    } catch (errorBitacora) {
      console.warn("⚠️ Advertencia en bitácora:", errorBitacora.message);
    }

    res.json({ exito: true, mensaje: `🎉 ¡Cobro de $${costoTotal.toFixed(2)} completado con éxito! Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });

  } catch (err) {
    console.error("❌ Error interno crítico en venta múltiple Railway:", err.message);
    res.status(500).json({ error: "Error interno al procesar el cobro múltiple en la nube" });
  }
});

// 🗑️ 5. RUTA: ELIMINAR UNA PULSERA INDIVIDUAL (CORREGIDO SIN CLIENT)
app.delete('/pulseras/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ventas WHERE pulsera_id = $1', [id]).catch(()=>{});
    await pool.query('DELETE FROM pulseras WHERE codigo_nfc = $1', [id]);
    res.json({ exito: true, mensaje: `🗑️ Pulsera ${id} eliminada correctamente.` });
  } catch (err) {
    console.error("❌ Error en DELETE pulsera:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🧹 6. RUTA: VACIAR EVENTO COMPLETO
app.delete('/pulseras/limpiar', async (req, res) => {
  try {
    await pool.query('DELETE FROM ventas;');
    await pool.query('DELETE FROM pulseras;');
    res.json({ mensaje: '🧹 Evento reiniciado con éxito.' });
  } catch (err) {
    console.error("❌ Error en DELETE limpiar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor comercial unificado corriendo en el puerto ${PORT}`);
});


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

// 📊 1. RUTA: OBTENER TODOS LOS PRODUCTOS
app.get('/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET productos:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🏷️ 2. RUTA: OBTENER TODAS LAS PULSERAS
app.get('/pulseras', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pulseras ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET pulseras:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔋 3. RUTA: RECARGAR SALDO A UNA PULSERA (CORREGIDO SIN COMILLAS)
app.put('/pulseras/recargar', async (req, res) => {
  const { codigo_nfc, monto } = req.body;
  if (!codigo_nfc || !monto) {
    return res.status(400).json({ error: "Datos incompletos para la recarga" });
  }
  try {
    const busqueda = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (busqueda.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera no existe" });
    }
    const pulsera = busqueda.rows[0];
    const nuevoSaldo = parseFloat(pulsera.saldo || 0) + parseFloat(monto);
    
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);
    res.json({ exito: true, mensaje: `🔋 Recarga exitosa. Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });
  } catch (err) {
    console.error("❌ Error en PUT recargar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📦 4. RUTA: PROCESAR VENTAS MÚLTIPLES (CARRITO)
app.post('/ventas/multiple', async (req, res) => {
  const { codigo_nfc, items } = req.body;
  if (!codigo_nfc || !items || items.length === 0) {
    return res.status(400).json({ error: "Datos de venta incompletos" });
  }
  try {
    const busqueda = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (busqueda.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera no existe" });
    }
    const pulsera = busqueda.rows[0];
    let costoTotal = 0;
    items.forEach(item => {
      costoTotal += parseFloat(item.precio || 0) * parseInt(item.cantidad || 1);
    });

    if (parseFloat(pulsera.saldo || 0) < costoTotal) {
      return res.status(400).json({ error: "Saldo insuficiente en el monedero" });
    }
    const nuevoSaldo = parseFloat(pulsera.saldo) - costoTotal;
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);

    const primerProductoId = items[0]?.producto_id || null;
    await pool.query('INSERT INTO ventas (pulsera_id, total, producto_id) VALUES ($1, $2, $3)', [codigo_nfc, costoTotal, primerProductoId]);

    res.json({ guardado: true, mensaje: `🎉 Cobro completado. Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });
  } catch (err) {
    console.error("❌ Error en POST ventas:", err.message);
    res.status(500).json({ error: err.message });
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


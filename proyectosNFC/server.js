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
    const resultado = await client.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows); // 🚀 Formato clásico compatible con Railway (.rows)
  } catch (err) {
    console.error("❌ Error en GET productos:", err.message);
    res.status(500).json({ error: "Fallo en el servidor al leer productos" });
  }
});

// 📦 2. RUTA: OBTENER TODAS LAS PULSERAS
app.get('/pulseras', async (req, res) => {
  try {
    const resultado = await client.query('SELECT * FROM pulseras ORDER BY id ASC');
    res.json(resultado.rows); // 🚀 Formato clásico compatible con Railway (.rows)
  } catch (err) {
    console.error("❌ Error en GET pulseras:", err.message);
    res.status(500).json({ error: "Fallo en el servidor al leer pulseras" });
  }
});

// 📦 3. RUTA: RECARGAR DINERO A UNA PULSERA (MODAL DE SALDO)
app.put('/pulseras/recargar', async (req, res) => {
  const { codigo_nfc, monto } = req.body;
  if (!codigo_nfc || !monto) {
    return res.status(400).json({ error: "Datos incompletos para la recarga" });
  }
  try {
    // 🌟 REGLA DE ORO: 'client' en minúsculas para tu consulta
    const busqueda = await client.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    
    if (busqueda.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera no existe" });
    }
    
    // Extraemos la primera pulsera indexándola con [0]
    const pulsera = busqueda.rows[0]; 
    const nuevoSaldo = parseFloat(pulsera.saldo || 0) + parseFloat(monto);
    
    // Actualizamos el saldo real en tu base de datos
    await client.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);
    
    res.json({ exito: true, mensaje: `🔋 Recarga exitosa. Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });
  } catch (err) {
    console.error("❌ Error en PUT recargar:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔌 TU BÚNKER DE ESCUCHA (AL PURO FINAL)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor comercial corriendo con éxito en el puerto ${PORT}`);
});

app.post('/ventas/multiple', async (req, res) => {
  const { codigo_nfc, items } = req.body;
  if (!codigo_nfc || !items || items.length === 0) {
    return res.status(400).json({ error: "Datos incompletos para procesar la venta masiva" });
  }

  try {
    // 1. Buscamos en pulseras usando el nombre de columna correcto 'codigo_nfc'
    const pulserasEncontradas = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (pulserasEncontradas.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera aproximada no existe en el sistema" });
    }

    // 🚀 CORRECCIÓN CRÍTICA: extraemos correctamente el objeto de la fila encontrada
    const pulsera = pulserasEncontradas.rows[0]; 
    let costoTotal = 0;

    items.forEach(item => {
      costoTotal += parseFloat(item.precio) * parseInt(item.cantidad);
    });

    if (parseFloat(pulsera.saldo) < costoTotal) {
      return res.status(400).json({ error: `Saldo insuficiente. Total orden: $${costoTotal.toFixed(2)}, Saldo disponible: $${parseFloat(pulsera.saldo).toFixed(2)}` });
    }

    const nuevoSaldo = parseFloat(pulsera.saldo) - costoTotal;

    // 2. Actualizamos el saldo del monedero en la tabla 'pulseras'
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);

    // 3. 🚀 CORRECCIÓN FINAL EN LA TABLA VENTAS: 
    // Insertamos únicamente en las columnas verificadas por tu JSON ('pulsera_id' y 'total')
    await pool.query(
      'INSERT INTO ventas (pulsera_id, total) VALUES ($1, $2)', 
      [codigo_nfc, costoTotal]
    );

    res.json({ mensaje: `🎉 ¡Cobro de $${costoTotal.toFixed(2)} completado con éxito! Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });

  } catch (err) {
    console.error("❌ Error en venta múltiple:", err.message);
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


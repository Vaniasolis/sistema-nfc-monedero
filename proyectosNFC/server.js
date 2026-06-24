const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');

const app = express();

// 1. 🌍 CONFIGURACIÓN UNIVERSAL DE CORS: Esto le abre las compuertas de forma automática a los preflights de Chrome y APKs
app.use(cors());

// 2. ⚡ TRADUCTOR DE JSON (Vital para leer tus formularios)
app.use(express.json());

// 3. ☁️ TU CONEXIÓN COMERCIAL A LA NUBE DE NEON
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_m8TaIP3CjYKO@ep-wild-credit-ad09j161-pooler.c.us-east-1.aws.neon.tech/neondb?options=endpoint%3Dep-wild-credit-ad09j161&sslmode=require',
});

// 🎟️ RUTAS DE PULSERAS
app.get('/pulseras', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pulseras ORDER BY fecha_registro DESC');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pulseras' });
  }
});

app.post('/pulseras', async (req, res) => {
  try {
    const { codigo_nfc, tipo_acceso_id, saldo } = req.body;
    const resultado = await pool.query(
      'INSERT INTO pulseras (codigo_nfc, tipo_acceso_id, saldo) VALUES ($1, $2, $3) RETURNING *',
      [codigo_nfc, tipo_acceso_id, saldo]
    );
    res.json({ guardado: true, pulsera: resultado.rows });
  } catch (err) {
    console.error("❌ FALLA REAL EN POSTGRESQL:", err.message);
    res.status(500).json({ guardado: false, error: err.message });
  }
});

app.put('/pulseras/recargar', async (req, res) => {
  try {
    const { codigo_nfc, monto } = req.body;
    await pool.query('UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2', [monto, codigo_nfc]);
    res.json({ exito: true, mensaje: 'Recarga exitosa' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al recargar' });
  }
});

// 🍔 RUTAS DE CATALOGO Y MENÚ
app.get('/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/productos', async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;
    await pool.query('INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3)', [nombre, precio, stock]);
    res.json({ guardado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar producto' });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ exito: true, mensaje: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se puede eliminar un producto con historial de ventas' });
  }
});

// 🛒 RUTAS DE PUNTO DE VENTA (POS)
app.post('/ventas', async (req, res) => {
  try {
    const { codigo_nfc, producto_id } = req.body;
    
    const pulseraRes = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (pulseraRes.rows.length === 0) return res.status(404).json({ error: 'Pulsera no registrada en el evento' });
    
    const prodRes = await pool.query('SELECT * FROM productos WHERE id = $1', [producto_id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: 'Producto no existe' });

    const pulsera = pulseraRes.rows;
    const producto = prodRes.rows;

    if (producto.stock <= 0) return res.status(400).json({ error: 'Artículo agotado en barra' });
    if (parseFloat(pulsera.saldo) < parseFloat(producto.precio)) return res.status(400).json({ error: 'Saldo insuficiente en pulsera' });

    await pool.query('UPDATE pulseras SET saldo = saldo - $1 WHERE codigo_nfc = $2', [producto.precio, codigo_nfc]);
    await pool.query('UPDATE productos SET stock = stock - 1 WHERE id = $1', [producto_id]);
    await pool.query('INSERT INTO ventas (pulsera_id, total) VALUES ($1, $2)', [codigo_nfc, producto.precio]);

    res.json({ mensaje: `¡Compra exitosa! Se descontó $${producto.precio} de tu saldo.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la venta cashless' });
  }
});

app.get('/reporte-ventas', async (req, res) => {
  try {
    const consulta = `
      SELECT p.precio AS precio_articulo, COUNT(v.id) AS cantidad_vendida, SUM(v.total) AS total_recaudado
      FROM ventas v
      JOIN productos p ON v.total = p.precio
      GROUP BY p.precio;
    `;
    const resultado = await pool.query(consulta);
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

app.post('/api/sistema/reiniciar-evento', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;');
    await pool.query('TRUNCATE TABLE pulseras CASCADE;');
    await pool.query('TRUNCATE TABLE productos RESTART IDENTITY CASCADE;');
    res.json({ exito: true, mensaje: '¡El sistema completo ha sido reiniciado en internet!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exito: false, error: 'No se pudo limpiar el sistema' });
  }
});

// ⚡ PUERTO ASIGNADO DINÁMICAMENTE POR RAILWAY
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor comercial corriendo con éxito en el puerto ${PORT}`);
});
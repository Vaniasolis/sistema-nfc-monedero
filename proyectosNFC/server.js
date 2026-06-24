const express = require('express');
const cors = require('cors');
// 🌟 FUNCIÓN NATIVA DE NEON
const { neon } = require('@neondatabase/serverless');

const app = express();

// Permisos globales de comunicación
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Responder de forma inmediata a los chequeos previos (preflight) del navegador
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ☁️ CONEXIÓN DE BAJA LATENCIA A NEON CLOUD
const sql = neon(process.env.DATABASE_URL);

// 🎟️ RUTAS DE PULSERAS
app.get('/pulseras', async (req, res) => {
  try {
    // 🌟 CORREGIDO: Usamos sql.query para la lectura limpia de las tablas
    const filas = await sql.query('SELECT * FROM pulseras ORDER BY fecha_registro DESC;');
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/pulseras', async (req, res) => {
  try {
    const { codigo_nfc, tipo_acceso_id, saldo } = req.body;
    // 🌟 CORREGIDO: Usamos sql.query para insertar con marcadores de posición
    await sql.query(
      'INSERT INTO pulseras (codigo_nfc, tipo_acceso_id, saldo) VALUES ($1, $2, $3);',
      [codigo_nfc, parseInt(tipo_acceso_id), parseFloat(saldo)]
    );
    res.json({ guardado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ guardado: false, error: err.message });
  }
});

app.put('/pulseras/recargar', async (req, res) => {
  try {
    const { codigo_nfc, monto } = req.body;
    // 🌟 CORREGIDO: Usamos sql.query
    await sql.query('UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2;', [parseFloat(monto), codigo_nfc]);
    res.json({ exito: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 🍔 RUTAS DE CATÁLOGO Y MENÚ
app.get('/productos', async (req, res) => {
  try {
    // 🌟 CORREGIDO: Usamos sql.query para jalar los productos
    const filas = await sql.query('SELECT * FROM productos ORDER BY id ASC;');
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/productos', async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;
    // 🌟 CORREGIDO: Usamos sql.query
    await sql.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3);',
      [nombre, parseFloat(precio), parseInt(stock)]
    );
    res.json({ guardado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 🌟 CORREGIDO: Usamos sql.query
    await sql.query('DELETE FROM productos WHERE id = $1;', [parseInt(id)]);
    res.json({ exito: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se puede eliminar un producto con historial de ventas' });
  }
});

// 🛒 RUTAS DE PUNTO DE VENTA (POS)
app.post('/ventas', async (req, res) => {
  try {
    const { codigo_nfc, producto_id } = req.body;
    
    // 🌟 CORREGIDO: Usamos sql.query en las consultas internas
    const pulseras = await sql.query('SELECT * FROM pulseras WHERE codigo_nfc = $1;', [codigo_nfc]);
    if (pulseras.length === 0) return res.status(404).json({ error: 'Pulsera no registrada en el evento' });
    
    const productos = await sql.query('SELECT * FROM productos WHERE id = $1;', [parseInt(producto_id)]);
    if (productos.length === 0) return res.status(404).json({ error: 'Producto no existe' });

    const pulsera = pulseras[0];
    const producto = productos[0];

    if (producto.stock <= 0) return res.status(400).json({ error: 'Artículo agotado en barra' });
    if (parseFloat(pulsera.saldo) < parseFloat(producto.precio)) return res.status(400).json({ error: 'Saldo insuficiente en pulsera' });

    await sql.query('UPDATE pulseras SET saldo = saldo - $1 WHERE codigo_nfc = $2;', [producto.precio, codigo_nfc]);
    await sql.query('UPDATE productos SET stock = stock - 1 WHERE id = $1;', [parseInt(producto_id)]);
    await sql.query('INSERT INTO ventas (pulsera_id, total) VALUES ($1, $2);', [codigo_nfc, producto.precio]);

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
    // 🌟 CORREGIDO: Usamos sql.query
    const filas = await sql.query(consulta);
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sistema/reiniciar-evento', async (req, res) => {
  try {
    // 🌟 CORREGIDO: Usamos sql.query
    await sql.query('TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;');
    await sql.query('TRUNCATE TABLE pulseras CASCADE;');
    await sql.query('TRUNCATE TABLE productos RESTART IDENTITY CASCADE;');
    res.json({ exito: true, mensaje: '¡El sistema completo ha sido reiniciado en internet!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exito: false, error: err.message });
  }
});

// El puerto dinámico comercial de Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor nativo corriendo con éxito en el puerto ${PORT}`);
});

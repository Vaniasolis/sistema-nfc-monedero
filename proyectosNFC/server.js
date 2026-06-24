const express = require('express');
const cors = require('cors');
// 🌟 IMPORTACIÓN COMPLETA: Traemos la configuración y el cliente tradicional
const { Client, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws'); // 🔌 Traemos el motor de WebSockets clásico

// 🚀 ENLACE DE CONEXIÓN OBLIGATORIO PARA RAILWAY:
// Esto le enseña a Neon cómo simular un navegador en servidores de internet
neonConfig.webSocketConstructor = ws;

const app = express();


// Permisos globales de comunicación abiertos
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Atendedor de preguntas previas preflight del navegador
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 🎟️ RUTAS DE PULSERAS
app.get('/pulseras', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    const resultado = await client.query('SELECT * FROM pulseras ORDER BY fecha_registro DESC;');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

app.post('/pulseras', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc, tipo_acceso_id, saldo } = req.body;
    await client.connect();
    await client.query(
      'INSERT INTO pulseras (codigo_nfc, tipo_acceso_id, saldo) VALUES ($1, $2, $3);',
      [codigo_nfc, parseInt(tipo_acceso_id), parseFloat(saldo)]
    );
    res.json({ guardado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ guardado: false, error: err.message });
  } finally {
    await client.end();
  }
});

app.put('/pulseras/recargar', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc, monto } = req.body;
    await client.connect();
    await client.query('UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2;', [parseFloat(monto), codigo_nfc]);
    res.json({ exito: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// 🍔 RUTAS DE CATÁLOGO Y MENÚ
app.get('/productos', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    const resultado = await client.query('SELECT * FROM productos ORDER BY id ASC;');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

app.post('/productos', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { nombre, precio, stock } = req.body;
    await client.connect();
    await client.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3);',
      [nombre, parseFloat(precio), parseInt(stock)]
    );
    res.json({ guardado: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ guardado: false, error: err.message });
  } finally {
    await client.end();
  }
});

app.delete('/productos/:id', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { id } = req.params;
    await client.connect();
    await client.query('DELETE FROM productos WHERE id = $1;', [parseInt(id)]);
    res.json({ exito: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se puede eliminar un producto con historial de ventas' });
  } finally {
    await client.end();
  }
});

// 🛒 RUTAS DE PUNTO DE VENTA (POS)
app.post('/ventas', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc, producto_id } = req.body;
    await client.connect();
    
    const pulserasRes = await client.query('SELECT * FROM pulseras WHERE codigo_nfc = $1;', [codigo_nfc]);
    if (pulserasRes.rows.length === 0) return res.status(404).json({ error: 'Pulsera no registrada en el evento' });
    
    const productosRes = await client.query('SELECT * FROM productos WHERE id = $1;', [parseInt(producto_id)]);
    if (productosRes.rows.length === 0) return res.status(404).json({ error: 'Producto no existe' });

    const pulsera = pulserasRes.rows[0];
    const producto = productosRes.rows[0];

    if (producto.stock <= 0) return res.status(400).json({ error: 'Artículo agotado en barra' });
    if (parseFloat(pulsera.saldo) < parseFloat(producto.precio)) return res.status(400).json({ error: 'Saldo insuficiente en pulsera' });

    await client.query('UPDATE pulseras SET saldo = saldo - $1 WHERE codigo_nfc = $2;', [producto.precio, codigo_nfc]);
    await client.query('UPDATE productos SET stock = stock - 1 WHERE id = $1;', [parseInt(producto_id)]);
    await client.query('INSERT INTO ventas (pulsera_id, total) VALUES ($1, $2);', [codigo_nfc, producto.precio]);

    res.json({ mensaje: `¡Compra exitosa! Se descontó $${producto.precio} de tu saldo.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la venta cashless' });
  } finally {
    await client.end();
  }
});

app.get('/reporte-ventas', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const consulta = `
      SELECT p.precio AS precio_articulo, COUNT(v.id) AS cantidad_vendida, SUM(v.total) AS total_recaudado
      FROM ventas v
      JOIN productos p ON v.total = p.precio
      GROUP BY p.precio;
    `;
    await client.connect();
    const resultado = await client.query(consulta);
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

app.post('/api/sistema/reiniciar-evento', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    await client.query('TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;');
    await client.query('TRUNCATE TABLE pulseras CASCADE;');
    await client.query('TRUNCATE TABLE productos RESTART IDENTITY CASCADE;');
    res.json({ exito: true, mensaje: '¡El sistema completo ha sido reiniciado en internet!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exito: false, error: err.message });
  } finally {
    await client.end();
  }
});

// El puerto dinámico comercial de Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor nativo corriendo con éxito en el puerto ${PORT}`);
});

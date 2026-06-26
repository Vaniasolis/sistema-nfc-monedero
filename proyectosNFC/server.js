const express = require('express');
const cors = require('cors');
const { Client, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configuración obligatoria de WebSockets para Railway
neonConfig.webSocketConstructor = ws;

const app = express();

// Permisos globales de comunicación abiertos
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Atendedor de preguntas previas preflight de Chrome
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 🎟️ RUTAS DE PULSERAS (Mapeado exacto para tus datos de la foto)
app.get('/pulseras', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    const resultado = await client.query('SELECT codigo_nfc, tipo_acceso_id, saldo, fecha_registro FROM pulseras ORDER BY fecha_registro DESC;');
    // Retornamos directamente las filas en un arreglo limpio para tu React
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ ERROR EN GET PULSERAS:", err.message);
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
    console.error("❌ ERROR EN POST PULSERAS:", err.message);
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

// ↩️ RUTA DE REVERSIÓN: Cancela la última venta de una pulsera, regresa saldo y devuelve stock
app.post('/ventas/revertir', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc } = req.body;
    if (!codigo_nfc) {
      return res.status(400).json({ error: 'Código NFC obligatorio.' });
    }

    await client.connect();

    // 1. Buscamos la última venta registrada de esta pulsera en el evento
    const ultimaVentaRes = await client.query(
      'SELECT * FROM ventas WHERE pulsera_id = $1 ORDER BY fecha_venta DESC LIMIT 1;',
      [codigo_nfc]
    );

    if (ultimaVentaRes.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron ventas recientes para esta pulsera.' });
    }

    // 🌟 Sintonizado con tu estilo: Leemos la fila [0]
    const ultimaVenta = ultimaVentaRes.rows[0];
    const montoARegresar = parseFloat(ultimaVenta.total);

    // 2. Buscamos qué producto costaba exactamente eso para devolverle su pieza al stock
    const productoRes = await client.query(
      'SELECT id FROM productos WHERE precio = $1 LIMIT 1;',
      [montoARegresar]
    );

    // 3. HACE LA MAGIA EN NEON CLOUD (Regresa dinero a la pulsera)
    await client.query('UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2;', [montoARegresar, codigo_nfc]);
    
    // Si encontramos el producto, le regresamos su pieza al Stock
    if (productoRes.rows.length > 0) {
      const producto = productoRes.rows[0];
      await client.query('UPDATE productos SET stock = stock + 1 WHERE id = $1;', [producto.id]);
    }

    // 4. Borramos ese registro de venta para limpiar el historial de caja
    await client.query('DELETE FROM ventas WHERE id = $1;', [ultimaVenta.id]);

    return res.json({ mensaje: `↩️ Reversión exitosa. Se regresaron $${montoARegresar} a la pulsera.` });

  } catch (err) {
    console.error("❌ ERROR EN REVERSIÓN:", err.message);
    return res.status(500).json({ error: 'No se pudo procesar la cancelación de la venta.' });
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

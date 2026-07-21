const express = require('express');
const cors = require('cors');
const app = express();
const { Pool } = require('pg');
app.use(cors({
  origin: '*', // Permite que tu frontend de Vercel acceda sin restricciones
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// 🔌 AGREGA ESTAS LÍNEAS AQUÍ ABAJO PARA REPARAR LOS DOS ERRORES:
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

// 📦 2. RUTA: OBTENER TODAS LAS PULSERAS (MONEDEROS CASHLESS)
app.get('/pulseras', async (req, res) => {
  try {
    // Usamos "código_nfc" con comillas dobles tal como vimos en tu Neon Cloud
    const resultado = await pool.query('SELECT * FROM pulseras ORDER BY "código_nfc" ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en pulseras:", err.message);
    res.status(500).json({ error: "Fallo en el servidor al leer pulseras" });
  }
});

app.post('/pulseras', async (req, res) => {
  try {
    const { codigo_nfc, tipo_acceso_id, saldo } = req.body;
    await pool.query(
      'INSERT INTO pulseras ("código_nfc", tipo_acceso_id, saldo) VALUES ($1, $2, $3);',
      [codigo_nfc, parseInt(tipo_acceso_id) || 1, parseFloat(saldo) || 0]
    );
    res.json({ guardado: true });
  } catch (err) {
    console.error("❌ ERROR EN POST PULSERAS:", err.message);
    res.status(500).json({ guardado: false, error: err.message });
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

// 📦 1. RUTA: OBTENER TODOS LOS PRODUCTOS
app.get('/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en productos:", err.message);
    res.status(500).json({ error: "Fallo en el servidor al leer productos" });
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

// 🧹 RUTA DE REINICIO TOTAL: Vacía ventas y pulseras para dejar el evento limpio en ceros
app.delete('/pulseras/limpiar', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();

    // 🌟 REGLA DE ORO: Borramos primero el historial de ventas para liberar los candados relacionales
    await client.query('DELETE FROM ventas;');
    
    // Ahora que las ventas están vacías, ya podemos limpiar las pulseras sin bloqueos
    await client.query('DELETE FROM pulseras;');

    return res.json({ mensaje: '🧹 Evento reiniciado con éxito. Todos los registros de pulseras y ventas han sido vaciados.' });

  } catch (err) {
    console.error("❌ ERROR AL LIMPIAR EVENTO EN BACKEND:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'No se pudo vaciar la base de datos del evento.' });
    }
  } finally {
    await client.end();
  }
});


// 🛒 RUTAS DE PUNTO DE VENTA (POS) - CORREGIDA SIN RESPUESTAS DUPLICADAS
app.post('/ventas', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc, producto_id } = req.body;
    await client.connect();
    
    // 1. Buscamos la pulsera
    const pulserasRes = await client.query(
      'SELECT * FROM pulseras WHERE LOWER(codigo_nfc) = LOWER($1);', 
      [codigo_nfc.trim()]
    );
    if (pulserasRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pulsera no registrada en el evento' });
    }
    
    // 2. Buscamos el producto
    const productosRes = await client.query('SELECT * FROM productos WHERE id = $1;', [parseInt(producto_id)]);
    if (productosRes.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no existe' });
    }

    const pulsera = pulserasRes.rows[0]; // 🌟 Ajustado para leer el primer registro
    const producto = productosRes.rows[0];

    // 3. Validamos stock y saldo
    if (producto.stock <= 0) {
      return res.status(400).json({ error: 'Artículo agotado en barra' });
    }
    if (parseFloat(pulsera.saldo) < parseFloat(producto.precio)) {
      return res.status(400).json({ error: 'Saldo insuficiente en pulsera' });
    }

    // 4. Procesamos la transacción en la nube de Neon
    await client.query('UPDATE pulseras SET saldo = saldo - $1 WHERE codigo_nfc = $2;', [producto.precio, codigo_nfc]);
    await client.query('UPDATE productos SET stock = stock - 1 WHERE id = $1;', [parseInt(producto_id)]);
    await client.query('INSERT INTO ventas (pulsera_id, total) VALUES ($1, $2);', [codigo_nfc, producto.precio]);

    // 🌟 REGLA DE ORO: El 'return' frena el código de inmediato para que no mande más respuestas
    return res.json({ mensaje: `¡Compra exitosa! Se descontó $${producto.precio} de tu saldo.` });

  } catch (err) {
    console.error("❌ ERROR EN PROCESAR VENTA:", err.message);
    // Aseguramos que si cae aquí, no haya mandado la respuesta de éxito antes
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error al procesar la venta cashless' });
    }
  } finally {
    await client.end();
  }
});

// 📦 3. RUTA: PROCESAR COBRO MÚLTIPLE DESDE EL CARRITO (BOTÓN VERDE)
app.post('/ventas/multiple', async (req, res) => {
  const { codigo_nfc, items } = req.body;
  if (!codigo_nfc || !items || items.length === 0) {
    return res.status(400).json({ error: "Datos incompletos para procesar la venta masiva" });
  }

  try {
    const pulserasEncontradas = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (pulserasEncontradas.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera aproximada no existe en el sistema" });
    }

    const pulsera = pulserasEncontradas.rows[0];
    let costoTotal = 0;

    items.forEach(item => {
      costoTotal += parseFloat(item.precio) * parseInt(item.cantidad);
    });

    if (parseFloat(pulsera.saldo) < costoTotal) {
      return res.status(400).json({ error: `Saldo insuficiente. Total orden: $${costoTotal.toFixed(2)}, Saldo disponible: $${parseFloat(pulsera.saldo).toFixed(2)}` });
    }

    const nuevoSaldo = parseFloat(pulsera.saldo) - costoTotal;

    // Actualizamos el monedero en un milisegundo en Railway
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);

    // Registramos la auditoría de la compra en la bitácora
    const descripcionVenta = items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
    await pool.query('INSERT INTO ventas (codigo_nfc, descripcion, monto) VALUES ($1, $2, $3)', [codigo_nfc, descripcionVenta, costoTotal]);

    res.json({ mensaje: `🎉 ¡Cobro de $${costoTotal.toFixed(2)} completado con éxito! Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });

  } catch (err) {
    console.error("Error en venta múltiple:", err);
    res.status(500).json({ error: "Error interno al procesar el cobro múltiple en la nube" });
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

// 🧹 RUTA DE REINICIO TOTAL CORREGIDA: Vacía historial de ventas y pulseras, pero respeta las bebidas
app.delete('/pulseras/limpiar', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    // Borramos primero las ventas para liberar candados relacionales
    await client.query('DELETE FROM ventas;');
    // Ahora vaciamos las pulseras de taquilla manteniendo tu catálogo de bebidas intacto
    await client.query('DELETE FROM pulseras;');
    return res.json({ mensaje: '🧹 Evento reiniciado con éxito. Registros y ventas vaciados en ceros.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// 🧹 RUTA DE REINICIO TOTAL CORREGIDA: Vacía historial de ventas y pulseras, pero respeta las bebidas
app.delete('/pulseras/limpiar', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    await client.connect();
    // Borramos primero las ventas para liberar candados relacionales
    await client.query('DELETE FROM ventas;');
    // Ahora vaciamos las pulseras de taquilla manteniendo tu catálogo de bebidas intacto
    await client.query('DELETE FROM pulseras;');
    return res.json({ mensaje: '🧹 Evento reiniciado con éxito. Registros y ventas vaciados en ceros.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  } finally {
    await client.end();
  }
});

// 🗑️ RUTA DE BORRADO INDIVIDUAL: Elimina una sola pulsera específica si no pagó (¡AQUÍ VA!)
app.delete('/pulseras/eliminar/:codigo_nfc', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc } = req.params;
    await client.connect();
    // 1. Desamarramos cualquier historial de venta accidental
    await client.query('DELETE FROM ventas WHERE pulsera_id = $1;', [codigo_nfc]);
    // 2. Destruimos la pulsera de Neon Cloud
    await client.query('DELETE FROM pulseras WHERE codigo_nfc = $1;', [codigo_nfc]);
    return res.json({ mensaje: `🗑️ Pulsera ${codigo_nfc} eliminada de la taquilla correctamente.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'No se pudo eliminar la pulsera.' });
  } finally {
    await client.end();
  }
});

// 📜 RUTA PARA CONSULTAR EL HISTORIAL DE VENTAS PERFECTA Y SIN FILTROS ROTOS
app.get('/ventas/historial/:codigo_nfc', async (req, res) => {
  const client = new Client(process.env.DATABASE_URL);
  try {
    const { codigo_nfc } = req.params;
    await client.connect();

    // 📡 Hacemos la consulta limpia cruzando las tablas para jalar el nombre del artículo
    const consulta = await client.query(
      `SELECT v.id, v.total, v.fecha_venta, v.producto_id, p.nombre AS producto_nombre 
       FROM ventas v
       LEFT JOIN productos p ON v.producto_id = p.id
       WHERE v.pulsera_id = $1 OR v.codigo_nfc = $1
       ORDER BY v.id DESC;`,
      [codigo_nfc.trim()]
    );

    // 🌟 LA REGLA DE ORO: Mandamos estrictamente las filas limpias rows al frontend
    return res.json(consulta.rows || []);

  } catch (err) {
    console.error("❌ ERROR AL OBTENER HISTORIAL EN BACKEND:", err.message);
    // 🌟 CAMBIAMOS ESTA LÍNEA PARA QUE TE DIGA EL ERROR REAL DE POSTGRES EN LA PANTALLA:
    return res.status(500).json({ error: `Falla en Postgres: ${err.message}` });
  } finally {
    await client.end();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor comercial corriendo en el puerto ${PORT}`);
});

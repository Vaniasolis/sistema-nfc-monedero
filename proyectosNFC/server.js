const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const COSTO_ACCESO = 20.00;

app.get('/', (req, res) => {
  res.send('API NFC de Pulseras funcionando');
});

// 1. OBTENER TODAS LAS PULSERAS
app.get('/pulseras', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM pulseras ORDER BY codigo_nfc'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar las pulseras' });
  }
});

// 2. REGISTRAR NUEVA PULSERA (Corregido para devolver el objeto directo)
app.post('/pulseras', async (req, res) => {
  try {
    const { codigo_nfc, tipo_acceso_id, saldo } = req.body;

    const resultado = await pool.query(
      'INSERT INTO pulseras (codigo_nfc, fecha_registro, tipo_acceso_id, saldo) VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *',
      [codigo_nfc, tipo_acceso_id, saldo]
    );

    // Mandamos el objeto de la primera posición [0] para que Axios lo lea de inmediato
    res.status(201).json({
      guardado: true,
      mensaje: 'Pulsera registrada con éxito',
      pulsera: resultado.rows[0] 
    });
  } catch (error) {
    console.error("Error en consola del servidor:", error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El código NFC ya se encuentra registrado' });
    }
    res.status(500).json({ error: 'Error al registrar la pulsera en la base de datos' });
  }
});

// 3. VALIDAR Y DESCONTAR SALDO
app.post('/validar', async (req, res) => {
  try {
    const { codigo_nfc } = req.body;

    const buscarPulsera = await pool.query(
      'SELECT * FROM pulseras WHERE codigo_nfc = $1',
      [codigo_nfc]
    );

    if (buscarPulsera.rows.length === 0) {
      return res.status(404).json({ autorizado: false, mensaje: 'Pulsera no encontrada' });
    }

    const pulsera = buscarPulsera.rows[0];
    const saldoActual = parseFloat(pulsera.saldo);

    if (saldoActual < COSTO_ACCESO) {
      return res.status(403).json({
        autorizado: false,
        mensaje: 'Saldo insuficiente',
        saldo_actual: saldoActual
      });
    }

    const nuevoSaldo = saldoActual - COSTO_ACCESO;
    const actualizacion = await pool.query(
      'UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2 RETURNING *',
      [nuevoSaldo, codigo_nfc]
    );

    res.json({
      autorizado: true,
      mensaje: 'Acceso concedido',
      codigo_nfc: actualizacion.rows[0].codigo_nfc,
      saldo_actual: actualizacion.rows[0].saldo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la validación' });
  }
});

// 4. OBTENER PRODUCTOS
app.get('/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos WHERE stock > 0 ORDER BY id');
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

// 5. PROCESAR VENTAS
app.post('/ventas', async (req, res) => {
  try {
    const { codigo_nfc, producto_id } = req.body;

    const buscarProducto = await pool.query('SELECT * FROM productos WHERE id = $1', [producto_id]);
    if (buscarProducto.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    
    const producto = buscarProducto.rows[0];
    if (producto.stock <= 0) return res.status(400).json({ error: 'Producto agotado' });

    const buscarPulsera = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (buscarPulsera.rows.length === 0) return res.status(404).json({ error: 'Pulsera no registrada' });

    const pulsera = buscarPulsera.rows[0];
    const precioProducto = parseFloat(producto.precio);
    const saldoActual = parseFloat(pulsera.saldo);

    if (saldoActual < precioProducto) return res.status(400).json({ error: 'Saldo insuficiente' });

    const nuevoSaldo = saldoActual - precioProducto;
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);
    await pool.query('UPDATE productos SET stock = stock - 1 WHERE id = $1', [producto_id]);

    res.json({ exito: true, mensaje: `Venta exitosa de: ${producto.nombre}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

// 🍺 NUEVA RUTA: Registrar un nuevo producto o bebida en el catálogo
app.post('/productos', async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    // Insertamos el producto en PostgreSQL
    const resultado = await pool.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3) RETURNING *',
      [nombre, parseFloat(precio), parseInt(stock || 100)]
    );

    res.status(201).json({
      guardado: true,
      mensaje: 'Producto añadido correctamente',
      producto: resultado.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el producto en la base de datos' });
  }
});

// 💰 RUTA: Recargar saldo sumando el monto al dinero actual de la pulsera
app.put('/pulseras/recargar', async (req, res) => {
  try {
    const { codigo_nfc, monto } = req.body;

    // 1. Validar que el monto sea un número válido y mayor a cero
    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({
        exito: false,
        error: 'El monto de la recarga debe ser mayor a 0'
      });
    }

    // 2. Ejecutar la actualización sumando el monto de forma directa en SQL
    const resultado = await pool.query(
      'UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2 RETURNING *',
      [parseFloat(monto), codigo_nfc]
    );

    // 3. Si la consulta no afectó a ninguna fila, la pulsera no existe
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        exito: false,
        error: 'No se encontró la pulsera'
      });
    }

    res.json({
      exito: true,
      mensaje: 'Recarga procesada con éxito',
      pulsera: resultado.rows[0]
    });

  } catch (error) {
    console.error("Error al recargar saldo:", error);
    res.status(500).json({
      exito: false,
      error: 'Error interno al procesar la recarga de saldo'
    });
  }
});

// ⚡ MODIFICADO: '0.0.0.0' le ordena a Node.js escuchar las peticiones de tu celular Samsung S25
app.listen(3000, '0.0.0.0', () => {
  console.log('Servidor iniciado en puerto 3000 y abierto a la red local');
});



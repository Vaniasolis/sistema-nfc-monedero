const express = require('express');
const cors = require('cors');

// 🌟 LA CLAVE CLOUD: Usamos el Pool serverless oficial que resuelve el Endpoint ID en internet
const { Pool } = require('@neondatabase/serverless'); 

const app = express();

// 🌍 CONECTADO A INTERNET DE FORMA OFICIAL:
// Coloca tu string largo original de Neon que copiaste al inicio de la sesión
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_m8TaIP3CjYKO@ep-wild-credit-ad09j161-pooler.c.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

app.use(cors());
app.use(express.json());
// ... (Aquí ya continúan tus rutas de app.get, app.post, etc. hacia abajo)

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

    // Ejecutamos la inserción en tu tabla pulseras
    const resultado = await pool.query(
      'INSERT INTO pulseras (codigo_nfc, tipo_acceso_id, saldo) VALUES ($1, $2, $3) RETURNING *',
      [codigo_nfc, tipo_acceso_id, saldo]
    );

    res.json({ guardado: true, pulsera: resultado.rows[0] });

  } catch (e) {

  console.error("ERROR COMPLETO:", e);

  if (e.response) {
    alert(
      `Status: ${e.response.status}\n` +
      JSON.stringify(e.response.data)
    );
  } else {
    alert(e.message);
  }
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

    // A. Buscar el producto y su precio
    const buscarProducto = await pool.query('SELECT * FROM productos WHERE id = $1', [producto_id]);
    if (buscarProducto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const producto = buscarProducto.rows[0];

    // B. Buscar la pulsera y su saldo
    const buscarPulsera = await pool.query('SELECT * FROM pulseras WHERE codigo_nfc = $1', [codigo_nfc]);
    if (buscarPulsera.rows.length === 0) {
      return res.status(404).json({ error: 'Pulsera no registrada' });
    }
    const pulsera = buscarPulsera.rows[0];

    const precioProducto = parseFloat(producto.precio);
    const saldoActual = parseFloat(pulsera.saldo);

    // C. Verificar si hay stock disponible en el catálogo
    if (parseInt(producto.stock) <= 0) {
      return res.status(400).json({ error: 'Producto agotado en el catálogo' });
    }

    // D. Verificar si le alcanza el dinero al cliente
    if (saldoActual < precioProducto) {
      return res.status(400).json({ error: 'Saldo insuficiente en la pulsera' });
    }

    // E. PROCESAR ACCIONES EN LA BASE DE DATOS (PostgreSQL)
    
    // 1. Restar dinero de la pulsera
    const nuevoSaldo = saldoActual - precioProducto;
    await pool.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);
    
    // 2. ⚡ ACTUALIZADO: Restar 1 pieza del stock del producto seleccionado en el catálogo
    await pool.query('UPDATE productos SET stock = stock - 1 WHERE id = $1', [producto_id]);
    
    // 3. Registrar la venta en tu tabla histórica para el Excel
    await pool.query(
      'INSERT INTO ventas (pulsera_id, total, fecha) VALUES ($1, $2, NOW())', 
      [codigo_nfc, precioProducto]
    );

    res.json({
      exito: true,
      mensaje: `Venta exitosa de: ${producto.nombre}`,
      saldo_restante: nuevoSaldo
    });

  } catch (error) {
    console.error("Error exacto en la venta:", error);
    res.status(500).json({ error: 'Error al procesar la venta en la base de datos' });
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

app.get('/reporte-ventas', async (req, res) => {
  try {
    // Agrupamos por el valor de la venta para darle el listado acumulado al cliente
    const consulta = `
      SELECT total as precio_articulo, COUNT(id) as cantidad_vendida, SUM(total) as total_recaudado
      FROM ventas
      GROUP BY total
      ORDER BY cantidad_vendida DESC;
    `;
    const resultado = await pool.query(consulta);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// 📊 RUTA DE REPORTE: Agrupa por el total vendido y cuenta las cantidades
// 📊 RUTA DE REPORTE ACTUALIZADA: Consulta directa de todas las transacciones registradas
app.get('/reporte-ventas', async (req, res) => {
  try {
    const consulta = `
      SELECT id, pulsera_id, total, TO_CHAR(fecha, 'DD/MM/YYYY HH24:MI') as fecha_formateada
      FROM ventas
      ORDER BY id DESC;
    `;
    const resultado = await pool.query(consulta);
    
    // Devolvemos las filas crudas para que React las sume de forma segura
    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al generar el reporte SQL:", error);
    res.status(500).json({ error: 'Error al generar el reporte en la base de datos' });
  }
});

// 🧹 RUTA DE REINICIO: Vacía el historial de compras y las pulseras para un nuevo evento
app.post('/api/sistema/reiniciar-evento', async (req, res) => {
  try {
    // 1. Vaciamos primero la tabla de ventas (historial del Excel)
    await pool.query('TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;');

    // 2. Vaciamos la tabla de pulseras para borrar los saldos viejos
    await pool.query('TRUNCATE TABLE pulseras CASCADE;');

    // 3. Opcional: Si quieres reiniciar el stock de tus productos a 500 pzas automáticamente:
    await pool.query('UPDATE productos SET stock = 500;');

    res.json({
      exito: true,
      mensaje: '¡El sistema ha sido reiniciado con éxito! Listo para el siguiente evento.'
    });

  } catch (error) {
    console.error("Error al reiniciar el evento:", error);
    res.status(500).json({ 
      exito: false, 
      error: 'No se pudo limpiar el sistema de forma segura' 
    });
  }
});

    // ... Aquí terminan tus otras rutas anteriores ...

    // 🧹 RUTA DE REINICIO TOTAL: Vacía absolutamente todo el sistema en ceros
    // 🧹 RUTA DE REINICIO TOTAL CORREGIDA
app.post('/api/sistema/reiniciar-evento', async (req, res) => {
  try {
    // 1. Vaciamos el historial de compras
    await pool.query('TRUNCATE TABLE ventas RESTART IDENTITY CASCADE;');

    // 2. Vaciamos las pulseras y saldos
    await pool.query('TRUNCATE TABLE pulseras CASCADE;');

    // ⚡ ESTA ES LA LÍNEA CLAVE CORREGIDA:
    // Borra todas las bebidas y reinicia los IDs a 1 sin que PostgreSQL lo bloquee
    await pool.query('TRUNCATE TABLE productos RESTART IDENTITY CASCADE;');

    res.json({
      exito: true,
      mensaje: '¡El sistema completo ha sido reiniciado! Las pulseras, ventas y el catálogo de productos están en ceros.'
    });

  } catch (error) {
    console.error("Error al reiniciar el evento:", error);
    res.status(500).json({ exito: false, error: 'No se pudo limpiar el sistema' });
  }
});

// 🗑️ RUTA PARA ELIMINAR UN SOLO PRODUCTO POR ID
app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ exito: true, mensaje: 'Producto eliminado del catálogo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se puede eliminar porque este producto ya fue vendido' });
  }
});

// 🗑️ RUTA PARA ELIMINAR UN SOLO PRODUCTO POR ID
app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.json({ exito: true, mensaje: 'Producto eliminado del catálogo' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se puede eliminar porque este producto ya fue vendido' });
  }
});

// 🌍 CONFIGURACIÓN GLOBAL: Railway inyectará su propio puerto de internet aquí automáticamente
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de Node.js corriendo con éxito en el puerto ${PORT}`);
  console.log('☁️ Conectado exitosamente a PostgreSQL (Neon Cloud)');
});


const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 🔌 CONFIGURACIÓN UNIFICADA DE LA BASE DE DATOS NEON (CON CANDADOS DE ESTABILIDAD)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  
  // 🌟 EL PARCHE DE ORO: Evita el choque entre el pooler de Neon y tu backend
  max: 6,                       // Limita a 6 conexiones simultáneas máximas en tu plan gratis
  idleTimeoutMillis: 2000,      // Cierra hilos muertos después de 2 segundos de inactividad
  connectionTimeoutMillis: 5000 // Cancela peticiones congeladas tras 5 segundos para liberar red
});

app.use(cors({
  origin: '*', // Permite que tu laptop, celulares y tótems consulten sin bloqueos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 🫀 RUTA DE CONTROL: Verificar que el backend responda en Railway
app.get('/', (req, res) => {
  res.send('🚀 Servidor NFC operando con éxito en la nube de Railway.');
});

// 📦 1. RUTA: OBTENER TODOS LOS PRODUCTOS
app.post('/productos', async (req, res) => {
  const { nombre, precio, stock } = req.body;
  if (!nombre || !precio) {
    return res.status(400).json({ error: "El nombre y el precio son obligatorios" });
  }
  try {
    // Inyectamos el producto en tu tabla de Neon SQL usando la variable pool
    await pool.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES ($1, $2, $3)',
      [nombre, parseFloat(precio), parseInt(stock || 0)]
    );
    res.json({ exito: true, mensaje: "🎉 ¡Bebida guardada con éxito en el catálogo de Railway!" });
  } catch (err) {
    console.error("❌ Error en POST registrar producto:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔒 ENDPOINT DE REGISTRO REPARADO DE EXTREMO A EXTREMO (Sincronizado con tus fotos)
app.post('/pulseras', async (req, res) => {
  const { codigo_nfc, saldo_inicial, tipo_pulsera } = req.body;

  if (!codigo_nfc || !codigo_nfc.trim()) {
    return res.status(400).json({ error: "El código de la pulsera es obligatorio" });
  }
  const uidBuscar = codigo_nfc.trim().toUpperCase();

  try {
    // 🌟 1. CANDADO DE EXISTENCIA: Busca usando tu columna real "codigo_nfc"
    const consultaExistencia = await pool.query(
      'SELECT saldo FROM pulseras WHERE UPPER(TRIM(codigo_nfc)) = $1', 
      [uidBuscar]
    );

    // Si ya existe en el evento, detiene la duplicidad de inmediato
    if (consultaExistencia.rows.length > 0) {
      const pulseraExistente = consultaExistencia.rows[0];
      return res.status(400).json({ 
        error: `¡Alerta de Seguridad! La pulsera [${uidBuscar}] ya está registrada en el evento con un saldo de $${pulseraExistente.saldo}. No se puede duplicar.` 
      });
    }

    // 🌟 INSERCIÓN REPARADA: Leemos "saldo_inicial" o "saldo" para que capte el dinero del formulario
    const nuevoRegistro = await pool.query(
      'INSERT INTO pulseras (codigo_nfc, saldo, tipo_acceso_id) VALUES ($1, $2, $3) RETURNING *',
      [uidBuscar, saldo_inicial || req.body.saldo || 0, tipo_pulsera || 1]
    );

    return res.status(201).json({
      success: true,
      message: "Pulsera registrada con éxito absoluto",
      data: nuevoRegistro.rows
    });

  } catch (error) {
    console.error("Error crítico en el candado de registro:", error);
    return res.status(500).json({ error: "Error interno del servidor al validar la pulsera" });
  }
});

// 📦 3. RUTA: RECARGAR DINERO A UNA PULSERA (MODAL DE SALDO - PROTEGIDO)
app.put('/pulseras/recargar', async (req, res) => {
  const { codigo_nfc, monto } = req.body;
  if (!codigo_nfc || parseFloat(monto) <= 0) {
    return res.status(400).json({ error: "Datos o monto de recarga inválidos" });
  }
  try {
    // Sumamos directamente en la base de datos y retornamos el nuevo saldo en un solo paso atómico
    const resultado = await pool.query(
      'UPDATE pulseras SET saldo = saldo + $1 WHERE codigo_nfc = $2 RETURNING saldo',
      [parseFloat(monto), codigo_nfc]
    );
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "La pulsera no existe" });
    }
    
    const nuevoSaldo = resultado.rows[0].saldo;
    res.json({ exito: true, mensaje: `🔋 Recarga exitosa. Nuevo saldo: $${parseFloat(nuevoSaldo).toFixed(2)}` });
  } catch (err) {
    console.error("❌ Error en PUT recargar Railway:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🍹 3. RUTA: PROCESAR COBRO MÚLTIPLE DESDE EL CARRITO (BOTÓN VERDE INDESTRUCTIBLE)
app.post('/ventas/multiple', async (req, res) => {
  const { codigo_nfc, items } = req.body;
  if (!codigo_nfc || !items || items.length === 0) {
    return res.status(400).json({ error: "Datos incompletos para procesar la venta masiva" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // 🛡️ Iniciamos transacción segura

    // Buscamos el saldo de la pulsera
    const busqueda = await client.query(
      'SELECT saldo FROM pulseras WHERE codigo_nfc = $1 FOR UPDATE', 
      [codigo_nfc]
    );

    if (busqueda.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "La pulsera aproximada no existe en el sistema" });
    }

    const saldoActual = parseFloat(busqueda.rows[0].saldo || 0);
    let costoTotal = 0;

    items.forEach(item => {
      costoTotal += parseFloat(item.precio || 0) * parseInt(item.cantidad || 1);
    });

    if (saldoActual < costoTotal) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Saldo insuficiente. Total orden: $${costoTotal.toFixed(2)}, Saldo disponible: $${saldoActual.toFixed(2)}` 
      });
    }

    const nuevoSaldo = saldoActual - costoTotal;

    // Actualizamos el saldo en la tabla pulseras
    await client.query('UPDATE pulseras SET saldo = $1 WHERE codigo_nfc = $2', [nuevoSaldo, codigo_nfc]);

    // 🍺 Descontamos piezas del stock de productos Y registramos en tu tabla 'ventas' real
    for (const item of items) {
      const idProducto = item.producto_id || item.id;
      const cantidadVendida = parseInt(item.cantidad || 1);
      const precioUnitario = parseFloat(item.precio || 0);

      // Descontamos stock usando tu columna física 'id'
      await client.query(
        'UPDATE productos SET stock = GREATEST(0, stock - $1) WHERE id = $2',
        [cantidadVendida, idProducto]
      );

      // 🌟 INSERCIÓN ALINEADA: Usamos 'pulsera_id', 'total' y 'producto_id' por cada ítem del carrito
      for (let i = 0; i < cantidadVendida; i++) {
        await client.query(
          'INSERT INTO ventas (pulsera_id, total, producto_id) VALUES ($1, $2, $3)', 
          [codigo_nfc, precioUnitario, idProducto]
        );
      }
    }

    await client.query('COMMIT'); // Todo perfecto, guardamos en Neon
    res.json({ exito: true, mensaje: `🎉 ¡Cobro de $${costoTotal.toFixed(2)} completado con éxito! Nuevo saldo: $${nuevoSaldo.toFixed(2)}` });

  } catch (err) {
    await client.query('ROLLBACK'); // Cancelamos todo si algo truena
    console.error("❌ Error interno crítico en venta múltiple Railway:", err.message);
    res.status(500).json({ error: "Error interno al procesar el cobro múltiple en la nube" });
  } finally {
    client.release();
  }
});

// 🗑️ 5. RUTA: ELIMINAR UNA PULSERA INDIVIDUAL (CORREGIDA CON 'pulsera_id')
app.delete('/pulseras/eliminar/:id', async (req, res) => {
  const { id } = req.params;
  const idLimpio = id ? String(id).trim() : '';
  
  try {
    // 🛡️ Borramos de ventas usando la columna real 'pulsera_id'
    await pool.query('DELETE FROM ventas WHERE pulsera_id = $1', [idLimpio]);
    
    // Eliminamos la pulsera de la tabla principal
    const resultado = await pool.query('DELETE FROM pulseras WHERE codigo_nfc = $1', [idLimpio]);
    
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "La pulsera que intentas eliminar no existe." });
    }
    
    res.json({ exito: true, mensaje: `🗑️ Pulsera ${idLimpio} fue elimina con exito.` });
  } catch (err) {
    console.error("❌ Error en DELETE pulsera:", err.message);
    res.status(500).json({ error: "Error de base de datos al eliminar." });
  }
});

// 🧹 6. RUTA REFORZADA: VACIAR ÚNICAMENTE EL CATÁLOGO DE BEBIDAS Y SUS DEPENDENCIAS
app.delete('/productos/limpiar-catalogo', async (req, res) => {
  try {
    // 1. 🛡️ LIMPIEZA DE LLAVES: Borramos primero la bitácora de ventas para liberar la restricción
    await pool.query('DELETE FROM ventas;');

    // 2. Borramos ahora sí el catálogo completo de bebidas de forma segura
    await pool.query('DELETE FROM productos;');
    
    // 3. Reiniciamos el contador autoincremental de la tabla de productos a 1
    await pool.query('ALTER SEQUENCE productos_id_seq RESTART WITH 1;');
    
    res.json({ exito: true, mensaje: '🧹 Catálogo de productos y ventas vaciado con éxito. Contadores en 1.' });
  } catch (err) {
    console.error("❌ Error en DELETE limpiar catálogo Railway:", err.message);
    res.status(500).json({ error: "Error interno al intentar vaciar el catálogo de bebidas." });
  }
});

// 📊 OBTENER PULSERAS (MUESTRA TODO LO QUE HAYA EN TIEMPO REAL)
app.get('/pulseras', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM pulseras ORDER BY codigo_nfc DESC');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener pulseras:', error);
    res.status(500).json({ error: 'Error interno al obtener pulseras' });
  }
});

// 🗑️ RUTA DE LIMPIEZA ABSOLUTA: BORRA TODO DE LA BASE DE DATOS AL FINALIZAR EL EVENTO
app.put('/pulseras/finalizar-evento', async (req, res) => {
  try {
    // 💥 COMANDO DESTRUCIVO COMPLETO: Vacía la tabla por completo para el siguiente evento
    await pool.query('DELETE FROM pulseras');
    res.json({ mensaje: '🎉 Éxito. Base de datos vaciada por completo para el nuevo evento.' });
  } catch (error) {
    console.error('Error al vaciar la base de datos:', error);
    res.status(500).json({ error: 'No se pudo vaciar la tabla.' });
  }
});

// 🍹 RUTA EXCLUSIVA: ENVIAR LOS PRODUCTOS DE NEON A TU CATÁLOGO VISUAL (ORDENADO POR ID 1)
app.get('/productos', async (req, res) => {
  try {
    // 🌟 REPARACIÓN DE ORO: Cambiamos DESC por ASC para que el ID 1 aparezca siempre arriba
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET obtener productos:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🎟️ RUTA EXCLUSIVA: CONSULTAR HISTORIAL DE VENTAS (CORREGIDA CON 'pulsera_id')
app.get('/ventas/historial/:codigo_nfc', async (req, res) => {
  const { codigo_nfc } = req.params;
  try {
    // 🚀 Buscamos usando la columna real 'pulsera_id'
    const resultado = await pool.query(
      'SELECT * FROM ventas WHERE pulsera_id ILIKE $1 ORDER BY id DESC', 
      [codigo_nfc.trim()]
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error("❌ Error en GET obtener historial de ventas:", err.message);
    res.status(500).json({ error: "Error al obtener historial." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor comercial unificado corriendo en el puerto ${PORT}`);
});

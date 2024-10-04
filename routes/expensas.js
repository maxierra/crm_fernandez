const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Ajusta la ruta según sea necesario


// Ruta para buscar inquilino por ID, nombre del inquilino o calle
router.get('/buscar-inquilino', (req, res) => {
    const search = req.query.search;
    const sql = `
        SELECT * FROM contratos 
        WHERE id = ? OR inquilino LIKE ? OR calle LIKE ?
    `;
    db.get(sql, [search, `%${search}%`, `%${search}%`], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});
// Ruta para guardar expensas
router.post('/guardar-expensas', (req, res) => {
    const { calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado } = req.body;
    
    const sql = `
        INSERT INTO expensas (calle, numero, nombre_propietario, expensas_comunes, expensas_extraordinarias, periodo, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});


// Ruta para obtener todas las expensas
router.get('/obtener-expensas', (req, res) => {
    const sql = `SELECT * FROM expensas`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Ruta para eliminar expensas por ID
router.delete('/eliminar-expensas/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM expensas WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

// Función para registrar el egreso en caja_diaria
function registrarEgresoExpensas(expensas, callback) {
    const totalExpensas = parseFloat(expensas.expensasComunes) + parseFloat(expensas.expensasExtraordinarias);
    const fechaActual = new Date().toISOString().split('T')[0];
  
    const sql = `
      INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  
    db.run(sql, [
      "egreso",
      fechaActual,
      totalExpensas,
      "transferencia",
      "Pago de expensas",
      `Egreso por pago de expensas a consorcio del contrato ${expensas.nombrePropietario} del periodo ${expensas.periodo}`
    ], callback);
  }
  
  // Ruta para actualizar expensas por ID
  router.put('/actualizar-expensas/:id', (req, res) => {
    const { id } = req.params;
    const { calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado } = req.body;
  
    const sql = `
      UPDATE expensas 
      SET calle = ?, numero = ?, nombre_propietario = ?, expensas_comunes = ?, expensas_extraordinarias = ?, periodo = ?, estado = ?
      WHERE id = ?
    `;
  
    db.run(sql, [calle, numero, nombrePropietario, expensasComunes, expensasExtraordinarias, periodo, estado, id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
  
      // Si el estado es "Pagado al consorcio", registrar el egreso
      if (estado === 'Pagado al consorcio') {
        registrarEgresoExpensas(req.body, (egresoErr) => {
          if (egresoErr) {
            return res.status(500).json({ error: "Expensas actualizadas, pero hubo un error al registrar el egreso: " + egresoErr.message });
          }
          res.json({ success: true, message: "Expensas actualizadas y egreso registrado correctamente" });
        });
      } else {
        res.json({ success: true, message: "Expensas actualizadas correctamente" });
      }
    });
  });

// Ruta para obtener una expensa por ID
router.get('/obtener-expensas/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM expensas WHERE id = ?`;
    db.get(sql, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});



module.exports = router;

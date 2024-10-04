const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = require('../db/database'); // Asegúrate de que la ruta sea correcta

// Buscar inquilino
router.get('/buscar-inquilino', (req, res) => {
    const search = req.query.search;
    const query = `
        SELECT propietario, calle, nro
        FROM contratos
        WHERE propietario LIKE ?
    `;
    db.get(query, [`%${search}%`], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            if (row) {
                res.json({
                    calle: row.calle,
                    nro: row.nro,
                    nombre: row.propietario
                });
            } else {
                res.status(404).json({ message: 'No se encontró ningún inquilino.' });
            }
        }
    });
});

// Ruta para guardar un pago ABL
router.post('/guardar-pago-abl', (req, res) => {
  const { calle, numero, nombre, monto_abl, periodo, metodo_pago } = req.body;

  // Insertar el pago ABL en la tabla `pagos_abl`
  const queryPagoABL = `
      INSERT INTO pagos_abl (calle, numero, nombre, monto_abl, periodo, metodo_pago)
      VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.run(queryPagoABL, [calle, numero, nombre, monto_abl, periodo, metodo_pago], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          const idPagoABL = this.lastID;

          // Insertar el registro en la tabla `caja_diaria`
          const queryCajaDiaria = `
              INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion)
              VALUES (?, ?, ?, ?, ?, ?)
          `;
          const fecha = new Date().toISOString(); // Fecha actual
          const motivo = 'Pago de ABL';
          const descripcion = `Egreso por pago de expensas del contrato (${nombre} - ${periodo})`;

          db.run(queryCajaDiaria, ['Egreso', fecha, monto_abl, metodo_pago, motivo, descripcion], function(err) {
              if (err) {
                  res.status(500).json({ error: err.message });
              } else {
                  res.json({ success: true, idPagoABL: idPagoABL });
              }
          });
      }
  });
});


// Obtener todos los pagos ABL
router.get('/obtener-pagos-abl', (req, res) => {
    const query = 'SELECT * FROM pagos_abl';
    db.all(query, [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    });
});

// Eliminar un pago ABL
router.delete('/eliminar-pago-abl/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM pagos_abl WHERE id = ?';
    db.run(query, [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    });
});

// Editar un pago ABL
router.put('/editar-pago-abl/:id', (req, res) => {
    const { id } = req.params;
    const { calle, numero, nombre, monto_abl, periodo, metodo_pago } = req.body;
    const query = `
      UPDATE pagos_abl
      SET calle = ?, numero = ?, nombre = ?, monto_abl = ?, periodo = ?, metodo_pago = ?
      WHERE id = ?
    `;
    db.run(query, [calle, numero, nombre, monto_abl, periodo, metodo_pago, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    });
});

module.exports = router;

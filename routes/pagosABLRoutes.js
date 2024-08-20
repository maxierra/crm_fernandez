const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = require('../db/database'); // Asegúrate de que la ruta sea correcta

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
    const { calle, numero, nombre, monto_abl, periodo } = req.body;
    const query = `
        INSERT INTO pagos_abl (calle, numero, nombre, monto_abl, periodo)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [calle, numero, nombre, monto_abl, periodo], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, id: this.lastID });
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
    const { calle, numero, nombre, monto_abl, periodo } = req.body;
    const query = `
      UPDATE pagos_abl
      SET calle = ?, numero = ?, nombre = ?, monto_abl = ?, periodo = ?
      WHERE id = ?
    `;
    db.run(query, [calle, numero, nombre, monto_abl, periodo, id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    });
  });

module.exports = router;

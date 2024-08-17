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
        res.json({ success: true });
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

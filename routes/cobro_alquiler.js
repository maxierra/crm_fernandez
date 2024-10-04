const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Ruta para agregar un nuevo cobro de alquiler
router.post('/add', (req, res) => {
    const { inquilino, propietario, calle, nro, dto, importe_periodo, expensas_comunes, expensas_extraordinarias, user_id, payment_method } = req.body;

    const periodo = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const estado1 = 'Cobrado';
    const estado2 = 'Pendiente de Rendición';

    const sql = `
        INSERT INTO cobro_alquileres (inquilino, propietario, calle, nro, dto, periodo, importe_periodo, expensas_comunes, expensas_extraordinarias, estado1, estado2, user_id, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [inquilino, propietario, calle, nro, dto, periodo, importe_periodo, expensas_comunes, expensas_extraordinarias, estado1, estado2, user_id, payment_method], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error al agregar el cobro de alquiler.' });
        }
        res.status(200).json({ message: 'Cobro de alquiler agregado exitosamente.', id: this.lastID });
    });
});

// Ruta para obtener todos los cobros de alquileres
router.get('/', (req, res) => {
    const sql = `SELECT * FROM cobro_alquileres ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener los cobros de alquileres.' });
        }
        res.status(200).json(rows);
    });
});

// Ruta para buscar un cobro de alquiler por nombre de inquilino
router.get('/search', (req, res) => {
    const { nombre } = req.query;
    const sql = `SELECT * FROM cobro_alquileres WHERE inquilino LIKE ? ORDER BY created_at DESC`;

    db.all(sql, [`%${nombre}%`], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al buscar los cobros de alquileres.' });
        }
        res.status(200).json(rows);
    });
});

module.exports = router;

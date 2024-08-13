const express = require('express');
const router = express.Router();
const db = require('../db/database');




// Ruta para cargar índices
router.post('/cargar-indices', (req, res) => {
  const { iclData } = req.body;

  if (!iclData) {
    return res.status(400).json({ message: 'No se proporcionaron datos.' });
  }

  const lines = iclData.split('\n').map(line => line.trim()).filter(line => line);

  const promises = lines.map(line => {
    const [fecha, valor] = line.split('\t');

    return new Promise((resolve, reject) => {
      // Verificar si el índice ya existe
      const checkSql = 'SELECT COUNT(*) AS count FROM indice_ipc WHERE fecha = ?';
      db.get(checkSql, [fecha], (err, row) => {
        if (err) {
          reject(`Error al verificar el índice: ${err.message}`);
        } else if (row.count > 0) {
          resolve(`El índice para la fecha ${fecha} ya existe.`);
        } else {
          const insertSql = 'INSERT INTO indice_ipc (fecha, valor_ICL) VALUES (?, ?)';
          db.run(insertSql, [fecha, parseFloat(valor.replace(',', '.'))], (err) => {
            if (err) {
              reject(`Error al insertar el índice: ${err.message}`);
            } else {
              resolve('Índice insertado correctamente.');
            }
          });
        }
      });
    });
  });

  Promise.allSettled(promises).then(results => {
    const messages = results.map(result => result.value).filter(message => message);
    const hasErrors = results.some(result => result.status === 'rejected');

    if (hasErrors) {
      res.status(400).json({ message: messages.join('\n') });
    } else {
      res.json({ message: messages.join('\n') });
    }
  }).catch(err => {
    res.status(500).json({ message: `Error en el servidor: ${err.message}` });
  });
});

// Ruta para obtener los índices
router.get('/indices', (req, res) => {
  const sql = 'SELECT * FROM indice_ipc ORDER BY fecha';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener los índices:', err.message);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    res.json(rows);
  });
});

module.exports = router;

// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db/database'); // Ajusta la ruta según sea necesario

// Ruta para manejar el inicio de sesión
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Consulta a la base de datos
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Error en el servidor' });
    } else if (row) {
      req.session.user = row; // Guarda el usuario en la sesión
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuario o contraseña inválidos' });
    }
  });
});

module.exports = router;

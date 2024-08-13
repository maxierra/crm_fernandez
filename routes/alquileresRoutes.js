const express = require('express');
const router = express.Router();

router.get('/calculos-alquileres', (req, res) => {
  res.render('calculos_alquileres');
});

module.exports = router;
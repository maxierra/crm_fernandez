// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'real_estate.db');

// Crear o abrir la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear la tabla si no existe
const createTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS indice_ipc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      valor_ICL REAL NOT NULL
    )
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla:', err.message);
    } else {
      console.log('Tabla creada o ya existe.');
    }
  });
};

createTable();

module.exports = db;

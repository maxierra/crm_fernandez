const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear o abrir la base de datos
const db = new sqlite3.Database(path.join(__dirname, '../real_estate.db'), (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    createTables(); // Crear las tablas necesarias
  }
});

// Función para crear las tablas si no existen
const createTables = () => {
  createIndiceIpcTable();
  createUsersTable();
  createContratosTable(); // Crear la tabla contratos con las nuevas columnas
};

// Crear la tabla indice_ipc si no existe
const createIndiceIpcTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS indice_ipc (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      valor_ICL REAL NOT NULL
    )
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla indice_ipc:', err.message);
    } else {
      console.log('Tabla indice_ipc creada o ya existe.');
    }
  });
};

// Crear la tabla de usuarios si no existe
const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla users:', err.message);
    } else {
      console.log('Tabla users creada o ya existe.');
    }
  });
};

// Crear la tabla contratos si no existe con las nuevas columnas
const createContratosTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calle TEXT NOT NULL,
      nro TEXT NOT NULL,
      dto TEXT,
      propietario TEXT NOT NULL,
      inquilino TEXT,
      importe REAL NOT NULL,
      observaciones TEXT,
      inicio_contrato DATE,
      duracion_contrato INTEGER,
      tipo_incremento TEXT,
      finalizacion_contrato DATE,
      metodo_pago TEXT,
      monto_deposito REAL
    )
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla contratos:', err.message);
    } else {
      console.log('Tabla contratos creada o ya existe.');
    }
  });
};

module.exports = db;

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
  createPagoPropietariosTable(); // Crear la tabla pago_propietarios antes de agregar la columna cbu a la tabla contratos
  createExpensasTable();
  createPagosABLTable();
 createCobroAlquileresTable();
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

// Crear la tabla contratos si no existe
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
      addCbuColumn(); // Agregar la columna cbu a la tabla contratos
    }
  });
};

// Agregar la columna cbu a la tabla contratos
const addCbuColumn = () => {
  const sql = `
    ALTER TABLE contratos
    ADD COLUMN cbu TEXT
  `;
  db.run(sql, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("La columna cbu ya existe.");
      } else {
        console.error("Error al agregar la columna cbu:", err.message);
      }
    } else {
      console.log("Columna cbu agregada a la tabla contratos.");
    }
  });
};

const createPagoPropietariosTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS pago_propietarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      propietario TEXT NOT NULL,
      importe_periodo DECIMAL(10, 2) NOT NULL,
      monto_abl DECIMAL(10, 2) NOT NULL,
      administracion DECIMAL(10, 2) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      metodo_pago TEXT NOT NULL,
      cbu TEXT,
      fecha_pago DATE NOT NULL
    )
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla pago_propietarios:', err.message);
    } else {
      console.log('Tabla pago_propietarios creada o ya existe.');
    }
  });
};

// Crear la tabla de expensas si no existe
const createExpensasTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS expensas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calle TEXT NOT NULL,
      numero TEXT NOT NULL,
      nombre_propietario TEXT NOT NULL,
      expensas_comunes REAL NOT NULL,
      expensas_extraordinarias REAL NOT NULL,
      periodo TEXT NOT NULL
    )
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla expensas:', err.message);
    } else {
      console.log('Tabla expensas creada o ya existe.');
    }
  });
};

// Crear la tabla de pagos ABL si no existe
const createPagosABLTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS pagos_abl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calle TEXT NOT NULL,
      numero TEXT NOT NULL,
      nombre TEXT NOT NULL,
      monto_abl REAL NOT NULL,
      periodo TEXT NOT NULL
    )
  `;
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla pagos_abl:', err.message);
    } else {
      console.log('Tabla pagos_abl creada o ya existe.');
    }
  });
};


// Crear la tabla de cobro_alquileres si no existe
const createCobroAlquileresTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS cobro_alquileres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquilino TEXT NOT NULL,
      propietario TEXT NOT NULL,
      calle TEXT NOT NULL,
      nro TEXT NOT NULL,
      dto TEXT NOT NULL,
      periodo TEXT NOT NULL,
      importe_periodo DECIMAL(10, 2) NOT NULL,
      expensas_comunes DECIMAL(10, 2) NOT NULL,
      expensas_extraordinarias DECIMAL(10, 2) NOT NULL,
      estado1 TEXT,
      estado2 TEXT,
      user_id INTEGER,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla cobro_alquileres:', err.message);
    } else {
      console.log('Tabla cobro_alquileres creada o ya existe.');
    }
  });
};

module.exports = db;
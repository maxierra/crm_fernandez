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
      alterContratosTable(); // Ejecuta alteraciones solo si la tabla ya existe
    }
  });
};

// Agregar nuevas columnas si no existen
const alterContratosTable = () => {
  db.run(`ALTER TABLE contratos ADD COLUMN cbu TEXT`, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log('La columna cbu ya existe.');
      } else {
        console.error('Error al agregar la columna cbu:', err.message);
      }
    } else {
      console.log('Columna cbu agregada a la tabla contratos.');
    }
  });

  db.run(`ALTER TABLE contratos ADD COLUMN comision REAL`, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log('La columna comision ya existe.');
      } else {
        console.error('Error al agregar la columna comision:', err.message);
      }
    } else {
      console.log('Columna comision agregada a la tabla contratos.');
    }
  });
};

// Ejecutar la creación de la tabla contratos
createContratosTable();

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

// Llama a la función para crear la tabla de expensas
createExpensasTable();

// Añadir la columna 'estado' a la tabla 'expensas' si no existe
const addEstadoColumn = () => {
  const sql = `
    ALTER TABLE expensas
    ADD COLUMN estado TEXT NOT NULL DEFAULT 'Pendiente'
  `;
  db.run(sql, (err) => {
    if (err) {
      if (err.message.includes("duplicate column name")) {
        console.log("La columna 'estado' ya existe.");
      } else {
        console.error("Error al añadir la columna 'estado':", err.message);
      }
    } else {
      console.log("Columna 'estado' añadida a la tabla 'expensas'.");
    }
  });
};

// Ejecutar la función para añadir la columna 'estado' si es necesario
addEstadoColumn();


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

// Llamar a la función para crear la tabla
createPagosABLTable();

// Crear la tabla de alquileres_calculos si no existe
const createAlquileresCalculosTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS alquileres_calculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_contrato INTEGER,
      tipo_incremento TEXT,
      periodo TEXT,
      periodo_inicio DATE,
      periodo_fin DATE,
      importe_periodo DECIMAL(10, 2),
      icl_inicio DECIMAL(10, 2),
      icl_fin DECIMAL(10, 2),
      nombre_inquilino TEXT,
      calle TEXT,
      numero_dto TEXT,
      FOREIGN KEY (id_contrato) REFERENCES contratos(id)
    )
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('Error al crear la tabla alquileres_calculos:', err.message);
    } else {
      console.log('Tabla alquileres_calculos creada o ya existe.');
    }
  });
};

// Llama a la función para crear la tabla
createAlquileresCalculosTable();

// Crear la tabla cobro_alquileres si no existe
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

// Llama a la función para crear la tabla
createCobroAlquileresTable();



module.exports = db;

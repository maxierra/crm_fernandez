const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express(); // Inicializar la variable app aquí

// Configuración del motor de vistas y la carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el body como URL-encoded y JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de middleware para sesiones
app.use(session({
  secret: 'tu_secreto', // Cambia esto por una cadena secreta única
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a true si usas HTTPS
}));

// Crear o abrir la base de datos
const db = new sqlite3.Database('./real_estate.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    createTable();
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

// Middleware para redirigir a la página de login si no está autenticado
app.use((req, res, next) => {
  if (req.session.authenticated || req.originalUrl === '/login') {
    next();
  } else {
    res.redirect('/login');
  }
});

// Ruta para mostrar la página principal
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.render('main');
  } else {
    res.redirect('/login');
  }
});

// Ruta para mostrar la página de login
app.get('/login', (req, res) => {
  res.render('login');
});

// Ruta para mostrar la página de índice IPC
app.get('/indice-icl', (req, res) => {
  res.render('indice_icl');
});

// Ruta para manejar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validación de usuario y contraseña simulados
  if (username === 'admin' && password === 'admin2024') {
    req.session.authenticated = true; // Establece la sesión del usuario
    res.redirect('/');
  } else {
    res.render('login', { error: 'Usuario o contraseña incorrectos' });
  }
});

// Ruta para cargar índices
app.post('/cargar-indices', (req, res) => {
  const { iclData } = req.body;

  if (!iclData) {
    return res.status(400).json({ message: 'No se proporcionaron datos.' });
  }

  const lines = iclData.split('\n').map(line => line.trim()).filter(line => line);

  let insertCount = 0;
  let errorCount = 0;

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
app.get('/indices', (req, res) => {
  const sql = 'SELECT * FROM indice_ipc ORDER BY fecha';

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error al obtener los índices:', err.message);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    res.json(rows);
  });
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.redirect('/login');
  });
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});

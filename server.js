const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./db/database'); // Importar la base de datos
const contratosRoutes = require('./routes/contratos');
const expensasRoutes = require('./routes/expensas'); // Importa las rutas de expensas
const pagosABLRoutes = require('./routes/pagosABLRoutes');
const indicesRoutes = require('./routes/indices');
const userRoutes = require('./routes/users');




const alquileresRoutes = require('./routes/alquileresRoutes');
const router = express.Router();


const app = express();

// Configuración del motor de vistas y la carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsear el body como URL-encoded y JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Usa las rutas de expensas
app.use(expensasRoutes);

app.use('/', alquileresRoutes);
app.use('/contratos', contratosRoutes);

// Configuración de la sesión
app.use(session({
  secret: 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: true
}));

// Importar rutas

app.use('/api/pagos-abl', pagosABLRoutes);

// Usar las rutas
app.use('/', indicesRoutes);
app.use('/users', userRoutes);

// Ruta para redirigir a la página de inicio de sesión
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Ruta para mostrar la página de login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Ruta para manejar la solicitud POST del formulario de inicio de sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Consultar la base de datos para verificar si el usuario y la contraseña son válidos
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      // Si la autenticación falla, mostrar un mensaje de error en la página de inicio de sesión
      return res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }

    // Si la autenticación es exitosa, crear una sesión para el usuario y redirigirlo a la página deseada
    req.session.user = row;
    res.redirect('/main');
  });
});

// Ruta para mostrar la página principal (main)
app.get('/main', (req, res) => {
  res.render('main');
});

// Ruta para mostrar la página de índice IPC
app.get('/indice-icl', (req, res) => {
  res.render('indice_icl');
});

// Ruta para mostrar la página de contratos
app.get('/contratos', (req, res) => {
  res.render('contratos'); // Renderiza la vista contratos.ejs
});

// Definir la ruta directamente en server.js
app.get('/calculos-alquileres', (req, res) => {
  res.render('calculos_alquileres');
});

// Ruta para mostrar la página de creación de usuarios
app.get('/crear-usuario', (req, res) => {
  res.render('crear_users');
});

app.get('/cargar-expensas', (req, res) => {
  res.render('expensas');
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

app.get('/cargar-pago-abl', (req, res) => {
  res.render('abl'); // Renderiza el archivo 'abl.ejs' en la carpeta 'views'
});

app.get('/cobro-alquileres', (req, res) => {
  res.render('cobro-alquileres');
});


app.get('/reclamos', (req, res) => {
  res.render('reclamos'); // Renderiza el archivo 'reclamos.ejs'
});

app.get('/caja', (req, res) => {
    res.render('caja'); // Renderiza el archivo 'caja.ejs'
});


app.get('/pagopropietarios', (req, res) => {
  res.render('pagopropietarios');
});


app.get('/resumen', (req, res) => {
  const sqlContratos = `
  SELECT id, inicio_contrato, finalizacion_contrato, tipo_incremento, importe
  FROM contratos
  `;
  
  const sqlIndiceIPC = `
  SELECT fecha, valor_ICL
  FROM indice_ipc
  `;
  
  db.all(sqlContratos, [], (err, contratos) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los contratos' });
    }
  
    db.all(sqlIndiceIPC, [], (err, indices) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los valores IPC' });
      }
  
      const convertirFecha = (fecha) => {
        if (!fecha || typeof fecha !== 'string') {
          console.error('Fecha no válida:', fecha);
          return null;
        }
        const [ano, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${ano}`;
      };
  
      const obtenerValorIPC = (fecha) => {
        const fechaFormateada = convertirFecha(fecha);
        if (!fechaFormateada) {
          console.error('Error al formatear la fecha:', fecha);
          return 0;
        }
        const indice = indices.find(indice => indice.fecha === fechaFormateada);
        return indice ? indice.valor_ICL : 0;
      };
  
      const generarFechasPeriodos = (inicio, fin, tipoIncremento) => {
        const fechas = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        let periodoCount = 1;
  
        while (fechaInicio <= fechaFin) {
          let fechaFinPeriodo = new Date(fechaInicio);
          fechaFinPeriodo.setMonth(fechaFinPeriodo.getMonth() + tipoIncremento);
          fechaFinPeriodo.setDate(fechaFinPeriodo.getDate() - 1);
  
          if (fechaFinPeriodo > fechaFin) {
            fechaFinPeriodo = fechaFin;
          }
  
          fechas.push({
            periodo: tipoIncremento === 3 ? `Trimestre ${periodoCount}` : `Cuatrimestre ${periodoCount}`,
            inicio: fechaInicio.toISOString().split('T')[0],
            fin: fechaFinPeriodo.toISOString().split('T')[0]
          });
  
          fechaInicio.setMonth(fechaInicio.getMonth() + tipoIncremento);
          periodoCount++;
        }
  
        return fechas;
      };

      const generarFechasAnuales = (inicio, fin) => {
        const fechas = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        let añoCount = 1;

        while (fechaInicio <= fechaFin) {
          let fechaFinAño = new Date(fechaInicio);
          fechaFinAño.setFullYear(fechaFinAño.getFullYear() + 1);
          fechaFinAño.setMonth(11); // Diciembre
          fechaFinAño.setDate(31);

          if (fechaFinAño > fechaFin) {
            fechaFinAño = fechaFin;
          }

          fechas.push({
            año: `Año ${añoCount}`,
            inicio: fechaInicio.toISOString().split('T')[0],
            fin: fechaFinAño.toISOString().split('T')[0]
          });

          fechaInicio.setFullYear(fechaInicio.getFullYear() + 1);
          añoCount++;
        }

        return fechas;
      };

      const calcularAjusteICL = (importeAnterior, valorICLAnterior, valorICLActual) => {
        if (valorICLAnterior === 0) {
          return importeAnterior;
        }
        const ajuste = (valorICLActual / valorICLAnterior) * importeAnterior;
        return ajuste;
      };
  
      const resultados = contratos.map(contrato => {
        if (contrato.tipo_incremento === 'anual') {
          const fechasAnuales = generarFechasAnuales(contrato.inicio_contrato, contrato.finalizacion_contrato);
          let importeAnterior = contrato.importe;
          let valorICLAnterior = obtenerValorIPC(contrato.inicio_contrato);
  
          return fechasAnuales.map((año, index) => {
            const valorInicio = obtenerValorIPC(año.inicio);
            const valorFin = obtenerValorIPC(año.fin);
  
            let importeAño;
            if (index === 0) {
              importeAño = contrato.importe; // Primer año sin ajuste
            } else {
              importeAño = calcularAjusteICL(importeAnterior, valorICLAnterior, valorInicio); // Ajuste para años siguientes
            }
  
            valorICLAnterior = valorInicio;
            importeAnterior = importeAño;
  
            return {
              id: contrato.id,
              tipo_incremento: contrato.tipo_incremento,
              periodo: año.año,
              periodo_inicio: año.inicio,
              periodo_fin: año.fin,
              importe_periodo: importeAño.toFixed(2),
              icl_inicio: valorInicio,
              icl_fin: valorFin,
            };
          });
        } else {
          const tipoIncremento = contrato.tipo_incremento === 'trimestral' ? 3 : 4;
          const fechasPeriodos = generarFechasPeriodos(contrato.inicio_contrato, contrato.finalizacion_contrato, tipoIncremento);
          let importeAnterior = contrato.importe;
          let valorICLAnterior = obtenerValorIPC(contrato.inicio_contrato);
  
          return fechasPeriodos.map((periodo, index) => {
            const valorInicio = obtenerValorIPC(periodo.inicio);
            const valorFin = obtenerValorIPC(periodo.fin);
  
            let importePeriodo;
            if (index === 0) {
              importePeriodo = contrato.importe;
            } else {
              importePeriodo = calcularAjusteICL(importeAnterior, valorICLAnterior, valorInicio);
            }
  
            valorICLAnterior = valorInicio;
            importeAnterior = importePeriodo;
  
            return {
              id: contrato.id,
              tipo_incremento: contrato.tipo_incremento,
              periodo: periodo.periodo,
              periodo_inicio: periodo.inicio,
              periodo_fin: periodo.fin,
              importe_periodo: importePeriodo.toFixed(2),
              icl_inicio: valorInicio,
              icl_fin: valorFin,
            };
          });
        }
      }).flat();
  
      console.log('Resultados:', resultados);
  
      res.json(resultados);
    });
  });
});

app.get('/api/cobro-alquileres', (req, res) => {
  const nombreInquilino = req.query.nombre || ''; // Obtener el nombre del inquilino desde la query string
  const sqlContratos = `
    SELECT id, inicio_contrato, finalizacion_contrato, tipo_incremento, importe, inquilino, propietario, calle, nro, dto
    FROM contratos
    WHERE inquilino LIKE ?
  `;
  
  const sqlIndiceIPC = `
    SELECT fecha, valor_ICL
    FROM indice_ipc
  `;
  
  db.all(sqlContratos, [`%${nombreInquilino}%`], (err, contratos) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener los contratos' });
    }
  
    db.all(sqlIndiceIPC, [], (err, indices) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener los valores IPC' });
      }

      const obtenerExpensas = (propietario) => {
        return new Promise((resolve, reject) => {
          const sqlExpensas = `
            SELECT expensas_comunes, expensas_extraordinarias, estado
            FROM expensas
            WHERE nombre_propietario = ? AND estado = 'Pendiente'
          `;
          
          db.get(sqlExpensas, [propietario], (err, expensas) => {
            if (err) {
              return reject('Error al obtener las expensas');
            }
      
            console.log('Expensas obtenidas (pendientes):', expensas);
      
            resolve(expensas || { expensas_comunes: 0, expensas_extraordinarias: 0, estado: 'Pendiente' });
          });
        });
      };
      
      const convertirFecha = (fecha) => {
        if (!fecha || typeof fecha !== 'string') {
          console.error('Fecha no válida:', fecha);
          return null;
        }
        const [ano, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${ano}`;
      };
  
      const obtenerValorIPC = (fecha) => {
        const fechaFormateada = convertirFecha(fecha);
        if (!fechaFormateada) {
          console.error('Error al formatear la fecha:', fecha);
          return 0;
        }
        const indice = indices.find(indice => indice.fecha === fechaFormateada);
        return indice ? indice.valor_ICL : 0;
      };
  
      const generarFechasPeriodos = (inicio, fin, tipoIncremento) => {
        const fechas = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        let periodoCount = 1;
  
        while (fechaInicio <= fechaFin) {
          let fechaFinPeriodo = new Date(fechaInicio);
          fechaFinPeriodo.setMonth(fechaFinPeriodo.getMonth() + tipoIncremento);
          fechaFinPeriodo.setDate(fechaFinPeriodo.getDate() - 1);
  
          if (fechaFinPeriodo > fechaFin) {
            fechaFinPeriodo = fechaFin;
          }
  
          fechas.push({
            periodo: tipoIncremento === 3 ? `Trimestre ${periodoCount}` : `Cuatrimestre ${periodoCount}`,
            inicio: fechaInicio.toISOString().split('T')[0],
            fin: fechaFinPeriodo.toISOString().split('T')[0]
          });
  
          fechaInicio.setMonth(fechaInicio.getMonth() + tipoIncremento);
          periodoCount++;
        }
  
        return fechas;
      };

      const generarFechasAnuales = (inicio, fin) => {
        const fechas = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        let añoCount = 1;
      
        while (fechaInicio <= fechaFin) {
          let fechaFinAño = new Date(fechaInicio);
          fechaFinAño.setFullYear(fechaInicio.getFullYear() + 1);
          fechaFinAño.setDate(fechaInicio.getDate() - 1); // Ajusta el día final al día anterior del mismo mes del siguiente año
      
          if (fechaFinAño > fechaFin) {
            fechaFinAño = fechaFin;
          }
      
          fechas.push({
            año: `Año ${añoCount}`,
            inicio: fechaInicio.toISOString().split('T')[0],
            fin: fechaFinAño.toISOString().split('T')[0]
          });
      
          fechaInicio.setFullYear(fechaInicio.getFullYear() + 1);
          añoCount++;
        }
      
        return fechas;
      };

      const calcularAjusteICL = (importeAnterior, valorICLAnterior, valorICLActual) => {
        if (valorICLAnterior === 0) {
          return importeAnterior;
        }
        const ajuste = (valorICLActual / valorICLAnterior) * importeAnterior;
        return ajuste;
      };
  
      const obtenerPeriodoActual = (fechas) => {
        const hoy = new Date();
        return fechas.find(fecha => {
          const inicio = new Date(fecha.inicio);
          const fin = new Date(fecha.fin);
          return hoy >= inicio && hoy <= fin;
        });
      };

      const resultadosPromises = contratos.map(async contrato => {
        const tipoIncremento = contrato.tipo_incremento === 'trimestral' ? 3 : 4;
        let fechas;
  
        if (contrato.tipo_incremento === 'anual') {
          fechas = generarFechasAnuales(contrato.inicio_contrato, contrato.finalizacion_contrato);
        } else {
          fechas = generarFechasPeriodos(contrato.inicio_contrato, contrato.finalizacion_contrato, tipoIncremento);
        }

        const periodoActual = obtenerPeriodoActual(fechas);
  
        if (periodoActual) {
          let importeAnterior = contrato.importe;
          let valorICLAnterior = obtenerValorIPC(contrato.inicio_contrato);
          const valorInicio = obtenerValorIPC(periodoActual.inicio);
          const valorFin = obtenerValorIPC(periodoActual.fin);
  
          let importePeriodo = calcularAjusteICL(importeAnterior, valorICLAnterior, valorInicio);

          // Obtener expensas del propietario
          const expensas = await obtenerExpensas(contrato.propietario);

          // Calcular el total a cobrar
          const totalACobrar = importePeriodo + expensas.expensas_comunes + expensas.expensas_extraordinarias;
  
          return {
            inquilino: contrato.inquilino,
            propietario: contrato.propietario,
            calle: contrato.calle,
            nro: contrato.nro,
            dto: contrato.dto,
            periodo_fin: periodoActual.fin,
            importe_periodo: importePeriodo.toFixed(2),
            icl_inicio: valorInicio,
            icl_fin: valorFin,
            expensas_comunes: expensas.expensas_comunes,
            expensas_extraordinarias: expensas.expensas_extraordinarias,
            estado_expensas: expensas.estado,
            total_a_cobrar: totalACobrar.toFixed(2)
          };
        }
  
        return null;
      });

      Promise.all(resultadosPromises)
        .then(resultados => {
          res.json(resultados.filter(result => result !== null));
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Error al procesar los datos' });
        });
    });
  });
});


  app.get('/', (req, res) => {
    db.all('SELECT * FROM contratos', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('contratos', { contratos: rows });
    });
  });
  
  
  app.post('/add', (req, res) => {
    const { 
        calle, nro, dto, propietario, inquilino, importe, observaciones, 
        inicio_contrato, duracion_contrato, tipo_incremento, 
        finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision 
    } = req.body;
  
    const sql = `INSERT INTO contratos (
                    calle, nro, dto, propietario, inquilino, importe, observaciones, 
                    inicio_contrato, duracion_contrato, tipo_incremento, 
                    finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    db.run(sql, [
        calle, nro, dto, propietario, inquilino, importe, observaciones, 
        inicio_contrato, duracion_contrato, tipo_incremento, 
        finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision
    ], function(err) {
        if (err) {
            console.error('Error al insertar el contrato:', err.message);
            return res.json({ success: false, error: 'Error al insertar el contrato' });
        }
  
        const newContrato = {
            id: this.lastID,
            calle, nro, dto, propietario, inquilino, importe, observaciones, 
            inicio_contrato, duracion_contrato, tipo_incremento, 
            finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision
        };
  
        res.json({ success: true, contrato: newContrato });
    });
  });
  
  app.post('/update/:id', (req, res) => {
    const { calle, nro, dto, propietario, inquilino, importe, observaciones, inicio_contrato, duracion_contrato, tipo_incremento, finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision } = req.body;
    const { id } = req.params;
    const sql = `UPDATE contratos SET calle = ?, nro = ?, dto = ?, propietario = ?, inquilino = ?, importe = ?, observaciones = ?, inicio_contrato = ?, duracion_contrato = ?, tipo_incremento = ?, finalizacion_contrato = ?, metodo_pago = ?, monto_deposito = ?, cbu = ?, comision = ? WHERE id = ?`;
    db.run(sql, [calle, nro, dto, propietario, inquilino, importe, observaciones, inicio_contrato, duracion_contrato, tipo_incremento, finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision, id], function(err) {
      if (err) {
        return res.json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  });
  
  
  app.post('/delete/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM contratos WHERE id = ?`;
    db.run(sql, [id], function(err) {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
  });
  
  app.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM contratos WHERE id = ?`;
    db.get(sql, [id], (err, contrato) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        res.json(contrato);
    });
  });


  app.post('/api/cobro-alquileres', (req, res) => {
    const {
        inquilino,
        propietario,
        calle,
        nro,
        dto,
        periodo,
        importe_periodo,
        expensas_comunes,
        expensas_extraordinarias,
        estado1,
        estado2,
        user_id,
        payment_method
    } = req.body;

    const created_at = new Date(); // Fecha y hora actual

    const sql = `
        INSERT INTO cobro_alquileres (inquilino, propietario, calle, nro, dto, periodo, importe_periodo, expensas_comunes, expensas_extraordinarias, estado1, estado2, user_id, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [inquilino, propietario, calle, nro, dto, periodo, importe_periodo, expensas_comunes, expensas_extraordinarias, estado1, estado2, user_id, payment_method, created_at], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Cobro registrado exitosamente', id: this.lastID });
    });
});


app.post('/buscar-propietario', (req, res) => {
  let { propietario } = req.body;

  if (!propietario) {
      return res.status(400).json({ error: "Propietario es requerido" });
  }

  propietario = propietario.toLowerCase();

  const sqlAlquileres = `SELECT importe_periodo FROM cobro_alquileres WHERE LOWER(propietario) = ?`;
  const sqlABL = `SELECT monto_abl FROM pagos_abl WHERE LOWER(nombre) = ? ORDER BY periodo DESC LIMIT 1`;
  const sqlComision = `SELECT comision FROM contratos WHERE LOWER(propietario) = ?`;
  const sqlCBU = `SELECT cbu, observaciones FROM contratos WHERE LOWER(propietario) = ?`;

  db.all(sqlAlquileres, [propietario], (err, rowsAlquileres) => {
      if (err) {
          console.error("Error en la consulta SQL (Alquileres):", err.message);
          return res.status(500).json({ error: "Error en la consulta de base de datos (Alquileres)" });
      }

      db.all(sqlABL, [propietario], (err, rowsABL) => {
          if (err) {
              console.error("Error en la consulta SQL (ABL):", err.message);
              return res.status(500).json({ error: "Error en la consulta de base de datos (ABL)" });
          }

          db.get(sqlComision, [propietario], (err, rowComision) => {
              if (err) {
                  console.error("Error en la consulta SQL (Comisión):", err.message);
                  return res.status(500).json({ error: "Error en la consulta de base de datos (Comisión)" });
              }

              db.get(sqlCBU, [propietario], (err, rowCBU) => {
                  if (err) {
                      console.error("Error en la consulta SQL (CBU):", err.message);
                      return res.status(500).json({ error: "Error en la consulta de base de datos (CBU)" });
                  }

                  let importePeriodo = rowsAlquileres.length > 0 ? rowsAlquileres[0].importe_periodo : 0;
                  let montoABL = rowsABL.length > 0 ? rowsABL[0].monto_abl : 0;
                  let comision = rowComision ? rowComision.comision : 0;
                  let cbu = rowCBU ? rowCBU.cbu : 'No disponible';
                  let observaciones = rowCBU ? rowCBU.observaciones : ''; // Obtener observaciones

                  let administracion = (comision / 100) * importePeriodo;
                  let total = importePeriodo - montoABL - administracion;

                  res.json({
                      importePeriodo,
                      montoABL,
                      administracion,
                      total,
                      cbu,
                      observaciones // Enviar observaciones al frontend
                  });
              });
          });
      });
  });
});


app.post('/procesar-pago', (req, res) => {
  const { propietario, importe_periodo, monto_abl, administracion, total, metodo_pago, cbu, fecha_pago } = req.body;

  db.run('INSERT INTO pago_propietarios (propietario, importe_periodo, monto_abl, administracion, total, metodo_pago, cbu, fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [propietario, importe_periodo, monto_abl, administracion, total, metodo_pago, cbu, fecha_pago], 
      (error) => {
          if (error) {
              res.status(500).json({ mensaje: 'Error al insertar datos' });
          } else {
              res.json({ mensaje: 'Datos insertados con éxito' });
          }
      });
});









// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
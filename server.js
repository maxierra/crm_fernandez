const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const db = require("./db/database"); // Importar la base de datos
const contratosRoutes = require("./routes/contratos");
const expensasRoutes = require("./routes/expensas"); // Importa las rutas de expensas
const pagosABLRoutes = require("./routes/pagosABLRoutes");
const indicesRoutes = require("./routes/indices");
const userRoutes = require("./routes/users");

const alquileresRoutes = require("./routes/alquileresRoutes");
const router = express.Router();

const app = express();

// Configuración del motor de vistas y la carpeta de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Middleware para parsear el body como URL-encoded y JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Usa las rutas de expensas
app.use(expensasRoutes);

app.use("/", alquileresRoutes);
app.use("/contratos", contratosRoutes);

// Configuración de la sesión
app.use(
  session({
    secret: "tu_secreto_aqui",
    resave: false,
    saveUninitialized: true,
  })
);

// Importar rutas

app.use("/api/pagos-abl", pagosABLRoutes);

// Usar las rutas
app.use("/", indicesRoutes);
app.use("/users", userRoutes);

// Ruta para redirigir a la página de inicio de sesión
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Ruta para mostrar la página de login
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Ruta para manejar la solicitud POST del formulario de inicio de sesión
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Consultar la base de datos para verificar si el usuario y la contraseña son válidos
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        // Si la autenticación falla, mostrar un mensaje de error en la página de inicio de sesión
        return res.render("login", {
          error: "Usuario o contraseña incorrectos",
        });
      }

      // Si la autenticación es exitosa, crear una sesión para el usuario y redirigirlo a la página deseada
      req.session.user = row;
      res.redirect("/main");
    }
  );
});

// Ruta para mostrar la página principal (main)
app.get("/main", (req, res) => {
  res.render("main");
});

// Ruta para mostrar la página de índice IPC
app.get("/indice-icl", (req, res) => {
  res.render("indice_icl");
});

// Ruta para mostrar la página de contratos
app.get("/contratos", (req, res) => {
  res.render("contratos"); // Renderiza la vista contratos.ejs
});

// Definir la ruta directamente en server.js
app.get("/calculos-alquileres", (req, res) => {
  res.render("calculos_alquileres");
});

// Ruta para mostrar la página de creación de usuarios
app.get("/crear-usuario", (req, res) => {
  res.render("crear_users");
});

app.get("/cargar-expensas", (req, res) => {
  res.render("expensas");
});
// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.redirect("/login");
  });
});

app.get("/cargar-pago-abl", (req, res) => {
  res.render("abl"); // Renderiza el archivo 'abl.ejs' en la carpeta 'views'
});

app.get("/cobro-alquileres", (req, res) => {
  res.render("cobro-alquileres");
});

app.get("/reclamos", (req, res) => {
  res.render("reclamos"); // Renderiza el archivo 'reclamos.ejs'
});

app.get("/caja", (req, res) => {
  res.render("caja"); // Renderiza el archivo 'caja.ejs'
});

app.get("/pagopropietarios", (req, res) => {
  res.render("pagopropietarios");
});
app.get("/api/calculos-alquileres", (req, res) => {
  const sql = `SELECT * FROM contratos_calculos`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(
        "Error al obtener los cálculos de alquileres:",
        err.message
      );
      return res
        .status(500)
        .json({
          error: "Error al obtener los cálculos de alquileres",
          details: err.message,
        });
    }
    console.log("Datos obtenidos:", rows);
    if (rows.length === 0) {
      console.log("La consulta no devolvió resultados");
    }
    res.json(rows);
  });
});

// Ruta para renderizar la página historial_de_alquileres.ejs
app.get('/historial-de-alquileres', (req, res) => {
  res.render('historial_de_alquileres');
});

// Añade un manejador de errores general
app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res
    .status(500)
    .json({ error: "Error interno del servidor", details: err.message });
});

// Ruta para obtener usuarios
app.get("/api/usuarios", (req, res) => {
  const sql = "SELECT username FROM users";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los usuarios:", err);
      return res.status(500).json({ error: "Error al obtener los usuarios" });
    }

    res.json(rows); // Enviar los usuarios como respuesta
  });
});

app.get("/api/cobro-alquileres", (req, res) => {
  const nombreInquilino = req.query.nombre || "";
  const usuarioCobro = req.query.usuario || ""; // Nuevo parámetro de usuario
  const hoy = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD

  const sqlContratosCalculos = `
    SELECT c.inquilino, c.dto, cc.propietario, cc.importe_periodo, cc.periodo_inicio, cc.periodo_fin, 
           CASE 
             WHEN e.estado = 'Por cobrar' THEN e.expensas_comunes
             ELSE 0
           END AS expensas_comunes,
           CASE 
             WHEN e.estado = 'Por cobrar' THEN e.expensas_extraordinarias
             ELSE 0
           END AS expensas_extraordinarias,
           e.calle, e.numero
    FROM contratos c
    JOIN contratos_calculos cc ON c.id = cc.contrato_id
    LEFT JOIN expensas e ON cc.propietario = e.nombre_propietario
    WHERE c.inquilino LIKE ?
      AND cc.periodo_inicio <= ?
      AND cc.periodo_fin >= ?
      AND cc.periodo_inicio = (
        SELECT MAX(periodo_inicio)
        FROM contratos_calculos
        WHERE periodo_inicio <= ? AND periodo_fin >= ?
      )
    ORDER BY cc.periodo_inicio DESC;
  `;

  db.all(
    sqlContratosCalculos,
    [`%${nombreInquilino}%`, hoy, hoy, hoy, hoy],
    (err, contratosCalculos) => {
      if (err) {
        console.error("Error al obtener los contratos:", err);
        return res
          .status(500)
          .json({ error: "Error al obtener los contratos" });
      }

      // Mapear los resultados a la forma deseada, incluyendo las expensas comunes, extraordinarias, calle, número, y dto
      const resultados = contratosCalculos.map((contrato) => ({
        propietario: contrato.propietario,
        importe_periodo: contrato.importe_periodo.toFixed(2),
        periodo_inicio: contrato.periodo_inicio,
        periodo_fin: contrato.periodo_fin,
        expensas_comunes: contrato.expensas_comunes.toFixed(2),
        expensas_extraordinarias: contrato.expensas_extraordinarias.toFixed(2),
        calle: contrato.calle || "N/A",
        numero: contrato.numero || "N/A",
        dto: contrato.dto || "N/A", // Añadir el dto (departamento)
      }));

      res.json(resultados);
    }
  );
});

app.post("/buscar-propietario", (req, res) => {
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
      return res
        .status(500)
        .json({ error: "Error en la consulta de base de datos (Alquileres)" });
    }

    db.all(sqlABL, [propietario], (err, rowsABL) => {
      if (err) {
        console.error("Error en la consulta SQL (ABL):", err.message);
        return res
          .status(500)
          .json({ error: "Error en la consulta de base de datos (ABL)" });
      }

      db.get(sqlComision, [propietario], (err, rowComision) => {
        if (err) {
          console.error("Error en la consulta SQL (Comisión):", err.message);
          return res
            .status(500)
            .json({
              error: "Error en la consulta de base de datos (Comisión)",
            });
        }

        db.get(sqlCBU, [propietario], (err, rowCBU) => {
          if (err) {
            console.error("Error en la consulta SQL (CBU):", err.message);
            return res
              .status(500)
              .json({ error: "Error en la consulta de base de datos (CBU)" });
          }

          let importePeriodo =
            rowsAlquileres.length > 0 ? rowsAlquileres[0].importe_periodo : 0;
          let montoABL = rowsABL.length > 0 ? rowsABL[0].monto_abl : 0;
          let comision = rowComision ? rowComision.comision : 0;
          let cbu = rowCBU ? rowCBU.cbu : "No disponible";
          let observaciones = rowCBU ? rowCBU.observaciones : ""; // Obtener observaciones

          let administracion = (comision / 100) * importePeriodo;
          let total = importePeriodo - montoABL - administracion;

          res.json({
            importePeriodo,
            montoABL,
            administracion,
            total,
            cbu,
            observaciones, // Enviar observaciones al frontend
          });
        });
      });
    });
  });
});

app.post("/procesar-pago", (req, res) => {
  const {
    propietario,
    importe_periodo,
    monto_abl,
    administracion,
    total,
    metodo_pago,
    cbu,
    fecha_pago,
  } = req.body;

  // Primero inserta los datos del pago
  db.run(
    "INSERT INTO pago_propietarios (propietario, importe_periodo, monto_abl, administracion, total, metodo_pago, cbu, fecha_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      propietario,
      importe_periodo,
      monto_abl,
      administracion,
      total,
      metodo_pago,
      cbu,
      fecha_pago,
    ],
    (error) => {
      if (error) {
        return res.status(500).json({ mensaje: "Error al insertar datos" });
      }

      // Si la inserción fue exitosa, actualiza el estado en la tabla cobro_alquileres
      const sqlUpdate = `UPDATE cobro_alquileres SET estado2 = 'alquiler pagado' WHERE LOWER(propietario) = ? AND estado2 = 'pendiente de rendición'`;

      db.run(sqlUpdate, [propietario.toLowerCase()], (error) => {
        if (error) {
          return res.status(500).json({ mensaje: "Error al actualizar el estado del alquiler" });
        }

        // Inserta el egreso en la tabla caja_diaria
        const descripcionAlquiler = `Egreso por pago de alquiler mensual del contrato ${propietario} del mes de ${new Date().toLocaleString('es-ES', { month: 'long' })}`;
        db.run(
          "INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
          ["egreso", fecha_pago, importe_periodo, metodo_pago, "Pago de alquiler mensual", descripcionAlquiler],
          (error) => {
            if (error) {
              return res.status(500).json({ mensaje: "Error al registrar el egreso en caja_diaria" });
            }

            // Inserta el ingreso por ABL en la tabla caja_diaria
            const descripcionABL = `Ingreso por ABL del contrato ${propietario} del mes de ${new Date().toLocaleString('es-ES', { month: 'long' })}`;
            db.run(
              "INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
              ["ingreso", fecha_pago, monto_abl, metodo_pago, "ABL", descripcionABL],
              (error) => {
                if (error) {
                  return res.status(500).json({ mensaje: "Error al registrar el ingreso de ABL en caja_diaria" });
                }

                // Inserta el ingreso por administración en la tabla caja_diaria
                const descripcionAdministracion = `Ingreso por administración del contrato ${propietario} del mes de ${new Date().toLocaleString('es-ES', { month: 'long' })}`;
                db.run(
                  "INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                  ["ingreso", fecha_pago, administracion, metodo_pago, "Administración", descripcionAdministracion],
                  (error) => {
                    if (error) {
                      return res.status(500).json({ mensaje: "Error al registrar el ingreso de administración en caja_diaria" });
                    }

                    // Respuesta exitosa después de todos los registros
                    res.json({
                      mensaje: "Pago procesado, caja_diaria actualizada y estado del alquiler pagado.",
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});


app.post("/api/procesar-cobro", (req, res) => {
  const {
    nombreInquilino,
    usuarioCobro,
    periodoCobrar,
    metodoPago,
    estado1,
    estado2,
    contratos,
  } = req.body;

  // Consulta SQL para verificar si ya existe un cobro para el mismo inquilino y periodo
  const checkSql = `SELECT COUNT(*) AS count FROM cobro_alquileres
                    WHERE inquilino = ? AND periodo = ?`;

  // Consulta SQL para insertar un nuevo cobro
  const insertSql = `INSERT INTO cobro_alquileres (
    inquilino, propietario, calle, nro, dto, periodo,
    importe_periodo, expensas_comunes, expensas_extraordinarias,
    estado1, estado2, user_id, payment_method
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  // Consulta SQL para actualizar el estado de las expensas
  const updateExpensasSql = `UPDATE expensas
                             SET estado = 'Cobrado'
                             WHERE nombre_propietario = ?
                             AND calle = ?
                             AND numero = ?
                             AND estado = 'Por cobrar'`;

  // Consulta SQL para insertar en la tabla caja_diaria
  const insertCajaDiariaSql = `INSERT INTO caja_diaria (
    tipo, fecha, monto, metodo_pago, motivo, descripcion
  ) VALUES (?, ?, ?, ?, ?, ?)`;

  // Iniciar la transacción
  db.serialize(() => {
    // Verificamos si ya existe un cobro del mismo periodo para el inquilino
    db.get(checkSql, [nombreInquilino, periodoCobrar], (err, row) => {
      if (err) {
        console.error("Error al verificar cobro:", err);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error al verificar el cobro: " + err.message,
          });
      }

      // Si ya existe un cobro para este periodo, no permitimos la inserción
      if (row.count > 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Ya existe un cobro para este inquilino y periodo.",
          });
      }

      // Si no existe un cobro, proceder con la inserción
      db.run("BEGIN TRANSACTION");

      contratos.forEach((contrato) => {
        db.run(
          insertSql,
          [
            nombreInquilino,
            contrato.propietario,
            contrato.calle,
            contrato.numero,
            contrato.dto,
            periodoCobrar,
            parseFloat(contrato.importe_periodo),
            parseFloat(contrato.expensas_comunes) || 0,
            parseFloat(contrato.expensas_extraordinarias) || 0,
            estado1,
            estado2,
            usuarioCobro,
            metodoPago,
          ],
          (err) => {
            if (err) {
              console.error("Error al insertar registro:", err);
              db.run("ROLLBACK");
              return res
                .status(500)
                .json({
                  success: false,
                  message: "Error al procesar el cobro: " + err.message,
                });
            }

            // Insertar en la tabla caja_diaria
            const fecha = new Date().toISOString(); // Fecha actual
            const motivo = 'Cobro de alquiler mensual';
            const descripcionImportePeriodo = `Ingreso por pago de alquiler mensual del contrato (${contrato.propietario}) del mes ${new Date().toLocaleString('default', { month: 'long' })}`;
            const descripcionExpensasComunes = `Ingreso por cobro de expensas comunes del contrato (${contrato.propietario}) del mes ${new Date().toLocaleString('default', { month: 'long' })}`;
            const descripcionExpensasExtraordinarias = `Ingreso por cobro de expensas extraordinarias del contrato (${contrato.propietario}) del mes ${new Date().toLocaleString('default', { month: 'long' })}`;

            db.run(insertCajaDiariaSql, ['ingreso', fecha, contrato.importe_periodo, metodoPago, motivo, descripcionImportePeriodo], (err) => {
              if (err) {
                console.error("Error al insertar en caja_diaria:", err);
                db.run("ROLLBACK");
                return res
                  .status(500)
                  .json({
                    success: false,
                    message: "Error al insertar en caja_diaria: " + err.message,
                  });
              }
            });

            db.run(insertCajaDiariaSql, ['ingreso', fecha, contrato.expensas_comunes, metodoPago, motivo, descripcionExpensasComunes], (err) => {
              if (err) {
                console.error("Error al insertar en caja_diaria:", err);
                db.run("ROLLBACK");
                return res
                  .status(500)
                  .json({
                    success: false,
                    message: "Error al insertar en caja_diaria: " + err.message,
                  });
              }
            });

            db.run(insertCajaDiariaSql, ['ingreso', fecha, contrato.expensas_extraordinarias, metodoPago, motivo, descripcionExpensasExtraordinarias], (err) => {
              if (err) {
                console.error("Error al insertar en caja_diaria:", err);
                db.run("ROLLBACK");
                return res
                  .status(500)
                  .json({
                    success: false,
                    message: "Error al insertar en caja_diaria: " + err.message,
                  });
              }
            });

            // Actualizar el estado de las expensas a 'Cobrado'
            db.run(
              updateExpensasSql,
              [contrato.propietario, contrato.calle, contrato.numero],
              (err) => {
                if (err) {
                  console.error("Error al actualizar expensas:", err);
                  db.run("ROLLBACK");
                  return res
                    .status(500)
                    .json({
                      success: false,
                      message:
                        "Error al actualizar el estado de las expensas: " +
                        err.message,
                    });
                }
              }
            );
          }
        );
      });

      db.run("COMMIT", (err) => {
        if (err) {
          console.error("Error al realizar commit:", err);
          db.run("ROLLBACK");
          return res
            .status(500)
            .json({
              success: false,
              message: "Error al finalizar la transacción: " + err.message,
            });
        }
        res.json({
          success: true,
          message: "Cobro procesado y expensas actualizadas exitosamente",
        });
      });
    });
  });
});

// Ruta para registrar movimientos de caja diaria
app.post("/api/caja-diaria/registrar", (req, res) => {
  const { tipo, fecha, monto, metodo_pago, motivo, descripcion } = req.body;

  if (!tipo || !fecha || !monto || !metodo_pago || !motivo) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son obligatorios" });
  }

  const stmt = db.prepare(
    `INSERT INTO caja_diaria (tipo, fecha, monto, metodo_pago, motivo, descripcion) VALUES (?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    tipo,
    fecha,
    monto,
    metodo_pago,
    motivo,
    descripcion,
    function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error al insertar el registro" });
      }
      res.json({
        success: true,
        message: "Movimiento registrado exitosamente",
      });
    }
  );
  stmt.finalize();
});

// Ruta para obtener los registros de caja diaria
app.get("/api/caja-diaria/registros", (req, res) => {
  const sql = `SELECT * FROM caja_diaria ORDER BY fecha DESC`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Error al obtener los registros" });
    }

    res.json({ success: true, registros: rows });
  });
});


// Ruta para obtener los cobros de alquiler
app.get('/cobro_alquileres', (req, res) => {
  const query = 'SELECT inquilino, periodo, estado1, estado2 FROM cobro_alquileres ORDER BY inquilino, periodo';

  db.all(query, [], (error, results) => {
      if (error) {
          return res.status(500).json({ error: 'Error al obtener los datos' });
      }

      // Agrupar los resultados por inquilino
      const cobrosPorInquilino = {};

      results.forEach(cobro => {
          if (!cobrosPorInquilino[cobro.inquilino]) {
              cobrosPorInquilino[cobro.inquilino] = {
                  inquilino: cobro.inquilino,
                  periodos: [] // Array para almacenar los periodos
              };
          }
          cobrosPorInquilino[cobro.inquilino].periodos.push({
              periodo: cobro.periodo,
              estado1: cobro.estado1,
              estado2: cobro.estado2
          });
      });

      // Convertir el objeto a un array
      const resultadoFinal = Object.values(cobrosPorInquilino);
      res.json(resultadoFinal); // Envía los resultados agrupados al frontend
  });
});


// Ruta para obtener el conteo de contratos activos
app.get('/activos', (req, res) => {
  const sql = `SELECT COUNT(*) AS activos FROM contratos WHERE estado = 'activo'`;

  console.log('Ejecutando consulta para contar contratos activos...');

  db.get(sql, [], (err, row) => {
      if (err) {
          console.error('Error al contar contratos activos:', err.message);
          return res.status(500).json({ error: 'Error al contar contratos activos' });
      }

      console.log('Resultado de la consulta:', row);

      if (!row) {
          console.error('No se encontraron contratos activos.');
          return res.status(404).json({ error: 'No se encontraron contratos activos' });
      }

      res.json({ activos: row.activos });
  });
});

// Ruta para obtener el conteo de contratos inactivos
app.get('/inactivos', (req, res) => {
  const sql = `SELECT COUNT(*) AS inactivos FROM contratos WHERE estado = 'inactivo'`;

  console.log('Ejecutando consulta para contar contratos inactivos...');

  db.get(sql, [], (err, row) => {
      if (err) {
          console.error('Error al contar contratos inactivos:', err.message);
          return res.status(500).json({ error: 'Error al contar contratos inactivos' });
      }

      console.log('Resultado de la consulta:', row);

      if (!row) {
          console.error('No se encontraron contratos inactivos.');
          return res.status(404).json({ error: 'No se encontraron contratos inactivos' });
      }

      res.json({ inactivos: row.inactivos });
  });
});


app.post('/api/actualizar-importe', (req, res) => {
  const { contratoId, periodo, nuevoImporte } = req.body;

  // Convertir nuevoImporte a número
  const importeNumerico = parseFloat(nuevoImporte);

  if (isNaN(importeNumerico)) {
    return res.status(400).json({ success: false, error: 'El importe debe ser un número válido' });
  }

  const sql = `
      UPDATE contratos_calculos
      SET importe_periodo = ?
      WHERE contrato_id = ? AND periodo = ?
  `;

  db.run(sql, [importeNumerico, contratoId, periodo], function(err) {
      if (err) {
          console.error('Error al actualizar el importe:', err.message);
          return res.status(500).json({ success: false, error: 'Error al actualizar el importe' });
      }

      if (this.changes === 0) {
          return res.status(404).json({ success: false, error: 'No se encontró el registro para actualizar' });
      }

      res.json({ success: true, message: 'Importe actualizado correctamente' });
  });
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

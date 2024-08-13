const express = require('express');
const router = express.Router();
const db = require('../db/database');


// Ruta para obtener todos los contratos
router.get('/', (req, res) => {
    db.all('SELECT * FROM contratos', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('contratos', { contratos: rows });
    });
});

// Ruta para agregar un contrato
router.post('/add', (req, res) => {
    const { 
        calle, nro, dto, propietario, inquilino, importe, observaciones, 
        inicio_contrato, duracion_contrato, tipo_incremento, 
        finalizacion_contrato, metodo_pago, monto_deposito 
    } = req.body;

    const sql = `INSERT INTO contratos (
                    calle, nro, dto, propietario, inquilino, importe, observaciones, 
                    inicio_contrato, duracion_contrato, tipo_incremento, 
                    finalizacion_contrato, metodo_pago, monto_deposito
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
        calle, nro, dto, propietario, inquilino, importe, observaciones, 
        inicio_contrato, duracion_contrato, tipo_incremento, 
        finalizacion_contrato, metodo_pago, monto_deposito
    ], function(err) {
        if (err) {
            console.error('Error al insertar el contrato:', err.message);
            return res.json({ success: false, error: 'Error al insertar el contrato' });
        }

        const newContrato = {
            id: this.lastID,
            calle, nro, dto, propietario, inquilino, importe, observaciones, 
            inicio_contrato, duracion_contrato, tipo_incremento, 
            finalizacion_contrato, metodo_pago, monto_deposito
        };

        res.json({ success: true, contrato: newContrato });
    });
});


router.post('/update/:id', (req, res) => {
  const { calle, nro, dto, propietario, inquilino, importe, observaciones, inicio_contrato, duracion_contrato, tipo_incremento, finalizacion_contrato, metodo_pago, monto_deposito } = req.body;
  const { id } = req.params;
  const sql = `UPDATE contratos SET calle = ?, nro = ?, dto = ?, propietario = ?, inquilino = ?, importe = ?, observaciones = ?, inicio_contrato = ?, duracion_contrato = ?, tipo_incremento = ?, finalizacion_contrato = ?, metodo_pago = ?, monto_deposito = ? WHERE id = ?`;
  db.run(sql, [calle, nro, dto, propietario, inquilino, importe, observaciones, inicio_contrato, duracion_contrato, tipo_incremento, finalizacion_contrato, metodo_pago, monto_deposito, id], function(err) {
      if (err) {
          return res.json({ success: false, error: err.message });
      }
      res.json({ success: true });
  });
});

router.post('/delete/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM contratos WHERE id = ?`;
  db.run(sql, [id], function(err) {
      if (err) {
          return res.json({ success: false, error: err.message });
      }
      res.json({ success: true });
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM contratos WHERE id = ?`;
  db.get(sql, [id], (err, contrato) => {
      if (err) {
          return res.json({ success: false, error: err.message });
      }
      res.json(contrato);
  });
});

router.get('/resumen', (req, res) => {
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
        const [ano, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${ano}`;
      };

      const obtenerValorIPC = (fecha) => {
        const fechaFormateada = convertirFecha(fecha);
        const indice = indices.find(indice => indice.fecha === fechaFormateada);
        return indice ? indice.valor_ICL : 0;
      };

      const generarFechasTrimestres = (inicio, fin) => {
        const fechas = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);
        let trimestreCount = 1;

        while (fechaInicio <= fechaFin) {
          const trimestreInicio = new Date(fechaInicio);
          let trimestreFin = new Date(trimestreInicio.getFullYear(), trimestreInicio.getMonth() + 3, 0);
          if (trimestreFin > fechaFin) trimestreFin = new Date(fechaFin);

          fechas.push({
            trimestre: `Trimestre ${trimestreCount}`,
            inicio: trimestreInicio.toISOString().split('T')[0],
            fin: trimestreFin.toISOString().split('T')[0]
          });

          fechaInicio.setMonth(fechaInicio.getMonth() + 3);
          trimestreCount++;
        }

        return fechas;
      };

      const generarMesesTrimestre = (inicio, fin) => {
        const meses = [];
        let fechaInicio = new Date(inicio);
        const fechaFin = new Date(fin);

        while (fechaInicio <= fechaFin) {
          let mesFin = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, 0);
          if (mesFin > fechaFin) mesFin = new Date(fechaFin);

          meses.push({
            mes: `${fechaInicio.getFullYear()}-${('0' + (fechaInicio.getMonth() + 1)).slice(-2)}`,
            fecha_inicio: fechaInicio.toISOString().split('T')[0],
            fecha_fin: mesFin.toISOString().split('T')[0]
          });

          fechaInicio.setMonth(fechaInicio.getMonth() + 1);
        }

        return meses;
      };

      const calcularAjusteICL = (importeAnterior, valorICLAnterior, valorICLActual) => {
        if (valorICLAnterior === 0) {
          return importeAnterior;
        }
        const ajuste = (valorICLActual / valorICLAnterior) * importeAnterior;
        return ajuste;
      };

      const resultados = contratos.map(contrato => {
        const fechasTrimestres = generarFechasTrimestres(contrato.inicio_contrato, contrato.finalizacion_contrato);
        let importeAnterior = contrato.importe;
        let valorICLAnterior = obtenerValorIPC(contrato.inicio_contrato);  // Valor ICL al inicio del contrato

        return fechasTrimestres.map((trimestre, index) => {
          const valorInicio = obtenerValorIPC(trimestre.inicio);  // Valor al inicio del trimestre
          const valorFin = obtenerValorIPC(trimestre.fin);  // Valor al final del trimestre

          // Primer trimestre sin ajuste
          let importeTrimestre;
          if (index === 0) {
            importeTrimestre = contrato.importe;  // Sin ajuste en el primer trimestre
          } else {
            importeTrimestre = calcularAjusteICL(importeAnterior, valorICLAnterior, valorInicio);
          }

          // Generar meses para el trimestre
          const mesesTrimestre = generarMesesTrimestre(trimestre.inicio, trimestre.fin);

          // Actualizamos valorICLAnterior y importeAnterior para el siguiente trimestre
          valorICLAnterior = valorInicio;
          importeAnterior = importeTrimestre;

          return mesesTrimestre.map(mes => ({
            id: contrato.id,
            tipo_incremento: contrato.tipo_incremento,
            trimestre: trimestre.trimestre,
            trimestre_inicio: trimestre.inicio,
            trimestre_fin: trimestre.fin,
            mes: mes.mes,
            fecha_inicio_mes: mes.fecha_inicio,
            fecha_fin_mes: mes.fecha_fin,
            importe_trimestre: importeTrimestre.toFixed(2)
          }));
        }).flat();
      });

      console.log('Resultados:', resultados);

      res.json(resultados);
    });
  });
});



       



module.exports = router;

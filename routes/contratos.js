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

router.post('/add', (req, res) => {
    const {
        calle, nro, dto, propietario, inquilino, importe, observaciones,
        inicio_contrato, duracion_contrato, tipo_incremento,
        finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision, estado
    } = req.body;
  
    // Insertar el contrato en la tabla contratos
    const sqlInsertContrato = `INSERT INTO contratos (
                    calle, nro, dto, propietario, inquilino, importe, observaciones,
                    inicio_contrato, duracion_contrato, tipo_incremento,
                    finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision, estado
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
    db.run(sqlInsertContrato, [
        calle, nro, dto, propietario, inquilino, importe, observaciones,
        inicio_contrato, duracion_contrato, tipo_incremento,
        finalizacion_contrato, metodo_pago, monto_deposito, cbu, comision, estado
    ], function(err) {
        if (err) {
            console.error('Error al insertar el contrato:', err.message);
            return res.json({ success: false, error: 'Error al insertar el contrato' });
        }
  
        const contratoId = this.lastID;
  
        // Consultar los valores IPC y contratos para hacer los cálculos
        const sqlContratos = `
            SELECT 
                id, 
                inicio_contrato, 
                finalizacion_contrato, 
                tipo_incremento, 
                importe, 
                propietario, 
                inquilino
            FROM contratos
            WHERE id = ?
        `;
  
        const sqlIndiceIPC = `
            SELECT fecha, valor_ICL
            FROM indice_ipc
        `;
  
        db.all(sqlContratos, [contratoId], (err, contratos) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener el contrato' });
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
                
                        // Ajustar la fecha de fin del período al último día del mes
                        fechaFinPeriodo = new Date(fechaFinPeriodo.getFullYear(), fechaFinPeriodo.getMonth() + 1, 0);
                
                        // Evitar que el último periodo exceda la fecha final
                        if (fechaFinPeriodo > fechaFin) {
                            fechaFinPeriodo = fechaFin;
                        }
                
                        // Añadir el periodo a la lista
                        fechas.push({
                            periodo: `Trimestre ${periodoCount}`,
                            inicio: fechaInicio.toISOString().split('T')[0],
                            fin: fechaFinPeriodo.toISOString().split('T')[0]
                        });
                
                        // Ajustar la fecha de inicio del siguiente período
                        fechaInicio = new Date(fechaFinPeriodo);
                        fechaInicio.setDate(fechaInicio.getDate() + 1);
                
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
                                propietario: contrato.propietario,
                                inquilino: contrato.inquilino,
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
                                propietario: contrato.propietario,
                                inquilino: contrato.inquilino,
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
  
                // Insertar los cálculos en la tabla contratos_calculos
                const sqlInsertCalculos = `INSERT INTO contratos_calculos (
                    contrato_id, tipo_incremento, propietario, inquilino, periodo, periodo_inicio, periodo_fin, importe_periodo, icl_inicio, icl_fin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
                resultados.forEach(result => {
                    db.run(sqlInsertCalculos, [
                        result.id, result.tipo_incremento, result.propietario, result.inquilino,
                        result.periodo, result.periodo_inicio, result.periodo_fin,
                        result.importe_periodo, result.icl_inicio, result.icl_fin
                    ], err => {
                        if (err) {
                            console.error('Error al insertar el cálculo:', err.message);
                        }
                    });
                });
  
                res.json({ success: true, contratoId });
            });
        });
    });
  });




  router.post('/update/:id', (req, res) => {
    const {
      calle, nro, dto, propietario, inquilino, importe, observaciones, inicio_contrato,
      duracion_contrato, tipo_incremento, finalizacion_contrato, metodo_pago,
      monto_deposito, cbu, comision, estado
    } = req.body;
    const { id } = req.params;
  
    // Actualizar el contrato en la tabla contratos
    const sqlUpdateContrato = `
      UPDATE contratos SET
        calle = ?, nro = ?, dto = ?, propietario = ?, inquilino = ?, importe = ?, observaciones = ?,
        inicio_contrato = ?, duracion_contrato = ?, tipo_incremento = ?,
        finalizacion_contrato = ?, metodo_pago = ?, monto_deposito = ?, cbu = ?, comision = ?, estado = ?
      WHERE id = ?
    `;
  
    db.run(sqlUpdateContrato, [
      calle, nro, dto, propietario, inquilino, importe, observaciones,
      inicio_contrato, duracion_contrato, tipo_incremento, finalizacion_contrato,
      metodo_pago, monto_deposito, cbu, comision, estado, id
    ], function(err) {
      if (err) {
        console.error('Error al actualizar el contrato:', err.message);
        return res.json({ success: false, error: 'Error al actualizar el contrato' });
      }
  
      // Eliminar los cálculos antiguos asociados a este contrato
      const sqlDeleteCalculos = `DELETE FROM contratos_calculos WHERE contrato_id = ?`;
      db.run(sqlDeleteCalculos, [id], err => {
        if (err) {
          console.error('Error al eliminar los cálculos antiguos:', err.message);
          return res.json({ success: false, error: 'Error al eliminar los cálculos antiguos' });
        }
  
        // Consultar los valores IPC y contratos para hacer los cálculos
        const sqlContratos = `
          SELECT 
            id, 
            inicio_contrato, 
            finalizacion_contrato, 
            tipo_incremento, 
            importe, 
            propietario, 
            inquilino
          FROM contratos
          WHERE id = ?
        `;
  
        const sqlIndiceIPC = `
          SELECT fecha, valor_ICL
          FROM indice_ipc
        `;
  
        db.all(sqlContratos, [id], (err, contratos) => {
          if (err) {
            return res.status(500).json({ error: 'Error al obtener el contrato' });
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
                    propietario: contrato.propietario,
                    inquilino: contrato.inquilino,
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
                    propietario: contrato.propietario,
                    inquilino: contrato.inquilino,
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
  
            // Insertar los cálculos en la tabla contratos_calculos
            const sqlInsertCalculos = `
              INSERT INTO contratos_calculos (
                contrato_id, tipo_incremento, propietario, inquilino, periodo,
                periodo_inicio, periodo_fin, importe_periodo, icl_inicio, icl_fin
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
  
            resultados.forEach(result => {
              db.run(sqlInsertCalculos, [
                result.id, result.tipo_incremento, result.propietario, result.inquilino,
                result.periodo, result.periodo_inicio, result.periodo_fin,
                result.importe_periodo, result.icl_inicio, result.icl_fin
              ], err => {
                if (err) {
                  console.error('Error al insertar los cálculos:', err.message);
                  return res.json({ success: false, error: 'Error al insertar los cálculos' });
                }
              });
            });
  
            res.json({ success: true, message: 'Contrato y cálculos actualizados correctamente' });
          });
        });
      });
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




       



module.exports = router;
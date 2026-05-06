/**
 * Archivo: tests.js
 * Pruebas automáticas controladas del pipeline. Solo inserta y verifica;
 * nunca borra datos existentes ni modifica triggers.
 */

/**
 * Prueba el tramo: registros_inbox -> runPipelineCompleto() -> registros_validacion.
 *
 * Estrategia de identificación:
 *   - El marcador TEST_PIPELINE_<ts> va en el campo `descripcion` del inbox.
 *   - registrarEnInbox() devuelve el inbox_id generado (REG-INBOX-XXXXXX).
 *   - Tras el pipeline, se busca ese inbox_id en la columna 2 de registros_validacion
 *     (col B, índice 1 base-0), que es donde validation.js escribe el id de origen.
 *
 * @returns {{ok, marcador, inbox_id, inbox_insertado, validacion_creada, fila_validacion,
 *            resumen_pipeline, errores}}
 */
function testInboxAValidacionControlado() {
  var resultado = {
    ok: false,
    marcador: "",
    inbox_id: "",
    inbox_insertado: false,
    validacion_creada: false,
    fila_validacion: null,
    resumen_pipeline: null,
    errores: []
  };

  try {
    // 1. Marcador único
    var marcador = "TEST_PIPELINE_" + new Date().getTime();
    resultado.marcador = marcador;

    // 2. Insertar en registros_inbox usando la función oficial del proyecto.
    //    visible_en_informe = false para no contaminar reportes reales.
    //    Todos los campos requeridos por validation.js están presentes para
    //    evitar el comentario "Falta info:" en registros_validacion.
    var datosPrueba = {
      fecha_ejecucion:           Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      hora_ejecucion:            "00:00",
      sede_id:                   "SED-TEST",
      sector_id:                 "SEC-TEST",
      tecnico_principal_texto:   "TEST_TECNICO",
      tecnico_secundario_texto:  "",
      tipo_trabajo_texto:        "Preventiva",
      relacionado_texto:         "TEST",
      subcategoria:              "Test Automatico",
      descripcion:               marcador,
      observaciones:             "",
      notas_adicionales:         "",
      origen_registro:           "Test automatico",
      es_excepcion:              false,
      motivo_excepcion:          "",
      visible_en_informe:        false,
      periodo_informe:           Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM"),
      equipos_texto:             "TEST-EQ-001"
    };

    var resInbox = registrarEnInbox(datosPrueba);
    if (!resInbox || !resInbox.success) {
      resultado.errores.push("registrarEnInbox falló: " + JSON.stringify(resInbox));
      Logger.log(JSON.stringify(resultado));
      return resultado;
    }
    resultado.inbox_insertado = true;
    var inboxId = resInbox.id;
    resultado.inbox_id = inboxId;

    // 3. Ejecutar el pipeline completo
    var resumenPipeline = runPipelineCompleto();
    resultado.resumen_pipeline = resumenPipeline;

    // 4. Buscar el registro en registros_validacion por inbox_id (columna B = índice 1 base-0).
    //    Recorre de abajo hacia arriba para tomar la coincidencia más reciente.
    //    validation.js escribe el inbox_id de origen en la posición 2 de cada fila nueva.
    var sheetVal = getSheetByNameSafe("registros_validacion");
    var lastRowVal = sheetVal.getLastRow();

    if (lastRowVal >= DATA_START_ROW) {
      var dataVal = sheetVal
        .getRange(DATA_START_ROW, 1, lastRowVal - DATA_START_ROW + 1, 2)
        .getValues();

      for (var i = dataVal.length - 1; i >= 0; i--) {
        if (String(dataVal[i][1] || "").trim() === inboxId) {
          resultado.validacion_creada = true;
          resultado.fila_validacion = i + DATA_START_ROW;
          break;
        }
      }
    }

    if (!resultado.validacion_creada) {
      resultado.errores.push(
        "No se encontró inbox_id=" + inboxId + " en registros_validacion."
      );
    }

    resultado.ok = resultado.inbox_insertado && resultado.validacion_creada;

  } catch (e) {
    resultado.errores.push("Excepción: " + e.message + (e.stack ? " | " + e.stack : ""));
  }

  Logger.log(JSON.stringify(resultado));
  return resultado;
}

/**
 * Prueba el flujo E2E completo del pipeline:
 *   inbox -> validacion -> [marcar Validado] -> BD -> detalle_equipos -> historial_por_equipo
 *
 * Estrategia de identificación a lo largo del flujo:
 *   - inbox_id (REG-INBOX-XXXXXX): tomado directamente de resStep1.inbox_id.
 *   - bd_id (REG-XXXXXX): buscado en registros_bd col AA (índice 26) = registro_inbox_id_ref.
 *   - detalle: buscado en registro_detalle_equipos col A (índice 0) = registro_id = bd_id.
 *   - historial: buscado en historial_por_equipo col F (índice 5) = descripcion = marcador.
 *
 * @returns {{ok, marcador, inbox_id, fila_validacion, validacion_marcada,
 *            registro_bd_creado, fila_bd, detalle_creado, fila_detalle,
 *            historial_creado, fila_historial,
 *            resumen_pipeline_1, resumen_pipeline_2, errores}}
 */
function testPipelineE2EControlado() {
  var resultado = {
    ok: false,
    marcador: "",
    inbox_id: "",
    fila_validacion: null,
    validacion_marcada: false,
    registro_bd_creado: false,
    fila_bd: null,
    detalle_creado: false,
    fila_detalle: null,
    historial_creado: false,
    fila_historial: null,
    resumen_pipeline_1: null,
    resumen_pipeline_2: null,
    errores: []
  };

  try {
    // PASO 1: Inbox -> Validacion (pipeline 1)
    var resStep1 = testInboxAValidacionControlado();
    resultado.marcador = resStep1.marcador;
    resultado.resumen_pipeline_1 = resStep1.resumen_pipeline;
    resultado.fila_validacion = resStep1.fila_validacion;

    if (!resStep1.ok) {
      resultado.errores.push("Step1 falló: " + JSON.stringify(resStep1.errores));
      Logger.log(JSON.stringify(resultado));
      return resultado;
    }

    // PASO 2: Tomar inbox_id directamente desde resStep1 (ya verificado en Step1).
    var inboxId = resStep1.inbox_id;
    resultado.inbox_id = inboxId;

    if (!inboxId) {
      resultado.errores.push("inbox_id vacío en resStep1. No se puede continuar.");
      Logger.log(JSON.stringify(resultado));
      return resultado;
    }

    // Localizar la fila de validacion de abajo hacia arriba para tomar la más reciente.
    var sheetVal = getSheetByNameSafe("registros_validacion");
    var lastRowValE2E = sheetVal.getLastRow();
    var filaValidacionE2E = resStep1.fila_validacion; // fallback desde Step1

    if (lastRowValE2E >= DATA_START_ROW) {
      var dataValE2E = sheetVal
        .getRange(DATA_START_ROW, 1, lastRowValE2E - DATA_START_ROW + 1, 2)
        .getValues();

      for (var v = dataValE2E.length - 1; v >= 0; v--) {
        if (String(dataValE2E[v][1] || "").trim() === inboxId) {
          filaValidacionE2E = v + DATA_START_ROW;
          break;
        }
      }
    }
    resultado.fila_validacion = filaValidacionE2E;

    // PASO 3: Marcar estado_validacion = "Validado" en col 12 (índice 11 base-0).
    //         bd.js procesa solo filas con estado estrictamente "Validado" (bd.js:69).
    sheetVal.getRange(filaValidacionE2E, 12).setValue("Validado");
    SpreadsheetApp.flush();

    // Verificar que la escritura realmente quedó antes de continuar.
    var valorEscrito = String(
      sheetVal.getRange(filaValidacionE2E, 12).getValue() || ""
    ).trim();
    if (valorEscrito !== "Validado") {
      resultado.errores.push(
        "flush() ejecutado pero la celda no quedó 'Validado'. Valor actual: '" + valorEscrito + "'."
      );
      Logger.log(JSON.stringify(resultado));
      return resultado;
    }
    resultado.validacion_marcada = true;

    // PASO 4: Validado -> BD -> Detalle -> Historial (pipeline 2)
    var resumen2 = runPipelineCompleto();
    resultado.resumen_pipeline_2 = resumen2;

    // PASO 5: Buscar en registros_bd por registro_inbox_id_ref (col 27 = índice 26 base-0).
    //         bd.js escribe el inbox_id en la posición 27 de cada fila nueva (bd.js:125).
    var sheetBD = getSheetByNameSafe("registros_bd");
    var lastRowBD = sheetBD.getLastRow();
    var bdId = null;

    if (lastRowBD >= DATA_START_ROW) {
      var dataBD = sheetBD
        .getRange(DATA_START_ROW, 1, lastRowBD - DATA_START_ROW + 1, 27)
        .getValues();

      for (var i = 0; i < dataBD.length; i++) {
        if (String(dataBD[i][26] || "").trim() === inboxId) {
          bdId = String(dataBD[i][0] || "").trim();
          resultado.registro_bd_creado = true;
          resultado.fila_bd = i + DATA_START_ROW;
          break;
        }
      }
    }

    if (!bdId) {
      resultado.errores.push("No se encontró inbox_id=" + inboxId + " en registros_bd (col 27).");
    }

    // PASO 6: Buscar en registro_detalle_equipos por registro_id (col A = índice 0 base-0).
    //         detalle_equipos.js escribe el bd_id en col A (detalle_equipos.js:43).
    if (bdId) {
      var sheetDetalle = getSheetByNameSafe("registro_detalle_equipos");
      var lastRowDetalle = sheetDetalle.getLastRow();

      if (lastRowDetalle >= DATA_START_ROW) {
        var dataDetalle = sheetDetalle
          .getRange(DATA_START_ROW, 1, lastRowDetalle - DATA_START_ROW + 1, 1)
          .getValues();

        for (var d = 0; d < dataDetalle.length; d++) {
          if (String(dataDetalle[d][0] || "").trim() === bdId) {
            resultado.detalle_creado = true;
            resultado.fila_detalle = d + DATA_START_ROW;
            break;
          }
        }
      }

      if (!resultado.detalle_creado) {
        resultado.errores.push("No se encontró registro_id=" + bdId + " en registro_detalle_equipos (col A).");
      }
    }

    // PASO 7: Buscar en historial_por_equipo por descripcion = marcador (col F = índice 5 base-0).
    //         historial_equipos.js escribe bdInfo.descripcion en col F (historial_equipos.js:82),
    //         y bdInfo.descripcion viene de bd col L = descripcion del inbox = marcador.
    var sheetHist = getSheetByNameSafe("historial_por_equipo");
    var lastRowHist = sheetHist.getLastRow();

    if (lastRowHist >= DATA_START_ROW) {
      var dataHist = sheetHist
        .getRange(DATA_START_ROW, 1, lastRowHist - DATA_START_ROW + 1, 6)
        .getValues();

      for (var h = 0; h < dataHist.length; h++) {
        if (String(dataHist[h][5] || "").trim() === resultado.marcador) {
          resultado.historial_creado = true;
          resultado.fila_historial = h + DATA_START_ROW;
          break;
        }
      }
    }

    if (!resultado.historial_creado) {
      resultado.errores.push("No se encontró marcador=" + resultado.marcador + " en historial_por_equipo (col F).");
    }

    resultado.ok = resultado.validacion_marcada &&
                   resultado.registro_bd_creado &&
                   resultado.detalle_creado &&
                   resultado.historial_creado;

  } catch (e) {
    resultado.errores.push("Excepción: " + e.message + (e.stack ? " | " + e.stack : ""));
  }

  Logger.log(JSON.stringify(resultado));
  return resultado;
}

/**
 * Diagnóstico no destructivo del estado actual del sistema.
 * Solo lee hojas y registra un resumen JSON con Logger.log().
 */
function diagnosticarEstadoSistema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = [
    "registros_inbox",
    "registros_validacion",
    "registros_bd",
    "registro_detalle_equipos",
    "historial_por_equipo",
    "logs_pipeline",
    "equipos_maestro"
  ];
  
  var resumen = {
    fecha_diagnostico: new Date().toISOString(),
    hojas: {},
    ultimo_evento_logs: null
  };
  
  hojas.forEach(function(nombreHoja) {
    var hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) {
      resumen.hojas[nombreHoja] = "No existe";
      return;
    }
    
    var lastRow = hoja.getLastRow();
    var lastCol = hoja.getLastColumn();
    
    // logs_pipeline tiene 1 fila de encabezado. El resto tiene 3.
    var filasEncabezado = (nombreHoja === "logs_pipeline") ? 1 : 3;
    var filasDatos = (lastRow > filasEncabezado) ? (lastRow - filasEncabezado) : 0;
    
    var tieneTest = false;
    
    if (filasDatos > 0 && lastCol > 0) {
      var data = hoja.getRange(filasEncabezado + 1, 1, filasDatos, lastCol).getValues();
      
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        for (var j = 0; j < row.length; j++) {
          var cellValue = String(row[j] || "").trim();
          if (cellValue.indexOf("TEST_") === 0 || cellValue.indexOf("TEST-") === 0) {
            tieneTest = true;
            break;
          }
        }
        if (tieneTest) break;
      }
      
      // Capturar último evento en logs_pipeline
      if (nombreHoja === "logs_pipeline") {
        var ultimaFilaLog = data[data.length - 1]; // La última fila de datos
        if (ultimaFilaLog && ultimaFilaLog.length >= 2) {
          resumen.ultimo_evento_logs = {
            timestamp: String(ultimaFilaLog[0]),
            evento: String(ultimaFilaLog[1])
          };
        }
      }
    }
    
    resumen.hojas[nombreHoja] = {
      filas_totales: lastRow,
      filas_datos_reales: filasDatos,
      contiene_basura_test: tieneTest
    };
  });
  
  // Resumen final en formato JSON mediante Logger
  Logger.log(JSON.stringify(resumen, null, 2));
  return resumen;
}

/**
 * Valida la estructura de las hojas requeridas del sistema.
 * 
 * Reglas:
 * - No modifica datos.
 * - No borra filas.
 * - No ejecuta pipeline.
 * - Solo lee estructura y registra resumen con Logger.log().
 */
function validarEstructuraHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojasRequeridas = [
    "registros_inbox",
    "registros_validacion",
    "registros_bd",
    "registro_detalle_equipos",
    "historial_por_equipo",
    "logs_pipeline",
    "equipos_maestro"
  ];
  
  var reporte = {
    ok: true,
    resultados: {},
    errores: []
  };

  hojasRequeridas.forEach(function(nombreHoja) {
    var hojaInfo = {
      existe: false,
      columnas: 0,
      encabezados: [],
      estructura_minima: false
    };

    var hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) {
      hojaInfo.existe = false;
      reporte.ok = false;
      reporte.errores.push("La hoja '" + nombreHoja + "' no existe.");
    } else {
      hojaInfo.existe = true;
      var lastCol = hoja.getLastColumn();
      var lastRow = hoja.getLastRow();
      hojaInfo.columnas = lastCol;

      // logs_pipeline tiene 1 fila de encabezado. El resto tiene 3.
      var filaEncabezados = (nombreHoja === "logs_pipeline") ? 1 : 3;

      if (lastCol > 0 && lastRow >= filaEncabezados) {
        hojaInfo.estructura_minima = true;
        var valoresEncabezados = hoja.getRange(filaEncabezados, 1, 1, lastCol).getValues()[0];
        hojaInfo.encabezados = valoresEncabezados.map(function(val) {
          return String(val).trim();
        });
      } else {
        hojaInfo.estructura_minima = false;
        reporte.ok = false;
        reporte.errores.push("La hoja '" + nombreHoja + "' no tiene estructura mínima o está vacía.");
      }
    }
    
    reporte.resultados[nombreHoja] = hojaInfo;
  });

  Logger.log(JSON.stringify(reporte, null, 2));
  return reporte;
}

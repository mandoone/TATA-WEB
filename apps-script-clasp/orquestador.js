/**
 * Archivo: orquestador.gs
 * Ejecuta el pipeline completo del backend.
 */

function runPipelineCompleto() {
  var resumenGlobal = {
    validaciones_procesadas: 0,
    registros_bd_insertados: 0,
    detalles_equipos_creados: 0,
    historial_equipos_creados: 0,
    errores: []
  };

  var _log0 = {
    evento: "pipeline_inicio",
    funcion: "runPipelineCompleto",
    ts: new Date().toISOString()
  };
  Logger.log(JSON.stringify(_log0));
  appendPipelineLog(_log0);

  try {
    var resInbox = procesarInboxPendiente();
    if (resInbox && resInbox.procesados) {
      resumenGlobal.validaciones_procesadas = resInbox.procesados;
    }
    var _log1 = {
      evento: "pipeline_paso",
      paso: 1,
      funcion: "procesarInboxPendiente",
      ts: new Date().toISOString(),
      resultado: resInbox
    };
    Logger.log(JSON.stringify(_log1));
    appendPipelineLog(_log1);
  } catch (e) {
    var _log1e = {
      evento: "pipeline_error",
      funcion: "procesarInboxPendiente",
      paso: 1,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    };
    Logger.log(JSON.stringify(_log1e));
    appendPipelineLog(_log1e);
    resumenGlobal.errores.push("Inbox->Validacion: " + e.message);
  }

  try {
    var resBD = procesarValidacionA_BD();
    if (resBD && resBD.procesados) {
      resumenGlobal.registros_bd_insertados = resBD.procesados;
    }
    var _log2 = {
      evento: "pipeline_paso",
      paso: 2,
      funcion: "procesarValidacionA_BD",
      ts: new Date().toISOString(),
      resultado: resBD
    };
    Logger.log(JSON.stringify(_log2));
    appendPipelineLog(_log2);
  } catch (e) {
    var _log2e = {
      evento: "pipeline_error",
      funcion: "procesarValidacionA_BD",
      paso: 2,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    };
    Logger.log(JSON.stringify(_log2e));
    appendPipelineLog(_log2e);
    resumenGlobal.errores.push("Validacion->BD: " + e.message);
  }

  try {
    var resDetalles = procesarDetalleEquipos();
    if (resDetalles && resDetalles.equipos_agregados) {
      resumenGlobal.detalles_equipos_creados = resDetalles.equipos_agregados;
    }
    var _log3 = {
      evento: "pipeline_paso",
      paso: 3,
      funcion: "procesarDetalleEquipos",
      ts: new Date().toISOString(),
      resultado: resDetalles
    };
    Logger.log(JSON.stringify(_log3));
    appendPipelineLog(_log3);
  } catch (e) {
    var _log3e = {
      evento: "pipeline_error",
      funcion: "procesarDetalleEquipos",
      paso: 3,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    };
    Logger.log(JSON.stringify(_log3e));
    appendPipelineLog(_log3e);
    resumenGlobal.errores.push("BD->Detalles: " + e.message);
  }

  try {
    var resHistorial = generarHistorialEquipos();
    if (resHistorial && resHistorial.nuevos_historiales) {
      resumenGlobal.historial_equipos_creados = resHistorial.nuevos_historiales;
    }
    var _log4 = {
      evento: "pipeline_paso",
      paso: 4,
      funcion: "generarHistorialEquipos",
      ts: new Date().toISOString(),
      resultado: resHistorial
    };
    Logger.log(JSON.stringify(_log4));
    appendPipelineLog(_log4);
  } catch (e) {
    var _log4e = {
      evento: "pipeline_error",
      funcion: "generarHistorialEquipos",
      paso: 4,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    };
    Logger.log(JSON.stringify(_log4e));
    appendPipelineLog(_log4e);
    resumenGlobal.errores.push("Detalles->Historial: " + e.message);
  }

  var _logFin = {
    evento: "pipeline_fin",
    funcion: "runPipelineCompleto",
    ts: new Date().toISOString(),
    resumen: resumenGlobal
  };
  Logger.log(JSON.stringify(_logFin));
  appendPipelineLog(_logFin);

  return resumenGlobal;
}

function testPipeline() {
  Logger.log("PRUEBA MANUAL DEL PIPELINE...");
  return runPipelineCompleto();
}

function instalarTriggerCron() {
  var triggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "runPipelineCompleto") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("runPipelineCompleto")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("Trigger instalado: runPipelineCompleto cada 5 minutos.");
}
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

  Logger.log(JSON.stringify({
    evento: "pipeline_inicio",
    funcion: "runPipelineCompleto",
    ts: new Date().toISOString()
  }));

  try {
    var resInbox = procesarInboxPendiente();
    if (resInbox && resInbox.procesados) {
      resumenGlobal.validaciones_procesadas = resInbox.procesados;
    }
    Logger.log(JSON.stringify({
      evento: "pipeline_paso",
      paso: 1,
      funcion: "procesarInboxPendiente",
      ts: new Date().toISOString(),
      resultado: resInbox
    }));
  } catch (e) {
    Logger.log(JSON.stringify({
      evento: "pipeline_error",
      funcion: "procesarInboxPendiente",
      paso: 1,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    }));
    resumenGlobal.errores.push("Inbox->Validacion: " + e.message);
  }

  try {
    var resBD = procesarValidacionA_BD();
    if (resBD && resBD.procesados) {
      resumenGlobal.registros_bd_insertados = resBD.procesados;
    }
    Logger.log(JSON.stringify({
      evento: "pipeline_paso",
      paso: 2,
      funcion: "procesarValidacionA_BD",
      ts: new Date().toISOString(),
      resultado: resBD
    }));
  } catch (e) {
    Logger.log(JSON.stringify({
      evento: "pipeline_error",
      funcion: "procesarValidacionA_BD",
      paso: 2,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    }));
    resumenGlobal.errores.push("Validacion->BD: " + e.message);
  }

  try {
    var resDetalles = procesarDetalleEquipos();
    if (resDetalles && resDetalles.equipos_agregados) {
      resumenGlobal.detalles_equipos_creados = resDetalles.equipos_agregados;
    }
    Logger.log(JSON.stringify({
      evento: "pipeline_paso",
      paso: 3,
      funcion: "procesarDetalleEquipos",
      ts: new Date().toISOString(),
      resultado: resDetalles
    }));
  } catch (e) {
    Logger.log(JSON.stringify({
      evento: "pipeline_error",
      funcion: "procesarDetalleEquipos",
      paso: 3,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    }));
    resumenGlobal.errores.push("BD->Detalles: " + e.message);
  }

  try {
    var resHistorial = generarHistorialEquipos();
    if (resHistorial && resHistorial.nuevos_historiales) {
      resumenGlobal.historial_equipos_creados = resHistorial.nuevos_historiales;
    }
    Logger.log(JSON.stringify({
      evento: "pipeline_paso",
      paso: 4,
      funcion: "generarHistorialEquipos",
      ts: new Date().toISOString(),
      resultado: resHistorial
    }));
  } catch (e) {
    Logger.log(JSON.stringify({
      evento: "pipeline_error",
      funcion: "generarHistorialEquipos",
      paso: 4,
      ts: new Date().toISOString(),
      error: e.message,
      stack: e.stack || ""
    }));
    resumenGlobal.errores.push("Detalles->Historial: " + e.message);
  }

  Logger.log(JSON.stringify({
    evento: "pipeline_fin",
    funcion: "runPipelineCompleto",
    ts: new Date().toISOString(),
    resumen: resumenGlobal
  }));

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
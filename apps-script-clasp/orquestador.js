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

  Logger.log("=== INICIANDO PIPELINE TCS ===");

  Logger.log("PASO 1: procesarInboxPendiente()");
  try {
    var resInbox = procesarInboxPendiente();
    if (resInbox && resInbox.procesados) {
      resumenGlobal.validaciones_procesadas = resInbox.procesados;
    }
    Logger.log(JSON.stringify(resInbox));
  } catch (e) {
    Logger.log("ERROR PASO 1: " + e.message);
    resumenGlobal.errores.push("Inbox->Validacion: " + e.message);
  }

  Logger.log("PASO 2: procesarValidacionA_BD()");
  try {
    var resBD = procesarValidacionA_BD();
    if (resBD && resBD.procesados) {
      resumenGlobal.registros_bd_insertados = resBD.procesados;
    }
    Logger.log(JSON.stringify(resBD));
  } catch (e) {
    Logger.log("ERROR PASO 2: " + e.message);
    resumenGlobal.errores.push("Validacion->BD: " + e.message);
  }

  Logger.log("PASO 3: procesarDetalleEquipos()");
  try {
    var resDetalles = procesarDetalleEquipos();
    if (resDetalles && resDetalles.equipos_agregados) {
      resumenGlobal.detalles_equipos_creados = resDetalles.equipos_agregados;
    }
    Logger.log(JSON.stringify(resDetalles));
  } catch (e) {
    Logger.log("ERROR PASO 3: " + e.message);
    resumenGlobal.errores.push("BD->Detalles: " + e.message);
  }

  Logger.log("PASO 4: generarHistorialEquipos()");
  try {
    var resHistorial = generarHistorialEquipos();
    if (resHistorial && resHistorial.nuevos_historiales) {
      resumenGlobal.historial_equipos_creados = resHistorial.nuevos_historiales;
    }
    Logger.log(JSON.stringify(resHistorial));
  } catch (e) {
    Logger.log("ERROR PASO 4: " + e.message);
    resumenGlobal.errores.push("Detalles->Historial: " + e.message);
  }

  Logger.log("=== FIN PIPELINE ===");
  Logger.log(JSON.stringify(resumenGlobal));

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
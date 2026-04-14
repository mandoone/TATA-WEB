/**
 * Archivo: orquestador.gs
 * Propósito: Automatizar la cascada de ejecución de todos los módulos del sistema TCS.
 * Actúa como punto de entrada (ya sea vía Trigger cron o ejecución manual final) 
 * que engatilla en orden correcto la transformación de datos entre tablas.
 */

/**
 * Función principal maestra que ejecuta el Pipeline completo.
 * Está contenida bajo bloques seguros (try/catch) modulares para que
 * un posible fallo gráfico en un paso no aborte todos los demás registros.
 * 
 * @returns {Object} Resumen transaccional con la cantidad de procesamientos y fallos.
 */
function runPipelineCompleto() {
  var resumenGlobal = {
    validaciones_procesadas: 0,
    registros_bd_insertados: 0,
    detalles_equipos_creados: 0,
    historial_equipos_creados: 0,
    errores: []
  };
  
  Logger.log("=== INICIANDO CRON / PIPELINE TCS ===");
  
  // -------------------------------------------------------------
  // PASO 1: Ingreso en Bandeja (Inbox) hacia Validación Limpia
  // -------------------------------------------------------------
  Logger.log("=> PASO 1. Ejecutando: procesarInboxPendiente()...");
  try {
    var resInbox = procesarInboxPendiente();
    if (resInbox && resInbox.procesados) {
      resumenGlobal.validaciones_procesadas = resInbox.procesados;
    }
    Logger.log(" -> OK: " + JSON.stringify(resInbox));
  } catch (e) {
    Logger.log(" -> FAIL en PASO 1: " + e.message);
    resumenGlobal.errores.push("Inbox->Validacion: " + e.message);
  }
  
  // -------------------------------------------------------------
  // PASO 2: Emisión desde Validación hacia la Base de Datos Maestra
  // -------------------------------------------------------------
  Logger.log("=> PASO 2. Ejecutando: procesarValidacionA_BD()...");
  try {
    var resBD = procesarValidacionA_BD();
    if (resBD && resBD.procesados) {
      resumenGlobal.registros_bd_insertados = resBD.procesados;
    }
    Logger.log(" -> OK: " + JSON.stringify(resBD));
  } catch (e) {
    Logger.log(" -> FAIL en PASO 2: " + e.message);
    resumenGlobal.errores.push("Validacion->BD: " + e.message);
  }
  
  // -------------------------------------------------------------
  // PASO 3: Desagregación desde BD hacia Nodos de Detalles
  // -------------------------------------------------------------
  Logger.log("=> PASO 3. Ejecutando: procesarDetalleEquipos()...");
  try {
    var resDetalles = procesarDetalleEquipos();
    if (resDetalles && resDetalles.equipos_agregados) {
      resumenGlobal.detalles_equipos_creados = resDetalles.equipos_agregados;
    }
    Logger.log(" -> OK: " + JSON.stringify(resDetalles));
  } catch (e) {
    Logger.log(" -> FAIL en PASO 3: " + e.message);
    resumenGlobal.errores.push("BD->Detalles: " + e.message);
  }
  
  // -------------------------------------------------------------
  // PASO 4: Cruce a tabla transaccional unívoca a los Equipos
  // -------------------------------------------------------------
  Logger.log("=> PASO 4. Ejecutando: generarHistorialEquipos()...");
  try {
    var resHistorial = generarHistorialEquipos();
    if (resHistorial && resHistorial.nuevos_historiales) {
      resumenGlobal.historial_equipos_creados = resHistorial.nuevos_historiales;
    }
    Logger.log(" -> OK: " + JSON.stringify(resHistorial));
  } catch (e) {
    Logger.log(" -> FAIL en PASO 4: " + e.message);
    resumenGlobal.errores.push("Detalles->Historial: " + e.message);
  }
  
  // -------------------------------------------------------------
  // SALIDA Y LOGS GLOBALES
  // -------------------------------------------------------------
  Logger.log("=== FIN DEL PIPELINE ===");
  Logger.log("RESUMEN FINAL: " + JSON.stringify(resumenGlobal));
  
  return resumenGlobal;
}

/**
 * Función enlazada para ejecución de Prueba en la inferfaz de Google Apps Script.
 * Presiona "Run" o "Ejecutar" teniendo esta función seleccionada.
 */
function testPipeline() {
  Logger.log("INICIANDO PRUEBA MANUAL DEL ORQUESTADOR...");
  runPipelineCompleto();
}

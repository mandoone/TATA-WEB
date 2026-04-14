/**
 * Sistema Integral de Gestión de Mantenciones TCS
 * Archivo: main.gs
 * Propósito: Este archivo es el punto de entrada principal del lado del servidor (backend) en Google Apps Script.
 * Contendrá las funciones principales como doGet() o doPost() si expone una Web App,
 * o inicializaciones base.
 */

function doGet() {
  // Configuración base de la renderización del frontend
  // return HtmlService.createHtmlOutputFromFile('web/index');
}

/**
 * doPost(e) intercepta peticiones HTTP POST mandadas hacia la URL de esta Web App
 * cuando se despliegue. Aquí aterriza la información de formularios externos.
 * 
 * @param {Object} e - Evento de Request.
 */
function doPost(e) {
  try {
    // Validación básica de que nos mandaron contenido (el payload)
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No se recibieron datos (payload post vacío)."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Parseando el body JS a un objecto JSON nativo
    var requestData = JSON.parse(e.postData.contents);
    
    // Delegamos al flujo de "Inbox" (capa transaccional inicial)
    var response = registrarEnInbox(requestData);
    
    // Devolvemos el resultado positivo
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Atrapamos errores fuertes (ej: formato JSON malo, hoja que no se encontró en utils.js, etc.)
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Error del servidor: " + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función de Prueba Manual.
 * 
 * Ejecuta esta función manualmente desde el Editor (Run/Ejecutar) 
 * para simular el comportamiento de una petición web y asegurar 
 * que la inserción en la planilla ocurre como se espera.
 */
function testIngresoManualInbox() {
  var datosDePruebaMokeados = {
    fecha_ejecucion: "2026-04-13",
    hora_ejecucion: "14:30",
    sede_id: "TCS-NORTE",
    sector_id: "DATA-CENTER-1",
    tecnico_principal_texto: "Juan Pérez",
    tecnico_secundario_texto: "Carlos González",
    tipo_trabajo_texto: "Mantenimiento Preventivo",
    relacionado_texto: "Presurizadores",
    subcategoria: "Revisión mensual de presión",
    descripcion: "Se verifican presiones nominales del sistema.",
    observaciones: "Ninguna anomalía detectada.",
    notas_adicionales: "Falta stock de aceite para la siguiente visita.",
    origen_registro: "", // Vendrá vacío a propósito para forzar el default 'Web técnico'
    es_excepcion: false,
    motivo_excepcion: "",
    visible_en_informe: true,
    periodo_informe: "Abril 2026",
    // Testeando que los limpie y cuente:
    equipos_texto: " PRES-01-A ,  PRES-02-R , , PRES-03-A-R " 
  };
  
  Logger.log("Iniciando prueba de inserción en Inbox...");
  var resultado = registrarEnInbox(datosDePruebaMokeados);
  Logger.log("Resultado de la inserción: " + JSON.stringify(resultado));
}

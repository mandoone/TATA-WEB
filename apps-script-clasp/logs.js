/**
 * Archivo: logs.js
 * Persiste logs estructurados del pipeline en la hoja `logs_pipeline`.
 */

function appendPipelineLog(logObj) {
  try {
    // Siempre registrar en consola para trazabilidad completa
    Logger.log(JSON.stringify(logObj));

    // El filtro aplica solo a persistencia en hoja
    if (logObj.evento !== "pipeline_fin" && logObj.evento !== "pipeline_error") {
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("logs_pipeline");

    if (!sheet) {
      sheet = ss.insertSheet("logs_pipeline");
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["timestamp", "evento", "paso", "funcion", "detalle_json"]);
    }

    sheet.appendRow([
      logObj.ts || new Date().toISOString(),
      logObj.evento || "",
      logObj.paso !== undefined ? logObj.paso : "",
      logObj.funcion || "",
      JSON.stringify(logObj)
    ]);
  } catch (e) {
    Logger.log("appendPipelineLog error (no-op): " + e.message);
  }
}

/**
 * Archivo: historial_equipos.gs
 * Genera historial por equipo desde registro_detalle_equipos + registros_bd.
 */
function generarHistorialEquipos() {
  var sheetBD = getSheetByNameSafe("registros_bd");
  var sheetDetalle = getSheetByNameSafe("registro_detalle_equipos");
  var sheetHistorial = getSheetByNameSafe("historial_por_equipo");

  var lastRowDetalle = sheetDetalle.getLastRow();
  if (lastRowDetalle < DATA_START_ROW) {
    return { success: true, message: "No existen detalles de equipos procesados." };
  }

  var lastRowBD = sheetBD.getLastRow();
  if (lastRowBD < DATA_START_ROW) {
    return { success: true, message: "No existen registros maestros en BD para cruzar." };
  }

  var existingHistorialSet = {};
  var lastRowHist = sheetHistorial.getLastRow();
  if (lastRowHist >= DATA_START_ROW) {
    var dataHist = sheetHistorial.getRange(DATA_START_ROW, 1, lastRowHist - DATA_START_ROW + 1, 6).getValues();
    for (var h = 0; h < dataHist.length; h++) {
      var hCodEq = String(dataHist[h][0] || "").trim();
      var hFecha = String(dataHist[h][2] || "").trim();
      var hDesc = String(dataHist[h][5] || "").trim();
      if (hCodEq !== "") {
        existingHistorialSet[hCodEq + "###" + hFecha + "###" + hDesc] = true;
      }
    }
  }

  var bdMap = {};
  var dataBD = sheetBD.getRange(DATA_START_ROW, 1, lastRowBD - DATA_START_ROW + 1, 28).getValues();

  for (var k = 0; k < dataBD.length; k++) {
    var rId = String(dataBD[k][0] || "").trim();
    if (rId !== "") {
      bdMap[rId] = {
        fecha_ejecucion: dataBD[k][2],            // C
        tecnico: String(dataBD[k][6] || ""),      // G tecnico_principal_id
        tipo_trabajo: String(dataBD[k][8] || ""), // I tipo_trabajo_id
        relacionado: String(dataBD[k][9] || ""),  // J relacionado_id
        descripcion: String(dataBD[k][11] || ""), // L
        observaciones: String(dataBD[k][12] || "")// M
      };
    }
  }

  var batchProcessedSet = {};

  var dataDetalle = sheetDetalle.getRange(DATA_START_ROW, 1, lastRowDetalle - DATA_START_ROW + 1, 3).getValues();
  var targetDataHistorial = [];
  var filasProcesadas = 0;

  for (var i = 0; i < dataDetalle.length; i++) {
    var regId = String(dataDetalle[i][0] || "").trim();
    var codEq = String(dataDetalle[i][1] || "").trim();
    var equipId = String(dataDetalle[i][2] || "").trim();

    if (regId === "" || codEq === "") continue;

    var uniqueKey = codEq + "###" + regId;

    if (!batchProcessedSet[uniqueKey]) {
      var bdInfo = bdMap[regId];

      if (bdInfo) {
        var histKey = codEq + "###" + String(bdInfo.fecha_ejecucion || "").trim() + "###" + String(bdInfo.descripcion || "").trim();
        if (existingHistorialSet[histKey]) {
          batchProcessedSet[uniqueKey] = true;
          continue;
        }

        var nuevaFila = [
          codEq,                  // A codigo_equipo
          equipId,                // B equipo_id
          bdInfo.fecha_ejecucion, // C fecha_ejecucion
          bdInfo.tipo_trabajo,    // D tipo_trabajo
          bdInfo.relacionado,     // E relacionado
          bdInfo.descripcion,     // F descripcion
          bdInfo.observaciones,   // G observaciones
          bdInfo.tecnico          // H tecnico
        ];

        targetDataHistorial.push(nuevaFila);
        batchProcessedSet[uniqueKey] = true;
        filasProcesadas++;
      }
    }
  }

  if (targetDataHistorial.length > 0) {
    var nextRowHistorial = getSafeNextRow(sheetHistorial);
    sheetHistorial.getRange(nextRowHistorial, 1, targetDataHistorial.length, 8).setValues(targetDataHistorial);
  }

  return {
    success: true,
    nuevos_historiales: filasProcesadas,
    message: "Se integraron exitosamente " + filasProcesadas + " líneas históricas."
  };
}

function testGenerarHistorialEquipos() {
  var res = generarHistorialEquipos();
  Logger.log(JSON.stringify(res));
}
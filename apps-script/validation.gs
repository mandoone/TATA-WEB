/**
 * Archivo: validation.gs
 * Extrae a Validación (16 Columnas, añadiendo periodo_informe).
 */

var DATA_START_ROW = 4;

function getValidationMaxId(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNumber = 0;
  if (lastRow >= DATA_START_ROW) {
    var idsRange = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
    for (var i = 0; i < idsRange.length; i++) {
      var cellValue = String(idsRange[i][0] || "").trim();
      var match = cellValue.match(/REG-VAL-(\d+)/);
      if (match && match[1]) {
        var currentNum = parseInt(match[1], 10);
        if (currentNum > maxNumber) {
          maxNumber = currentNum;
        }
      }
    }
  }
  return maxNumber;
}

function generateValidationId(numericId) {
  var paddedNumber = ("000000" + numericId).slice(-6);
  return "REG-VAL-" + paddedNumber;
}

function procesarInboxPendiente() {
  var sheetInbox = getSheetByNameSafe("registros_inbox");
  var sheetValidacion = getSheetByNameSafe("registros_validacion");
  
  var lastRowInbox = sheetInbox.getLastRow();
  if (lastRowInbox < DATA_START_ROW) {
    return { success: true, message: "No hay registros pendientes." };
  }
  
  var rangeInbox = sheetInbox.getRange(DATA_START_ROW, 1, lastRowInbox - DATA_START_ROW + 1, 22); 
  var dataInbox = rangeInbox.getValues();
  
  var filasProcesadas = 0;
  var targetDataValidacion = [];
  var filasAActualizarInbox = []; 
  var idCounter = getValidationMaxId(sheetValidacion);
  
  for (var i = 0; i < dataInbox.length; i++) {
    var row = dataInbox[i];
    var idInbox = String(row[0] || "").trim();
    if (idInbox === "") continue;
    
    var estadoInboxActual = String(row[15] || "").trim(); // Columna P
    
    if (estadoInboxActual === "Pendiente") {
      var fechaEjecucion     = row[2];                      
      var sedeId             = String(row[4]  || "").trim();
      var sectorId           = String(row[5]  || "").trim();
      var tecnicoPrincipal   = String(row[6]  || "").trim();
      var tipoTrabajo        = String(row[8]  || "").trim();
      var relacionado        = String(row[9]  || "").trim();
      var subcategoria       = String(row[10] || "").trim();
      var descripcion        = String(row[11] || "").trim();
      var observaciones      = String(row[12] || "").trim();
      var periodoInforme     = String(row[19] || "").trim();  // <- Rescatamos periodo desde INBOX Col T
      var equiposTexto       = String(row[20] || "").trim();
      var cantidadEquipos    = parseInt(row[21] || 0, 10);
      
      var faltantes = [];
      if (!tecnicoPrincipal) faltantes.push("Técnico Principal");
      if (!tipoTrabajo) faltantes.push("Tipo de Trabajo");
      if (!relacionado) faltantes.push("Relacionado");
      if (!equiposTexto) faltantes.push("Equipos");
      
      var nuevoEstadoAprobacion = "Validado";
      var comentarioValidacion = "";
      if (faltantes.length > 0) {
        nuevoEstadoAprobacion = "Por verificar";
        comentarioValidacion = "Falta info: " + faltantes.join(", ");
      }
      
      idCounter++;
      var idValidacion = generateValidationId(idCounter);
      
      // Nueva Fila con 16 Dimensiones incluyendo periodo_informe
      var nuevaFila = [
        idValidacion,            // 1
        idInbox,                 // 2
        fechaEjecucion,          // 3
        sedeId,                  // 4
        sectorId,                // 5
        "",                      // 6
        "",                      // 7
        "",                      // 8
        subcategoria,            // 9
        descripcion,             // 10
        observaciones,           // 11
        nuevoEstadoAprobacion,   // 12
        comentarioValidacion,    // 13
        periodoInforme,          // 14 <-- Evita pérdida de periodo
        equiposTexto,            // 15
        cantidadEquipos          // 16
      ];
      
      targetDataValidacion.push(nuevaFila);
      // Offset adaptado a DATA_START_ROW
      filasAActualizarInbox.push(i + DATA_START_ROW);
      filasProcesadas++;
    }
  }
  
  if (filasProcesadas > 0) {
    var nextRowValidacion = getSafeNextRow(sheetValidacion);
    var validacionRange = sheetValidacion.getRange(nextRowValidacion, 1, targetDataValidacion.length, 16);
    validacionRange.setValues(targetDataValidacion);
    
    for (var j = 0; j < filasAActualizarInbox.length; j++) {
      sheetInbox.getRange(filasAActualizarInbox[j], 16).setValue("Procesado");
    }
  }
  
  return { success: true, procesados: filasProcesadas };
}

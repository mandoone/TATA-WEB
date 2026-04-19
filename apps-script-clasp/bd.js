/**
 * Archivo: bd.gs
 * Lee de validación y consolida en 'registros_bd' (28 Columnas).
 */

var DATA_START_ROW = 4;

function getBdMaxId(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNumber = 0;
  if (lastRow >= DATA_START_ROW) {
    var idsRange = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
    for (var i = 0; i < idsRange.length; i++) {
      var cellValue = String(idsRange[i][0] || "").trim();
      var match = cellValue.match(/^REG-(\d+)$/);
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

function generateBdId(numericId) {
  return "REG-" + ("000000" + numericId).slice(-6);
}

function procesarValidacionA_BD() {
  var sheetValidacion = getSheetByNameSafe("registros_validacion");
  var sheetBD = getSheetByNameSafe("registros_bd");

  var lastRowV = sheetValidacion.getLastRow();
  if (lastRowV < DATA_START_ROW) {
    return { success: true, message: "No hay registros en validación." };
  }

  // Extraer las 16 columnas estipuladas de registros_validacion
  var rangeV = sheetValidacion.getRange(DATA_START_ROW, 1, lastRowV - DATA_START_ROW + 1, 16);
  var dataV = rangeV.getValues();

  var existingInboxIds = {};
  var lastRowBD = sheetBD.getLastRow();
  if (lastRowBD >= DATA_START_ROW) {
    // Columna AA es la 27
    var bdInboxRefs = sheetBD.getRange(DATA_START_ROW, 27, lastRowBD - DATA_START_ROW + 1, 1).getValues();
    for (var k = 0; k < bdInboxRefs.length; k++) {
      var ref = String(bdInboxRefs[k][0] || "").trim();
      if (ref !== "") {
        existingInboxIds[ref] = true;
      }
    }
  }

  var filasProcesadas = 0;
  var targetDataBD = [];
  var filasAActualizarValidacion = [];
  var idCounter = getBdMaxId(sheetBD);
  var tsActual = getCurrentTimestamp();

  for (var i = 0; i < dataV.length; i++) {
    var row = dataV[i];
    var estadoValidacionActual = String(row[11] || "").trim(); // índice 11 = Col 12

    // Ignorar cualquier fila con estado "Pendiente", "Rechazado", "Por verificar" o vacío.
    // Solo procesar si estrictamente es "Validado".
    if (estadoValidacionActual !== "Validado") {
      continue; // Salta a la siguiente fila ignorando esta
    }

    var idInbox = String(row[1] || "").trim(); // registro_inbox_id original

    // Evitar duplicación
    if (idInbox !== "" && existingInboxIds[idInbox]) {
      filasAActualizarValidacion.push(i + DATA_START_ROW);
      continue;
    }

    var fechaEjecucion = row[2];
    var sedeId = String(row[3] || "").trim();
    var sectorId = String(row[4] || "").trim();
    var tecnicoPrincipal = String(row[5] || "").trim();
    var tipoTrabajo = String(row[6] || "").trim();
    var relacionado = String(row[7] || "").trim();
    var subcategoria = String(row[8] || "").trim();
    var descripcion = String(row[9] || "").trim();
    var observaciones = String(row[10] || "").trim();
    var periodoInforme = String(row[13] || "").trim(); // índice 13 (columna N)
    var equiposTexto = String(row[14] || "").trim(); // índice 14 (columna O)
    var cantidadEquipos = parseInt(row[15] || 0, 10);   // índice 15 (columna P)

    idCounter++;
    var idBd = generateBdId(idCounter);

    // Construir la estructura final de BD (28 Columnas)
    var nuevaFilaBD = [
      idBd,                    // 1
      tsActual,                // 2
      fechaEjecucion,          // 3
      "",                      // 4
      sedeId,                  // 5
      sectorId,                // 6
      tecnicoPrincipal,        // 7
      "",                      // 8
      tipoTrabajo,             // 9
      relacionado,             // 10
      subcategoria,            // 11
      descripcion,             // 12
      observaciones,           // 13
      "",                      // 14
      "Sistema",               // 15
      "Validado",              // 16
      false,                   // 17
      "",                      // 18
      "Sistema",               // 19
      tsActual,                // 20
      "",                      // 21
      "",                      // 22
      true,                    // 23
      periodoInforme,          // 24 <-- Se rescata y preserva
      equiposTexto,            // 25
      cantidadEquipos,         // 26
      idInbox,                 // 27 <-- registro_inbox_id_ref
      false                    // 28 <-- detalle_generado seteado en false por defecto
    ];

    targetDataBD.push(nuevaFilaBD);
    filasAActualizarValidacion.push(i + DATA_START_ROW);
    filasProcesadas++;
  }

  if (filasProcesadas > 0) {
    var nextRowBD = getSafeNextRow(sheetBD);
    var bdRange = sheetBD.getRange(nextRowBD, 1, targetDataBD.length, 28);
    bdRange.setValues(targetDataBD);

    for (var j = 0; j < filasAActualizarValidacion.length; j++) {
      // Escribimos en estado_validacion de Validation que es columna 12 (L)
      sheetValidacion.getRange(filasAActualizarValidacion[j], 12).setValue("Procesado");
    }
  }

  return { success: true, procesados: filasProcesadas };
}

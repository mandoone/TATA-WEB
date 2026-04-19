/**
 * Archivo: detalle_equipos.gs
 * Desagrega equipos desde registros_bd a registro_detalle_equipos.
 */
function procesarDetalleEquipos() {
  var sheetBD = getSheetByNameSafe("registros_bd");
  var sheetDetalle = getSheetByNameSafe("registro_detalle_equipos");

  var lastRowBD = sheetBD.getLastRow();
  if (lastRowBD < DATA_START_ROW) {
    return { success: true, message: "No existen registros maestros." };
  }

  var dataBD = sheetBD.getRange(DATA_START_ROW, 1, lastRowBD - DATA_START_ROW + 1, 28).getValues();

  var filasProcesadasBD = 0;
  var targetDataDetalle = [];
  var filasAActualizarBD = [];

  for (var i = 0; i < dataBD.length; i++) {
    var row = dataBD[i];
    var registroId = String(row[0] || "").trim();
    if (registroId === "") continue;

    var detalleGenerado = String(row[27] || "").trim().toLowerCase(); // AB

    if (detalleGenerado !== "true") {
      if (row[24] instanceof Date || (!isNaN(Number(row[24])) && String(row[24]).trim() !== "")) {
        filasAActualizarBD.push(i + DATA_START_ROW);
        continue;
      }
      var equiposTextoBruto = String(row[24] || ""); // Y
      var equiposLimpios = cleanEquipmentText(equiposTextoBruto);

      if (equiposLimpios.length > 0) {
        var arrEquipos = equiposLimpios.split(",");
        for (var e = 0; e < arrEquipos.length; e++) {
          var codigoEquipo = arrEquipos[e].trim();
          if (codigoEquipo !== "") {
            var observacion = String(row[12] || "").trim();

            var filaDetalle = [
              registroId,   // A registro_id
              codigoEquipo, // B codigo_equipo_texto
              "",           // C equipo_id
              observacion   // D observacion
            ];
            targetDataDetalle.push(filaDetalle);
          }
        }
      }

      filasAActualizarBD.push(i + DATA_START_ROW);
      filasProcesadasBD++;
    }
  }

  if (targetDataDetalle.length > 0) {
    var nextRowDetalle = getSafeNextRow(sheetDetalle);
    sheetDetalle.getRange(nextRowDetalle, 1, targetDataDetalle.length, 4).setValues(targetDataDetalle);
  }

  if (filasAActualizarBD.length > 0) {
    for (var j = 0; j < filasAActualizarBD.length; j++) {
      sheetBD.getRange(filasAActualizarBD[j], 28).setValue(true); // AB detalle_generado
    }
  }

  return {
    success: true,
    procesados_bd: filasProcesadasBD,
    equipos_agregados: targetDataDetalle.length
  };
}

function testProcesarDetalleEquipos() {
  var res = procesarDetalleEquipos();
  Logger.log(JSON.stringify(res));
}
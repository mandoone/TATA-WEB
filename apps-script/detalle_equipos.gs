/**
 * Archivo: detalle_equipos.gs
 * Módulo de desagregación adaptado a BD de 28 Columnas desde Fila 4.
 */

var DATA_START_ROW = 4;

function procesarDetalleEquipos() {
  var sheetBD = getSheetByNameSafe("registros_bd");
  var sheetDetalle = getSheetByNameSafe("registro_detalle_equipos");
  
  var lastRowBD = sheetBD.getLastRow();
  if (lastRowBD < DATA_START_ROW) {
    return { success: true, message: "No existen registros maestros." };
  }
  
  // Extendemos la lectura a las nuevas 28 columnas (AB)
  var rangeBD = sheetBD.getRange(DATA_START_ROW, 1, lastRowBD - DATA_START_ROW + 1, 28);
  var dataBD = rangeBD.getValues();
  
  var filasProcesadasBD = 0;
  var targetDataDetalle = [];
  var filasAActualizarBD = [];
  
  for (var i = 0; i < dataBD.length; i++) {
    var row = dataBD[i];
    var registroId = String(row[0] || "").trim(); // ID referencial
    if (registroId === "") continue;
    
    // Analizamos la nueva columna 28 de detalle_generado (Índice 27)
    var detalleGenerado = String(row[27] || "").trim().toLowerCase();
    
    if (detalleGenerado !== "true") {
      // equipos_texto permanece en el índice 24 (Columna Y)
      var equiposTextoBruto = String(row[24] || ""); 
      var equiposLimpios = cleanEquipmentText(equiposTextoBruto);
      
      if (equiposLimpios.length > 0) {
        var arrEquipos = equiposLimpios.split(",");
        for (var e = 0; e < arrEquipos.length; e++) {
          var codigoEquipo = arrEquipos[e].trim();
          
          if (codigoEquipo !== "") {
            var filaDetalle = [
              registroId,       // 1. registro_id 
              codigoEquipo,     // 2. codigo_equipo_texto 
              "",               // 3. equipo_id
              ""                // 4. observacion
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
    var detalleRange = sheetDetalle.getRange(nextRowDetalle, 1, targetDataDetalle.length, 4);
    detalleRange.setValues(targetDataDetalle);
  }
  
  if (filasAActualizarBD.length > 0) {
    for (var j = 0; j < filasAActualizarBD.length; j++) {
      // Impactamos directamente a 'true' booleano string en la Columna 28 (AB)
      sheetBD.getRange(filasAActualizarBD[j], 28).setValue(true);
    }
  }
  
  return { success: true, procesados_bd: filasProcesadasBD, equipos_agregados: targetDataDetalle.length };
}

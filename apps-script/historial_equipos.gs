/**
 * Archivo: historial_equipos.gs
 * Propósito: Genera la trazabilidad y cruce consolidado de historial por equipo
 * uniendo la tabla de 'registro_detalle_equipos' con los metadatos troncales
 * de la Base de Datos ('registros_bd').
 * 
 * NOTA: La estructura de historial_por_equipo se adaptó exactamente al modelo real de 8 columnas.
 */

var DATA_START_ROW = 4;

/**
 * Función principal encargada de construir el historial unificado.
 * Opera 100% en lote usando Mapas en tiempo de ejecución de Apps Script 
 * y no requiere formulas de Google Sheets como BUSCARV (VLOOKUP).
 * 
 * @returns {Object} Resumen descriptivo de los registros unificados.
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
  
  // 1. Cargar la Base de Datos completa en memoria (Hash Map) pidiendo puntualmente los datos extraídos
  var bdMap = {};
  var dataBD = sheetBD.getRange(DATA_START_ROW, 1, lastRowBD - DATA_START_ROW + 1, 28).getValues();
  
  for (var k = 0; k < dataBD.length; k++) {
    var rId = String(dataBD[k][0] || "").trim();
    if (rId !== "") {
      bdMap[rId] = {
        fecha_ejecucion: dataBD[k][2],              // Col C (Índice 2)
        tecnico: String(dataBD[k][6] || ""),        // Col G (tecnico_principal_id)
        tipo_trabajo: String(dataBD[k][8] || ""),   // Col I (tipo_trabajo_id)
        relacionado: String(dataBD[k][9] || ""),    // Col J (relacionado_id)
        descripcion: String(dataBD[k][11] || ""),   // Col L (Índice 11)
        observaciones: String(dataBD[k][12] || "")  // Col M (Índice 12)
      };
    }
  }
  
  // 2. Set en Memoria para prevención de Duplicidad en el Batch usando ID de Cruce local
  var bachtProcessedSet = {};
  
  // 3. Procesar fila por fila desde la tabla de detalles generados (extrayendo Col A, Col B y Col C)
  var dataDetalle = sheetDetalle.getRange(DATA_START_ROW, 1, lastRowDetalle - DATA_START_ROW + 1, 3).getValues();
  var targetDataHistorial = [];
  var filasProcesadas = 0;
  
  for (var i = 0; i < dataDetalle.length; i++) {
    var regId = String(dataDetalle[i][0] || "").trim(); // registro_id del detalle
    var codEq = String(dataDetalle[i][1] || "").trim(); // codigo_equipo_texto del detalle
    var equipId = String(dataDetalle[i][2] || "").trim(); // equipo_id del detalle
    
    if (regId === "" || codEq === "") continue;
    
    // Llave de chequeo contra duplicados múltiples del mismo equipo en un mismo registro
    var uniqueKey = codEq + "###" + regId;
    
    if (!bachtProcessedSet[uniqueKey]) {
      
      // Buscar información complementaria en nuestra foto de la BD
      var bdInfo = bdMap[regId];
      
      if (bdInfo) {
        // Construcción de la Fila alineada a las 8 columnas requeridas explícitamente
        var nuevaFila = [
          codEq,                  // 1. codigo_equipo
          equipId,                // 2. equipo_id (rescatado desde detalle)
          bdInfo.fecha_ejecucion, // 3. fecha_ejecucion
          bdInfo.tipo_trabajo,    // 4. tipo_trabajo
          bdInfo.relacionado,     // 5. relacionado
          bdInfo.descripcion,     // 6. descripcion
          bdInfo.observaciones,   // 7. observaciones
          bdInfo.tecnico          // 8. tecnico
        ];
        
        targetDataHistorial.push(nuevaFila);
        
        // Bloqueamos la llave para no imprimir duplicados si el input base está corrupto
        bachtProcessedSet[uniqueKey] = true;
        filasProcesadas++;
      }
    }
  }
  
  // 4. Inyección a tabla transaccional definitiva en un solo request por eficiencia
  if (targetDataHistorial.length > 0) {
    var nextRowHistorial = getSafeNextRow(sheetHistorial);
    var histRange = sheetHistorial.getRange(nextRowHistorial, 1, targetDataHistorial.length, 8);
    histRange.setValues(targetDataHistorial);
  }
  
  return { 
    success: true, 
    nuevos_historiales: filasProcesadas,
    message: "Se integraron exitosamente " + filasProcesadas + " líneas históricas al sistema cruzado."
  };
}

/**
 * Función de Prueba manual.
 */
function testGenerarHistorialEquipos() {
  Logger.log("Ejecutando consolidación del Historial de Equipos...");
  var res = generarHistorialEquipos();
  Logger.log("Resultado: " + JSON.stringify(res));
}

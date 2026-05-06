/**
 * Utilidad temporal para purgar registros antiguos heredados del sistema de fórmulas.
 * Borra valores y fórmulas desde la fila 4 hacia abajo.
 * Protege estrictamente filas 1, 2 y 3, así como todo el formato preexistente.
 */
function purgarDatosAntiguosBackend() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const hojasALimpiar = [
    'registros_validacion',
    'registros_bd',
    'registro_detalle_equipos',
    'historial_por_equipo'
  ];

  hojasALimpiar.forEach(nombreHoja => {
    const hoja = ss.getSheetByName(nombreHoja);

    if (!hoja) {
      Logger.log(`⚠️ No se encontró la hoja: ${nombreHoja}`);
      return;
    }

    const ultimaFila = hoja.getLastRow();
    const ultimaColumna = hoja.getLastColumn();

    if (ultimaFila >= 4 && ultimaColumna >= 1) {
      const rangoObjetivo = hoja.getRange(4, 1, ultimaFila - 3, ultimaColumna);
      rangoObjetivo.clearContent();
      Logger.log(`✅ Hoja purgada con éxito: ${nombreHoja}`);
    } else {
      Logger.log(`ℹ️ Hoja sin datos para limpiar: ${nombreHoja}`);
    }
  });

  Logger.log('🚀 PURGA FINALIZADA');
}

function corregirHeadersRegistrosValidacion() {
  var sheet = getSheetByNameSafe("registros_validacion");
  if (!sheet) {
    Logger.log("La hoja registros_validacion no existe.");
    return;
  }

  var headers = [
    "registro_validacion_id",
    "registro_inbox_id",
    "fecha_ejecucion",
    "sede_id",
    "sector_id",
    "tecnico_principal_texto",
    "tipo_trabajo_texto",
    "relacionado_texto",
    "subcategoria",
    "descripcion",
    "observaciones",
    "estado_validacion",
    "comentario_validacion",
    "periodo_informe",
    "equipos_texto",
    "cantidad_equipos"
  ];

  sheet.getRange(3, 1, 1, headers.length).setValues([headers]);
}

function limpiarPipelineOperativo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = [
    "registros_inbox",
    "registros_validacion",
    "registros_bd",
    "registro_detalle_equipos",
    "historial_por_equipo"
  ];
  
  hojas.forEach(function(nombreHoja) {
    var hoja = ss.getSheetByName(nombreHoja);
    
    if (!hoja) {
      return;
    }
    
    var lastRow = hoja.getLastRow();
    var lastCol = hoja.getLastColumn();
    
    if (lastRow >= 4 && lastCol >= 1) {
      hoja.getRange(4, 1, lastRow - 3, lastCol).clearContent();
      Logger.log("Limpiada la hoja: " + nombreHoja);
    }
  });
}

function configurarDropdownEstadosValidacion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("registros_validacion");
  
  if (!sheet) {
    Logger.log("La hoja registros_validacion no existe.");
    return;
  }
  
  var rango = sheet.getRange(4, 12, 1000, 1);
  
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pendiente", "Validado", "Rechazado", "Procesado"], true)
    .setAllowInvalid(false)
    .build();
    
  rango.setDataValidation(rule);
  Logger.log("Dropdown configurado en registros_validacion columna L.");
}

function formatearHojasOperativas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = [
    "registros_inbox",
    "registros_validacion",
    "registros_bd",
    "registro_detalle_equipos",
    "historial_por_equipo"
  ];
  
  hojas.forEach(function(nombreHoja) {
    var hoja = ss.getSheetByName(nombreHoja);
    
    if (!hoja) return;
    
    var lastCol = hoja.getLastColumn();
    if (lastCol < 1) lastCol = 20; // Ancho por defecto si no hay nada
    
    // 2. Formatear fila 3 (Encabezados)
    var headerRange = hoja.getRange(3, 1, 1, lastCol);
    headerRange.setBackground("#0b5394"); // Azul fuerte
    headerRange.setFontColor("#ffffff");  // Blanco
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setWrap(true);
    
    // 3. Formatear desde fila 4 hacia abajo (rango de 500 filas)
    var numFilas = 500;
    var bgColors = [];
    
    for (var r = 0; r < numFilas; r++) {
      var rowColors = [];
      // Fila par en la hoja de cálculo (ej. Fila 4, 6) corresponde a r par (0, 2)
      var color = (r % 2 === 0) ? "#e3f2fd" : "#bbdefb"; 
      for (var c = 0; c < lastCol; c++) {
        rowColors.push(color);
      }
      bgColors.push(rowColors);
    }
    
    var dataRange = hoja.getRange(4, 1, numFilas, lastCol);
    dataRange.setBackgrounds(bgColors);
    dataRange.setFontColor("#000000");  // Texto negro
    dataRange.setFontWeight("normal");  // Sin negrita
    dataRange.setBorder(false, false, false, false, false, false); // Sin bordes
    // Restablecer alineación (left es normal)
    dataRange.setHorizontalAlignment("left");
    dataRange.setVerticalAlignment("middle");
    
    Logger.log("Hoja formateada exitosamente con franjas: " + nombreHoja);
  });
}

function configurarFormatosColumnasCriticas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojasConfig = {
    "registros_inbox": [
      { col: 2, formato: "dd/mm/yyyy" }, // B
      { col: 3, formato: "dd/mm/yyyy" }, // C
      { col: 20, formato: "@" }          // T
    ],
    "registros_validacion": [
      { col: 3, formato: "dd/mm/yyyy" }, // C
      { col: 14, formato: "@" }          // N
    ],
    "registros_bd": [
      { col: 2, formato: "dd/mm/yyyy" }, // B
      { col: 3, formato: "dd/mm/yyyy" }, // C
      { col: 20, formato: "dd/mm/yyyy" },// T
      { col: 24, formato: "@" }          // X
    ]
  };

  for (var nombreHoja in hojasConfig) {
    var hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) continue;

    var maxRows = hoja.getMaxRows();
    if (maxRows < 4) maxRows = 1000;

    var configs = hojasConfig[nombreHoja];
    for (var i = 0; i < configs.length; i++) {
      var col = configs[i].col;
      var formato = configs[i].formato;
      var rango = hoja.getRange(4, col, maxRows - 3, 1);
      rango.setNumberFormat(formato);
    }
    Logger.log("Formatos aplicados en: " + nombreHoja);
  }
}

/**
 * Función segura para limpiar filas de prueba generadas por testPipelineE2EControlado().
 * No usar clearContent masivo, sino borrado quirúrgico de abajo hacia arriba.
 */
function limpiarDatosDePrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = [
    "registros_inbox",
    "registros_validacion",
    "registros_bd",
    "registro_detalle_equipos",
    "historial_por_equipo"
  ];
  
  var totalEliminado = 0;
  
  hojas.forEach(function(nombreHoja) {
    var hoja = ss.getSheetByName(nombreHoja);
    if (!hoja) return; // Ignora hojas inexistentes sin romper ejecución
    
    var lastRow = hoja.getLastRow();
    var lastCol = hoja.getLastColumn();
    
    if (lastRow < 4 || lastCol < 1) {
      return; // No hay datos
    }
    
    var data = hoja.getRange(4, 1, lastRow - 3, lastCol).getValues();
    var filasEliminadas = 0;
    
    // Recorrer de abajo hacia arriba para evitar saltos de índice
    for (var i = data.length - 1; i >= 0; i--) {
      var row = data[i];
      var esPrueba = false;
      
      for (var j = 0; j < row.length; j++) {
        var cellValue = String(row[j] || "").trim();
        // Criterio exacto: contiene un valor de texto que comience con "TEST_" o "TEST-"
        if (cellValue.indexOf("TEST_") === 0 || cellValue.indexOf("TEST-") === 0) {
          esPrueba = true;
          break;
        }
      }
      
      if (esPrueba) {
        var filaReal = i + 4; // Índice en arreglo (0) + 4 (fila inicio) = 4
        hoja.deleteRow(filaReal);
        filasEliminadas++;
      }
    }
    
    totalEliminado += filasEliminadas;
    Logger.log("Hoja: " + nombreHoja + " | Filas eliminadas: " + filasEliminadas);
  });
  
  Logger.log("TOTAL ELIMINADO en todas las hojas: " + totalEliminado + " filas.");
}

/**
 * Crea la hoja 'equipos_maestro' si no existe.
 * Prepara los encabezados en la fila 3 dejando filas 1 y 2 para uso futuro.
 */
function crearHojaEquiposMaestro() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nombreHoja = "equipos_maestro";
  var hoja = ss.getSheetByName(nombreHoja);
  
  var headers = [
    "codigo_equipo",
    "equipo_id",
    "nombre_equipo",
    "sede_id",
    "sector_id",
    "tipo_equipo",
    "estado",
    "observaciones"
  ];

  if (hoja) {
    Logger.log("La hoja '" + nombreHoja + "' ya existe. No se recreó.");
    return;
  }
  
  hoja = ss.insertSheet(nombreHoja);
  Logger.log("Hoja '" + nombreHoja + "' creada exitosamente.");
  
  hoja.getRange(3, 1, 1, headers.length).setValues([headers]);
  Logger.log("Headers aplicados en fila 3: " + headers.join(", "));
}
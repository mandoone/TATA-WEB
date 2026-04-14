/**
 * Archivo: utils.gs
 * Propósito: Funciones de utilidad general y utilidades repetibles.
 * Adaptado a la estructura donde Fila 1=Nota, Fila 2="Encabezados", 
 * Fila 3=Headers Reales, y Fila 4=INCIO DE DATOS.
 */

var DATA_START_ROW = 4;

function getSheetByNameSafe(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("ERROR: No se encontró la hoja requerida: '" + sheetName + "'. Verifica que exista en este archivo.");
  }
  return sheet;
}

function generateInboxId(sheet) {
  var lastRow = sheet.getLastRow();
  var maxNumber = 0;
  
  if (lastRow >= DATA_START_ROW) {
    // Obtenemos a partir de la fila 4
    var idsRange = sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 1).getValues();
    for (var i = 0; i < idsRange.length; i++) {
      var cellValue = String(idsRange[i][0] || "").trim();
      var match = cellValue.match(/REG-INBOX-(\d+)/);
      if (match && match[1]) {
        var currentNum = parseInt(match[1], 10);
        if (currentNum > maxNumber) {
          maxNumber = currentNum;
        }
      }
    }
  }
  
  var newNumber = maxNumber + 1;
  var paddedNumber = ("000000" + newNumber).slice(-6);
  return "REG-INBOX-" + paddedNumber;
}

function getCurrentTimestamp() {
  return new Date();
}

function cleanEquipmentText(text) {
  if (!text) return "";
  var arr = String(text).split(/[,;\n\r]+/);
  var cleanedArr = [];
  
  for (var i = 0; i < arr.length; i++) {
    var item = arr[i].replace(/\s+/g, ' ').trim();
    if (item.length > 0) {
      cleanedArr.push(item);
    }
  }
  return cleanedArr.join(", ");
}

function countEquipment(text) {
  if (!text || String(text).trim() === "") return 0;
  var cleanStr = cleanEquipmentText(text);
  if (cleanStr === "") return 0;
  return cleanStr.split(",").length;
}

/**
 * Utilidad que retorna de forma segura en qué fila se debe insertar
 * el siguiente elemento, respetando que nunca baje de la DATA_START_ROW.
 */
function getSafeNextRow(sheet) {
  var lastRow = sheet.getLastRow();
  return lastRow < (DATA_START_ROW - 1) ? DATA_START_ROW : lastRow + 1;
}

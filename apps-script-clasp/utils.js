/**
 * Archivo: utils.gs
 * Propósito: Funciones de utilidad general y utilidades repetibles.
 * Adaptado a la estructura donde Fila 1=Nota, Fila 2="Encabezados",
 * Fila 3=Headers Reales, y Fila 4=INICIO DE DATOS.
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
  var props = PropertiesService.getScriptProperties();
  var storedId = props.getProperty("LAST_INBOX_ID");
  var maxNumber = 0;

  if (storedId) {
    maxNumber = parseInt(storedId, 10);
  } else {
    // Inicialización segura: si la propiedad no existe, busca el mayor en la hoja actual
    var lastRow = sheet.getLastRow();
    if (lastRow >= DATA_START_ROW) {
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
  }

  var newNumber = maxNumber + 1;
  props.setProperty("LAST_INBOX_ID", newNumber.toString());

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

function getSafeNextRow(sheet) {
  var lastRow = sheet.getLastRow();
  return lastRow < (DATA_START_ROW - 1) ? DATA_START_ROW : lastRow + 1;
}

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
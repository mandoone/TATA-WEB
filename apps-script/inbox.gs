/**
 * Archivo: inbox.gs
 * Flujo de inserción adaptado a DATA_START_ROW = 4.
 */

var DATA_START_ROW = 4;

function registrarEnInbox(data) {
  var sheet = getSheetByNameSafe("registros_inbox");
  var newId = generateInboxId(sheet);
  var equiposTextoLimpio = cleanEquipmentText(data.equipos_texto);
  var cantidadEquipos = countEquipment(equiposTextoLimpio);
  var fechaRegistro = getCurrentTimestamp(); 
  var estadoValidacion = "Pendiente"; 
  var origen = data.origen_registro ? data.origen_registro : "Web técnico";
  
  // 22 Columnas
  var filaAInsertar = [
    newId,                                                  // Col A: registro_inbox_id
    fechaRegistro,                                          // Col B: fecha_registro
    data.fecha_ejecucion            || "",                  // Col C: fecha_ejecucion
    data.hora_ejecucion             || "",                  // Col D: hora_ejecucion
    data.sede_id                    || "",                  // Col E: sede_id
    data.sector_id                  || "",                  // Col F: sector_id
    data.tecnico_principal_texto    || "",                  // Col G: tecnico_principal_texto
    data.tecnico_secundario_texto   || "",                  // Col H: tecnico_secundario_texto
    data.tipo_trabajo_texto         || "",                  // Col I: tipo_trabajo_texto
    data.relacionado_texto          || "",                  // Col J: relacionado_texto
    data.subcategoria               || "",                  // Col K: subcategoria
    data.descripcion                || "",                  // Col L: descripcion
    data.observaciones              || "",                  // Col M: observaciones
    data.notas_adicionales          || "",                  // Col N: notas_adicionales
    origen,                                                 // Col O: origen_registro
    estadoValidacion,                                       // Col P: estado_validacion
    data.es_excepcion               || false,               // Col Q: es_excepcion
    data.motivo_excepcion           || "",                  // Col R: motivo_excepcion
    data.visible_en_informe !== undefined ? data.visible_en_informe : true, // Col S: visible_en_informe
    data.periodo_informe            || "",                  // Col T: periodo_informe
    equiposTextoLimpio,                                     // Col U: equipos_texto
    cantidadEquipos                                         // Col V: cantidad_equipos
  ];
  
  var nextRow = getSafeNextRow(sheet);
  var rangeToInsert = sheet.getRange(nextRow, 1, 1, filaAInsertar.length);
  rangeToInsert.setValues([filaAInsertar]);
  
  return {
    success: true,
    message: "Data recibida y registrada correctamente en Bandeja Inbox.",
    id: newId
  };
}

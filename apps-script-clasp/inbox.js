/**
 * Archivo: inbox.gs
 * Flujo de inserción adaptado a DATA_START_ROW = 4.
 */
function registrarEnInbox(data) {
  var sheet = getSheetByNameSafe("registros_inbox");
  var newId = generateInboxId(sheet);
  var equiposTextoLimpio = cleanEquipmentText(data.equipos_texto);
  var cantidadEquipos = countEquipment(equiposTextoLimpio);
  var fechaRegistro = getCurrentTimestamp();
  var estadoValidacion = "Pendiente";
  var origen = data.origen_registro ? data.origen_registro : "Web técnico";

  var filaAInsertar = [
    newId,                                                  // A registro_inbox_id
    fechaRegistro,                                          // B fecha_registro
    data.fecha_ejecucion            || "",                  // C fecha_ejecucion
    data.hora_ejecucion             || "",                  // D hora_ejecucion
    data.sede_id                    || "",                  // E sede_id
    data.sector_id                  || "",                  // F sector_id
    data.tecnico_principal_texto    || "",                  // G tecnico_principal_texto
    data.tecnico_secundario_texto   || "",                  // H tecnico_secundario_texto
    data.tipo_trabajo_texto         || "",                  // I tipo_trabajo_texto
    data.relacionado_texto          || "",                  // J relacionado_texto
    data.subcategoria               || "",                  // K subcategoria
    data.descripcion                || "",                  // L descripcion
    data.observaciones              || "",                  // M observaciones
    data.notas_adicionales          || "",                  // N notas_adicionales
    origen,                                                 // O origen_registro
    estadoValidacion,                                       // P estado_validacion
    data.es_excepcion               || false,               // Q es_excepcion
    data.motivo_excepcion           || "",                  // R motivo_excepcion
    data.visible_en_informe !== undefined ? data.visible_en_informe : true, // S visible_en_informe
    data.periodo_informe            || "",                  // T periodo_informe
    equiposTextoLimpio,                                     // U equipos_texto
    cantidadEquipos                                         // V cantidad_equipos
  ];

  var nextRow = getSafeNextRow(sheet);
  sheet.getRange(nextRow, 1, 1, filaAInsertar.length).setValues([filaAInsertar]);

  return {
    success: true,
    message: "Data recibida y registrada correctamente en registros_inbox.",
    id: newId
  };
}

function testIngresoManualInbox() {
  var datos = {
    fecha_ejecucion: "2026-04-14",
    hora_ejecucion: "10:30",
    sede_id: "SED-001",
    sector_id: "SEC-002",
    tecnico_principal_texto: "Ángel Montero",
    tecnico_secundario_texto: "",
    tipo_trabajo_texto: "Preventiva",
    relacionado_texto: "AA",
    subcategoria: "Preventiva UI",
    descripcion: "Prueba manual de ingreso a inbox.",
    observaciones: "Sin observaciones.",
    notas_adicionales: "",
    origen_registro: "",
    es_excepcion: false,
    motivo_excepcion: "",
    visible_en_informe: true,
    periodo_informe: "2026-04",
    equipos_texto: "UI-1.1, UI-1.2"
  };

  var resultado = registrarEnInbox(datos);
  Logger.log(JSON.stringify(resultado));
}
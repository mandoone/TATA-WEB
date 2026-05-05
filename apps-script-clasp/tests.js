/**
 * Archivo: tests.js
 * Pruebas automáticas controladas del pipeline. Solo inserta y verifica;
 * nunca borra datos existentes ni modifica triggers.
 */

/**
 * Prueba el tramo: registros_inbox -> runPipelineCompleto() -> registros_validacion.
 *
 * Estrategia de identificación:
 *   - El marcador TEST_PIPELINE_<ts> va en el campo `descripcion` del inbox.
 *   - registrarEnInbox() devuelve el inbox_id generado (REG-INBOX-XXXXXX).
 *   - Tras el pipeline, se busca ese inbox_id en la columna 2 de registros_validacion
 *     (col B, índice 1 base-0), que es donde validation.js escribe el id de origen.
 *
 * @returns {{ok, marcador, inbox_insertado, validacion_creada, fila_validacion,
 *            resumen_pipeline, errores}}
 */
function testInboxAValidacionControlado() {
  var resultado = {
    ok: false,
    marcador: "",
    inbox_insertado: false,
    validacion_creada: false,
    fila_validacion: null,
    resumen_pipeline: null,
    errores: []
  };

  try {
    // 1. Marcador único
    var marcador = "TEST_PIPELINE_" + new Date().getTime();
    resultado.marcador = marcador;

    // 2. Insertar en registros_inbox usando la función oficial del proyecto.
    //    visible_en_informe = false para no contaminar reportes reales.
    //    Todos los campos requeridos por validation.js están presentes para
    //    evitar el comentario "Falta info:" en registros_validacion.
    var datosPrueba = {
      fecha_ejecucion:           Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      hora_ejecucion:            "00:00",
      sede_id:                   "SED-TEST",
      sector_id:                 "SEC-TEST",
      tecnico_principal_texto:   "TEST_TECNICO",
      tecnico_secundario_texto:  "",
      tipo_trabajo_texto:        "Preventiva",
      relacionado_texto:         "TEST",
      subcategoria:              "Test Automatico",
      descripcion:               marcador,
      observaciones:             "",
      notas_adicionales:         "",
      origen_registro:           "Test automatico",
      es_excepcion:              false,
      motivo_excepcion:          "",
      visible_en_informe:        false,
      periodo_informe:           Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM"),
      equipos_texto:             "TEST-EQ-001"
    };

    var resInbox = registrarEnInbox(datosPrueba);
    if (!resInbox || !resInbox.success) {
      resultado.errores.push("registrarEnInbox falló: " + JSON.stringify(resInbox));
      Logger.log(JSON.stringify(resultado));
      return resultado;
    }
    resultado.inbox_insertado = true;
    var inboxId = resInbox.id;

    // 3. Ejecutar el pipeline completo
    var resumenPipeline = runPipelineCompleto();
    resultado.resumen_pipeline = resumenPipeline;

    // 4. Buscar el registro en registros_validacion por inbox_id (columna B = índice 1 base-0).
    //    validation.js escribe el inbox_id de origen en la posición 2 de cada fila nueva.
    var sheetVal = getSheetByNameSafe("registros_validacion");
    var lastRowVal = sheetVal.getLastRow();

    if (lastRowVal >= DATA_START_ROW) {
      var dataVal = sheetVal
        .getRange(DATA_START_ROW, 1, lastRowVal - DATA_START_ROW + 1, 2)
        .getValues();

      for (var i = 0; i < dataVal.length; i++) {
        if (String(dataVal[i][1] || "").trim() === inboxId) {
          resultado.validacion_creada = true;
          resultado.fila_validacion = i + DATA_START_ROW;
          break;
        }
      }
    }

    if (!resultado.validacion_creada) {
      resultado.errores.push(
        "No se encontró inbox_id=" + inboxId + " en registros_validacion."
      );
    }

    resultado.ok = resultado.inbox_insertado && resultado.validacion_creada;

  } catch (e) {
    resultado.errores.push("Excepción: " + e.message + (e.stack ? " | " + e.stack : ""));
  }

  Logger.log(JSON.stringify(resultado));
  return resultado;
}

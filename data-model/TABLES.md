# Estructura de Tablas Actual del Sistema

Dado que el sistema basa su persistencia en Google Sheets, a continuación se enlista de manera exhaustiva el esquema de tablas (hojas transaccionales y maestras) utilizadas.

## Hojas Críticas (Flujo de Aprobación)

1. **`registros_inbox`**
   - **Propósito:** Captura inicial "en crudo" (Raw Data) proveniente del origen WEB o los formularios técnicos.
   - **Columnas Sugeridas/Base:** ID Transacción, Timestamp Ingreso, Payload/JSON, Origen, Estado_Revision.

2. **`registros_validacion`**
   - **Propósito:** Buffer donde el sistema evalúa la validez de los datos del Inbox (ej: que el equipo no exista en estados anómalos o sufijos A/R equivocados). 
   - **Columnas Sugeridas/Base:** ID Transacción, Data Parseada (Módulo, Equipo, Solicitante), Observaciones/Errores, y Bandera de Aprobación.

3. **`registros_bd`** (Puede dividirse lógicamente o físicamente según Módulo)
   - **Propósito:** El core consolidado. Registro limpio, validado y que impacta al historial.

## Hojas Asociadas a Módulos Operativos

4. **`maestro_equipos`**
   - **Propósito:** El índice maestro irremplazable de equipos.
   - **Columnas Principales:** Nomenclatura del Equipo (IDs con sufijos A, R, o A-R), Tipo, Sub-Tipo, Estado_Historial (bool), y Atributos Específicos.

5. **`historial_equipo`**
   - **Propósito:** Agrupa y cruza el universo de incidencias de un equipo desde que ha sido inaugurado.
   - **Columnas Principales:** ID Equipo, Fecha Evento, ID Transacción, Acción Ejecutada.

6. **`planificacion`**
   - **Propósito:** Programación temporal de los mantenimientos preventivos a futuro. 

7. **`presurizador`**
   - **Propósito:** Control particular y especializado del Módulo de Presurizadores.
   - **Columnas Principales:** Mediciones, Niveles, Comprobaciones operativas.

8. **`puertas_caja_escala`**
   - **Propósito:** Hoja de control y chequeo de mantenciones al módulo de vías y puertas de escala de evacuación.
   - **Columnas Principales:** Identificador de puerta, Nivel, Test de cierre, entre otros reportes visuales.

9. **`correctivas` y `emergencias`**
   - **Propósito:** Registro detallado de intervenciones de naturaleza imprevisible (Fallos repentinos, incidentes externos, roturas).
   - **Columnas Principales:** Fecha Reporte, Nivel Crítico, Equipo(s) Afectado, Técnica Resolutiva.

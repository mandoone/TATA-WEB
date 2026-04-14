# Reglas de Desarrollo y Negocio (RULES)

Estas son normativas fundamentales para el diseño, operación y crecimiento del Sistema TCS. **Deberán respetarse sin excepción** para mantener la consistencia entre el Frontend, el Backend en Apps Script y nuestra BD en Sheets.

## 1. Nomenclatura de Equipos Críticos
El sistema maneja un control estricto del estado de las partes/equipos. El registro deberá considerar siempre los sufijos adecuados y su validación:
- **Sufijo 'A':** Define la parte/equipo [Condición A - Ej: Equipo Activo o Principal].
- **Sufijo 'R':** Define la parte/equipo [Condición R - Ej: Equipo de Reemplazo/Repuesto].
- **Sufijo 'A-R':** Empleado en contextos mixtos de mantenimiento de ambos o configuraciones transitorias.

## 2. Prohibición de Borrado de Historial
**El historial es sagrado.** Todo equipo que registre incidencias en su historial queda blindado en el Maestro de Equipos:
- Queda totalmente **PROHIBIDO borrar filas o IDs** de equipos del Maestro si este ya cuenta con un historial asociado de intervenciones.
- Si un equipo deba ser dado de baja, se modificará su `Estado` (Soft Delete), previendo un filtro en capa de vista, pero preservando los datos estadísticos y operacionales generados.

## 3. Flujo Restringido a Base de Datos
**Regla Estricta:** Ningún cliente o webhook web escribe directamente en las tablas consolidadas de producción. El ingreso **debe** transitar este flujo:
1. Recepción en `registros_inbox`.
2. Pase por filtro de `registros_validacion` (lógica backend, verificación de sufijos de equipos, IDs, datos obligatorios).
3. Confirmación de escritura y paso final a `registros_bd`.

## 4. Regla de Trabajo y Archivos
El ecosistema ya se encuentra operativo. 
- Al realizar implementaciones, **SIEMPRE se debe trabajar sobre el último archivo o base** validado/productivo, para que no ocurra un desfase (forking) de información. 
- Los desarrollos o refactorizaciones de las hojas en Sheets se adaptan a la estructura productiva viva.

## 5. Regla de Versionado
Todo cambio estructural en las Sheets (agregar columnas críticas) o despliegue de Apps Script debe quedar documentado en el `CHANGELOG.md` con su número de versión correspondiente.

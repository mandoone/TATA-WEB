# Modelo de Datos (Data Model)

## Descripción General
El modelo de datos se estructura alrededor del **Equipo** como entidad core. Alrededor del equipo pivotan diversas transacciones que representan mantenimientos y sucesos técnicos en el transcurso del tiempo. La concepción relacional de los datos permite extraer posteriormente Informes unificados o vistas estadísticas.

## Entorno Físico de Datos
Actualmente operamos sobre tablas virtuales en un entorno de **Google Sheets, administrado por Apps Script**. Google Sheets actúa de Repositorio o Base de Datos Relacional de factibilidad primaria. Las vinculaciones lógicas (Claves Foráneas, como el ID del equipo en una tabla de correctivas) dependen de validaciones programadas en Apps Script y no de la capa de visualización de Sheets.

## Clasificación de Tablas Principales

### Tablas Maestras
Archivan configuraciones fijas del sistema y el catálogo de activos. Estas hojas sufren escasas modificaciones una vez estabilizadas.
- **Ejemplo:** Maestro de Equipos, Listado de Usuarios/Técnicos.

### Tablas Transaccionales
Agrupan las incidencias o registros originados con alta recurrencia (inputs desde el formulario Web).
- **Ejemplo:** Las tablas del pipeline asíncrono (`registros_inbox`, `registros_validacion`, `registros_bd`) y las sub-tablas especializadas por módulo.

## Relaciones Clave e Integridad
- **Equipos ←→ Historial (1:N):** La cardinalidad más repetida; un solo equipo acumula N registros a lo largo del tiempo. 
- Por ende, si las tablas transaccionales en `registros_bd` referencian `Equipo_001`, este ID no podrá ser modificado o eliminado en el Maestro. El cruce es determinante para el módulo de "Historial por equipo".

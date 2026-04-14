# Sistema Integral de Gestión de Mantenciones TCS

## Resumen Ejecutivo del Proyecto
El proyecto consiste en la evolución y estructuración del Sistema Integral de Gestión de Mantenciones para TCS. No estamos partiendo desde cero: el sistema cuenta con una base operativa existente. El objetivo principal es optimizar el control, el registro y la trazabilidad de todos los equipos y las diferentes tareas (mantenimientos preventivos, correctivos, emergencias) centralizando la documentación y estructurando el avance tecnológico del desarrollo.

## Arquitectura General
El sistema aplica un flujo progresivo y auditable de datos para asegurar su integridad y veracidad. El flujo transaccional se ha establecido de la siguiente manera:

**WEB → registros_inbox → registros_validacion → registros_bd**

1. **WEB:** Capa de presentación o frontend donde usuarios y técnicos interactúan y envían datos.
2. **registros_inbox:** Tabla/hoja de recepción intermedia (cola de procesos).
3. **registros_validacion:** Capa donde Apps Script ejecuta validaciones de lógica de negocio y consistencia antes de la aprobación final.
4. **registros_bd:** Repositorio transaccional definitivo oficial.

## Módulos Principales
La actividad del sistema abarca múltiples módulos integrados, entre los que destacan:
- **Maestro de Equipos:** Base de inventario central sobre la que actúan todos los registros.
- **Historial por Equipo:** Bitácora unificada de todas las incidencias de cada unidad.
- **Planificación:** Programación calendarizada.
- **Presurizador:** Control específico de estos sistemas.
- **Puertas Caja Escala:** Checklist y control de los sistemas de evacuación/emergencia.
- **Correctivas:** Módulo de atenciones correctivas y reparaciones.
- **Emergencias:** Registro y respuesta de fallas críticas inesperadas.
- **Informes:** Subsistema para generar informes de servicio consolidados.

## Stack Actual
- **Backend y Entorno de Datos:** Las operaciones descansan sobre la infraestructura de **Google Workspace**, empleando **Google Sheets** como motor de Base de Datos y **Google Apps Script** como servidor backend encargado de la lógica y la manipulación de información.
- **Frontend / Cliente:** Entorno Web.

## Objetivo de Corto Plazo
Estabilizar la base documental (versiones V2.3 / V2.4) para el correcto despliegue modular. Se priorizará la correcta transición de la lógica existente a este nuevo esquema ordenado Inbox -> Validación -> BD sin detener la operación activa de la empresa.

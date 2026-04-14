# Plan de Proyecto

## ¿Qué ya existe?
Actualmente el sistema no es un lienzo en blanco; hay una base operativa funcionando y cimentada en integraciones nativas de Google (Sheets / Apps Script). Existen ya hojas encargadas de la recolección de los reportes.

## Fases del Proyecto
1. **Fase 1: Asentamiento Estructural (Actual)**
   - Establecer el modelo de datos, convenciones y documentación en el workspace.
   - Clarificar el flujo asíncrono para ingesta de datos.
2. **Fase 2: Robustecer Backend de Aprobación**
   - Asegurar que la validación en Apps Script actúe como "puerta" (gatekeeper) efectiva al pasar los datos desde `inbox` a la base de datos final.
3. **Fase 3: Desarrollo Interfaz WEB Integral**
   - Construir el frontend y conectarlo sin afectar los flujos productivos, haciendo uso pleno de la arquitectura definida.

## Prioridades
- **Estabilidad de Datos:** Prioridad máxima en que ningún dato llegue a la BD oficial sin previa validación.
- **Protección de Historial:** Conservar e interconectar eficientemente el histórico por equipo.
- **Gestión Continua:** Como el sistema ya se usa, cualquier paso debe ser retrocompatible y no destructivo.

## ¿Qué sigue ahora?
- Refinar y aprobar los Data Models específicos en `TABLES.md`.
- Construir en `apps-script/` el flujo lógico del Inbox y Validación para reemplazar tareas que puedan estar haciéndose sin validaciones fuertes.

## Próximos Hitos
- **Hito 1:** Completar la migración conceptual al esquema `inbox → validacion → bd`.
- **Hito 2:** Pruebas unitarias de un flujo completo: registro WEB, tránsito de inbox y escritura exitosa a base de datos.
- **Hito 3:** Despliegue de plantillas de informes vinculados a los registros correctos.

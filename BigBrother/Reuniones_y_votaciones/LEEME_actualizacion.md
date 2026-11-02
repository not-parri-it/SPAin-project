# Big Brother · Seguimiento de reuniones y votaciones

Actualización de las aplicaciones existentes de Reuniones y votaciones, con la identidad visual BEST Valencia y el área roja de Secretaría. Incluye el cambio anterior del censo de reuniones.

## 1. Actualizar Gestión

En el proyecto Apps Script **Gestión Reuniones y votaciones**:

1. Sustituye el contenido de `Código` por `Gestion/Código.gs`.
2. Sustituye el contenido de `Index.html` por `Gestion/Index.html`.
3. Añade un archivo de secuencia de comandos llamado `Seguimiento` y pega `Gestion/Seguimiento.gs`.
4. Conserva `Publicador` y `appsscript.json` tal como están. Las copias incluidas son referencia del proyecto que compartiste; no hace falta sustituirlas.
5. Guarda. Desde el selector de funciones del editor ejecuta **`seg_instalar`** con la cuenta de Secretaría autorizada. Acepta los permisos solicitados, incluido el envío de correos. Esto prepara la pestaña `Seguimiento` en el Sheet privado existente e instala un trigger horario. No crees ni compartas un Sheet nuevo. Comprueba que termina sin errores.
6. En **Implementar > Gestionar implementaciones**, edita la implementación actual, selecciona **Nueva versión** y pulsa **Implementar**. Conserva la configuración de ejecución y acceso existente.

## 2. Actualizar Participación

En el proyecto Apps Script **Participación Reuniones y votaciones**:

1. Sustituye el contenido de `Index.html` por `Participacion/Index.html`.
2. Añade un archivo de secuencia de comandos llamado `Seguimiento` y pega `Participacion/Seguimiento.gs`.
3. Conserva el archivo `Código` que acabas de restaurar y el `appsscript.json` actual. Las copias aquí incluidas proceden del proyecto que compartiste y son solo una referencia.
4. Guarda y actualiza la implementación existente con una nueva versión. Conserva la configuración de ejecución y acceso existente. La cuenta propietaria de esta aplicación necesita poder leer el Sheet privado ya configurado.

No es necesario cambiar Miembros ni el portal.

## 3. Prueba completa

1. Comprueba que el puente de publicación y el Sheet privado existentes funcionan y que la cuenta de Gestión tiene acceso a Miembros y Reuniones.
2. Crea y confirma una reunión de prueba: la columna O, `Censo_asistencia_JSON`, de la pestaña Reuniones debe guardar los Fulls y Babies del momento. Cambia el estatus de un miembro y edita la reunión: el censo anterior debe seguir igual.
3. Crea y confirma una votación de prueba con censo; confirma que también conserva el suyo. La aplicación bloqueará una edición que intente cambiar el electorado o sus preguntas una vez confirmada.
4. Cuando haya pasado la fecha y hora, abre **Seguimiento**, filtra por mes y despliega la convocatoria. El trigger revisa las convocatorias cada hora; al abrir la vista también se preparan los borradores que correspondan. Las ya confirmadas antes del censo de reuniones pueden aparecer sin censo: crea convocatorias nuevas para esta prueba.
5. Revisa los resultados; las justificaciones y delegaciones disponibles aparecerán como tales, y el resto quedará pendiente. Puedes cambiarlos. Guarda y cierra cuando no quede nadie pendiente. En votaciones usa **Mostrar Babies** si necesitas revisar sus filas.
6. Abre Participación con la cuenta de un miembro: **Mi historial** debe mostrar solo sus resultados cerrados. Prueba otra cuenta y comprueba que no ve resultados ajenos.
7. Para probar la propuesta, cierra tres convocatorias evaluables con falta para una misma persona y tipo. Si hay borradores pendientes para esa persona y tipo, ciérralos primero. El sistema intentará enviar un correo real a `board@bestvalencia.org`; las faltas de pruebas también pueden generar ese correo. Verifica que se envía uno y no se repite en la revisión horaria.

## Reglas de funcionamiento

- Los contadores de reuniones y votaciones van por separado y se identifican por ID de miembro; no se reinician por cambios de estatus.
- Se toman hasta las cuatro convocatorias cerradas más recientes que sean evaluables: OK o falta. Justificaciones y delegaciones se saltan por completo. Tres faltas generan una propuesta, sin cambiar el estatus.
- Una convocatoria no puede cerrarse con personas pendientes. Una cerrada puede reabrirse para corregir y volver a cerrarse; mientras haya resultados provisionales para esa persona y tipo no se genera su propuesta.
- La propuesta se manda una vez mientras la persona siga cumpliendo el umbral. Si deja de cumplirlo y lo vuelve a alcanzar más adelante, puede enviarse una nueva propuesta. Si el envío falla, se muestra el error al cerrar y el trigger vuelve a intentarlo.
- Para una votación vinculada a una reunión el sistema utiliza su hora cuando la fecha coincide. Cuando no hay una hora asociada espera hasta las 23:59 del día de la votación, hora de Madrid; para votaciones online espera también la fecha/hora límite si es posterior. El modelo actual no tiene hora de fin propia para todas las votaciones.
- El Sheet privado contiene los registros de seguimiento; sus permisos deben permanecer restringidos. Participación filtra los datos en el servidor y solo devuelve el historial de la cuenta identificada.

## Pruebas locales y límites

Ejecuta `node Tests/test_censo.js`, `node Tests/censo_votacion.js`, `node Tests/eventos.js` y `node Tests/integracion.js`. Las pruebas simulan los servicios de Google; cubren censos, conservación al editar, separación de contadores, neutralidad, cierres, avisos, permisos y lectura del historial propio. **La instalación, la identidad de las cuentas, los triggers, el correo y el aspecto en navegador necesitan comprobarse en el Workspace real.**

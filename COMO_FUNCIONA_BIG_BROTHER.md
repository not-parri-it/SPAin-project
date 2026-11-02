# Big Brother · Cómo funciona y cómo adaptarlo a otro LBG

Esta guía explica la versión preparada para **BEST Valencia**: su estructura, sus decisiones y las reglas que aplica el código. Está dirigida a personas que quieran entenderla, mantenerla o estudiar su adaptación. **No pretende establecer normas comunes para todos los LBGs.** Cada grupo debería contrastar las reglas con sus propios procedimientos antes de usarla.

La descripción corresponde a la copia de código incluida en este repositorio, no necesariamente a cambios posteriores hechos directamente en Google Workspace. La instalación paso a paso está en [INSTALACION.md](INSTALACION.md).

## 1. Qué problema intenta resolver

Big Brother reúne varias tareas de Secretaría que dependen unas de otras: mantener el directorio y los cambios de estatus, convocar reuniones y votaciones, recoger justificaciones y delegaciones y revisar la participación. El portal sirve de entrada a esas herramientas.

En Valencia se optó por separar **Gestión**, donde Secretaría prepara y modifica información, y **Participación**, donde los miembros consultan o realizan las acciones que les corresponden. La separación permite presentar interfaces distintas y comprobar las acciones en el servidor. **No convierte automáticamente los datos en públicos ni sustituye los permisos de Google Workspace.**

Es una solución hecha con herramientas disponibles en Google Workspace: Apps Script para las aplicaciones y automatizaciones, Google Sheets para los registros, Drive y Docs para documentos, y correo para borradores y avisos. Esto facilita empezar con herramientas conocidas, aunque también trae límites de permisos, concurrencia, mantenimiento y escalabilidad que se explican más adelante.

## 2. Las cinco aplicaciones

Cada fila representa un proyecto de Google Apps Script independiente. Las carpetas `Gestion` y `Participacion` no son dos pantallas de un mismo proyecto: cada una se despliega por separado.

| Aplicación | Para quién y para qué | Carpeta |
| --- | --- | --- |
| Portal LBG | Entrada con enlaces a las cuatro aplicaciones. | [Portal](Portal/README.md) |
| Miembros · Gestión | Secretaría administra miembros y cambios de estatus. | [Miembros/Gestion](BigBrother/Miembros/Gestion/README.md) |
| Miembros · Participación | Miembros autorizados consultan directorio e histórico publicado. | [Miembros/Participacion](BigBrother/Miembros/Participacion/README.md) |
| Reuniones y votaciones · Gestión | Secretaría prepara convocatorias y revisa el seguimiento. | [Reuniones/Gestion](BigBrother/Reuniones_y_votaciones/Gestion/README.md) |
| Reuniones y votaciones · Participación | Miembros justifican, delegan y consultan su historial cerrado. | [Reuniones/Participacion](BigBrother/Reuniones_y_votaciones/Participacion/README.md) |

El portal no concede permisos a las aplicaciones: cada una realiza sus propias comprobaciones. Los enlaces de Gestión pueden verse en el portal, pero el servidor de Gestión debe rechazar a quien no esté autorizado.

### Los datos y sus copias

| Recurso | Qué contiene en esta implementación | Para qué se usa |
| --- | --- | --- |
| Miembros | Fichas, estatus actual, ID de miembro y marcado lógico de borrado. | Fuente principal de identidad y estatus. |
| Cambios de estatus | Registros históricos y referencias a documentos. | Mantener la evolución de cada miembro. |
| Reuniones y votaciones | Reuniones, votaciones, sus configuraciones y censos; plantillas de correo. | Fuente principal de convocatorias. |
| Publicación | Copias de información seleccionada de Miembros, cambios, reuniones y votaciones. | Ofrecer datos de consulta a las aplicaciones de Participación. |
| Participación privada | Justificaciones, delegaciones y registros de seguimiento. | Guardar información y resultados que no deben abrirse directamente a todos. |

Las hojas de **publicación** y **participación privada** son archivos diferentes de las fuentes originales y entre sí. «Publicación» significa disponible a través de las aplicaciones y sus comprobaciones, no una invitación a compartir la hoja en Internet. Algunas aplicaciones también leen datos originales en el servidor para verificar identidad o censos; no toda la lectura pasa por la copia publicada.

El ID estable de miembro relaciona registros aunque cambien el nombre visible o el estatus. Conservarlo es necesario para que el historial siga vinculado a la misma persona. Las hojas originales y la copia publicada son elementos distintos: si falla la sincronización, una copia puede quedar desactualizada hasta la siguiente actualización satisfactoria.

## 3. Recorrido de Miembros

1. Secretaría crea o edita una ficha desde **Miembros · Gestión**. La ficha incluye nombre, apellidos, estatus y, cuando están disponibles, correo, teléfono y fecha de unión.
2. Cuando se tramita un cambio de estatus, se registra un cambio en la hoja histórica y se actualiza el estatus actual de la ficha. El código intenta compensar fallos entre ambas escrituras; Google Sheets no proporciona aquí una transacción única entre archivos, por lo que un fallo de compensación puede requerir revisión manual.
3. La publicación copia los campos de consulta a las pestañas de publicación. Una sincronización programada actúa como respaldo aproximadamente cada cinco minutos cuando el activador funciona.
4. Una persona autorizada accede a **Miembros · Participación**. El servidor verifica su identidad y registro, y devuelve los datos de consulta. El directorio se presenta en fichas con búsqueda, orden y categorías.

El borrado es **lógico**: la aplicación marca determinados registros en lugar de eliminar inmediatamente las filas. Los registros marcados se filtran de las vistas y publicaciones correspondientes. Pasar a Inactive no marca ni borra automáticamente al miembro; en esta versión se recuerda revisar la operación manualmente.

### Categorías y colores de Valencia

En los índices preparados, el filtro inicial es **Actives**, que agrupa Full, Baby y Observer. Alumni, Inactive, Otros y Todos pueden seleccionarse por separado; en Otros se incluyen Guest y las variantes de Granizado. Los distintivos asignan verde a Full, azul a Baby, naranja a Observer, amarillo a Granizado, morado a Alumni, granate a Guest y gris a Inactive. Estos son criterios de interfaz acordados para esta instalación; no suponen que otro LBG deba usar las mismas categorías.

Los datos y enlaces publicados se muestran a miembros autorizados según la implementación. Abrir un documento concreto sigue dependiendo de los permisos de Drive de ese documento.

## 4. Recorrido de una reunión

1. Secretaría crea una reunión como **borrador**, con fecha, hora, lugar, puntos y datos de convocatoria. Puede preparar el correo de convocatoria como borrador y gestionar el acta desde la aplicación. Preparar el correo no significa que el sistema lo envíe automáticamente.
2. Al **confirmar** la convocatoria, el código captura el censo de miembros que en ese momento figuran como Full o Baby y no están marcados para borrado. Guarda ID, nombre y estatus en `Censo_asistencia_JSON` de esa reunión, además de datos de la captura.
3. La reunión confirmada se publica en el calendario de Participación. Los miembros habilitados pueden registrar una justificación; el texto se guarda en el recurso privado. Una justificación tardía puede registrarse y se señala para decisión de Secretaría.
4. Pasada la fecha y hora aplicables, el seguimiento prepara un borrador usando el censo guardado. Si encuentra una justificación, propone el resultado neutral; para otras personas deja el resultado pendiente. Secretaría lo revisa y lo corrige antes de cerrar.

El censo evita recalcular quién debía participar según el estatus actual. Las reuniones anteriores a la incorporación de esta fotografía pueden no tenerla: la aplicación las señala sin censo y no inventa un historial. La versión incluida no ofrece un proceso completo automático de reconstrucción histórica.

**Matiz para adaptar:** aunque el seguimiento usa el censo congelado, la interfaz de Participación comprueba el estatus actual al permitir justificar. Un LBG que necesite que alguien justifique en función exclusivamente de su estatus histórico debe revisar ese flujo.

## 5. Recorrido de una votación

1. Secretaría prepara una votación y decide sus preguntas, opciones y electorado según el tipo de convocatoria. Una votación puede vincularse a una reunión.
2. Al confirmarla, se guarda `exportCenso`, una fotografía de personas y derechos por pregunta. La lógica contempla Fulls, Babies cuando proceda, personas adicionales y particularidades según el tipo de votación. La edición posterior protege el censo: puede bloquear cambios que alteren el electorado o sus derechos.
3. En Participación, una persona convocada puede delegar si la modalidad y el plazo lo permiten. La aplicación valida que el destino sea otra persona del censo y tenga derecho a las preguntas correspondientes.
4. La aplicación puede generar archivos CSV para preparar una elección en Election Runner. **Big Brother no recoge el contenido de los votos ni comprueba por sí solo quién votó en la plataforma externa.** Secretaría deberá verificar el resultado de participación por el procedimiento que utilice el LBG e introducirlo en Seguimiento.
5. Después del momento aplicable, el seguimiento crea un borrador a partir del censo; identifica delegaciones existentes y deja el resto pendiente de revisión. Al cerrar, solo guarda el resultado de participación, no el sentido del voto.

### Reglas concretas de delegación

En esta versión de Participación, una votación marcada como online no admite delegación. Para una delegación habilitada se exige plazo, destino elegible y capacidad: una persona que ha delegado no puede recibir una delegación, y una persona puede acumular como máximo una delegación adicional a su propio voto. Son reglas implementadas para este flujo y **deben revisarse frente a las normas de cada LBG**; otros tipos y exportaciones tienen además validaciones propias en Gestión.

Si no hay hora de votación asociada a una reunión en la misma fecha, el seguimiento usa las 23:59 de ese día, hora de Madrid; para una votación online también espera una fecha límite posterior si está configurada. No todas las convocatorias tienen una hora de fin propia.

## 6. Seguimiento y propuestas a Inactive

Secretaría dispone de **Seguimiento**, por mes, y Participación ofrece **Mi historial**. No se crea otro calendario para este módulo.

### Del borrador al cierre

- El proceso periódico y la apertura de la vista de Gestión buscan convocatorias que ya hayan pasado y tengan censo. Con ellas crean registros de seguimiento en estado **borrador**.
- Para cada persona puede registrarse **pendiente**, **OK**, **falta** o el estado neutral que corresponda: **justificado** en una reunión o **delegado** en una votación. Las neutralidades detectadas sirven de propuesta; Secretaría puede corregirlas.
- No se cierra la convocatoria mientras quede alguien pendiente. Una convocatoria cerrada puede reabrirse para corregirla y debe volver a cerrarse. Participación muestra al usuario sus propios resultados cerrados.
- Una justificación registrada después de preparar el borrador requiere revisión, especialmente si Secretaría ya ha seleccionado un resultado manual o ha cerrado la convocatoria: el sistema no debe asumirse como una aprobación automática de cualquier cambio tardío.

### Cálculo de faltas de Valencia

Reuniones y votaciones se calculan **por separado**, vinculadas por ID de miembro. Para cada tipo se toman hasta las cuatro convocatorias **cerradas y evaluables** más recientes de esa persona. Una convocatoria evaluable es un resultado **OK** o **falta**. Justificaciones y delegaciones se saltan: no suman una falta y tampoco borran las anteriores.

Ejemplo: `falta → falta → delegación → falta` produce tres faltas evaluables. La delegación se omite y no reinicia el contador.

El código comprueba **tres o más faltas dentro de las hasta cuatro evaluables disponibles**; no exige que existan ya cuatro evaluables. Los resultados provisionales de esa persona y tipo aplazan la propuesta. El umbral, el tamaño de la ventana, el tratamiento de casos neutros y la necesidad o no de contar cuatro eventos completos son decisiones que otro LBG debe confirmar antes de adaptarlo.

Cuando se alcanza el umbral, el código intenta enviar un correo de propuesta a la dirección de Board configurada en `seg_notificar_`. La propuesta **no cambia el estatus automáticamente**. Una propiedad del proyecto marca el aviso mientras el umbral siga activo para evitar envíos repetidos; si deja de cumplirse y más adelante vuelve a alcanzarse, puede enviarse otra propuesta. Un correo ya enviado no se retira automáticamente si después se corrige un resultado. El sistema intenta reintentar envíos fallidos en revisiones posteriores, pero la coordinación entre envío y registro no es una garantía transaccional de entrega exactamente una vez.

Los indicadores visuales muestran azul sin faltas, amarillo con una, rojo con dos y negro con tres o más en la vista preparada. El historial se relaciona por ID, por lo que cambiar de Baby a Full o pasar por otro estatus no lo reinicia por sí solo.

## 7. Privacidad y permisos en esta versión

- Gestión valida en el servidor una lista explícita de cuentas de Secretaría. La franja roja es una señal visual; **no es el mecanismo de autorización**.
- Participación intenta identificar la cuenta de Google activa y la relaciona con un miembro único. Si no puede comprobarla, el flujo debe denegar el acceso. Las aplicaciones de Participación necesitan permisos de su cuenta ejecutora sobre los recursos que leen y escriben.
- El texto de las justificaciones se guarda en la hoja privada. Secretaría puede marcar una justificación para que sea visible a la Board autorizada; la consulta de Board comprueba la pertenencia al grupo y muestra los registros marcados.
- La publicación de Miembros incluye los campos de consulta acordados para Valencia. Cada LBG debe decidir qué datos y documentos corresponde poner a disposición de sus miembros.
- La copia de código contiene IDs y enlaces del entorno original. El ZIP completo incluye además documentos y datos de prueba. Antes de compartir o publicar, revisa qué recursos, identificadores, datos y marcas se pueden distribuir.

Estas comprobaciones deben probarse con cuentas reales del dominio y revisar junto con la configuración de Google Workspace y la normativa interna del LBG. El código por sí solo no demuestra que una instalación concreta tenga todos los permisos correctamente configurados.

## 8. Cómo adaptar Big Brother a otro LBG

La aplicación **no es aún un producto multigrupo configurable desde un panel**. Gran parte de las reglas y recursos están escritos en el código. Cambiar nombres o colores en la interfaz no cambia automáticamente las reglas del servidor.

Antes de modificar nada, conviene acordar estas decisiones con el grupo destinatario:

| Pregunta | Implementación de Valencia | Dónde empezar a revisar |
| --- | --- | --- |
| ¿Qué estatus existen y qué significan? | Full, Baby, Observer, Alumni, Inactive, variantes de Granizado y Guest; Actives agrupa los tres primeros en el directorio. | `BB_CONFIG.ESTATUS_VALIDOS`, `MIEM_PART.ESTATUS_ACCESO`, funciones de categoría y colores de ambos `Index.html`, y reglas de censos. |
| ¿Quién administra? | Listas de cuentas de Secretaría; hay un grupo de Board para consultas concretas. | `BB_CONFIG.SECRETARIA_EMAILS`, `BB_GESTION_SECRETARIA`, `P_CFG.BOARD_GROUP` y funciones de autorización. |
| ¿Quién debe acudir a reuniones? | Full y Baby del momento de confirmación. | `crearCensoAsistencia_` en Reuniones · Gestión y validaciones de justificación en Participación. |
| ¿Quién puede votar y sobre qué? | Depende del tipo de votación, censo y preguntas; puede incluir personas adicionales. | `vot_validar_`, `vot_snapshot_`, `vot_preguntasExportacion_`, `p_elector_`. |
| ¿Se permiten delegaciones? | Reglas de plazo, modalidad, derecho por pregunta y capacidad descritas arriba. | `p_validVote_`, `p_receiver_`, `p_checkCap_` y validaciones de Gestión/exportación. |
| ¿Cómo se calculan las faltas? | Hasta cuatro resultados evaluables; tres faltas; neutrales excluidos; tipos separados. | `seg_contar_`, `seg_notificar_`, estados y vista de historial. |
| ¿Quién recibe propuestas y cuándo? | Correo a Board al alcanzarse el umbral tras revisión/cierre; no cambia estatus. | `seg_notificar_`, permisos de correo, texto y proceso posterior de Secretaría. |
| ¿Dónde están los datos y enlaces? | IDs, grupo, dominio, plantilla y URLs del entorno de Valencia. | Tabla de constantes de [INSTALACION.md](INSTALACION.md) y los `Index.html`. |
| ¿Qué horarios y ciclos se usan? | `Europe/Madrid`, plazos y convenciones de curso del código. | Manifiestos, constantes `P_CFG.TZ`/`SEG.TZ`, fechas y lógica de cursos y actas. |

Después de acordar las reglas: prepara **recursos y cuentas propios**, cambia de forma coherente los IDs en todos los proyectos, adapta y prueba las reglas de servidor y de interfaz, configura las implementaciones y activadores y realiza pruebas con cuentas distintas y datos ficticios. No apuntes accidentalmente un despliegue de otro LBG a las hojas o URLs de Valencia. Consulta [INSTALACION.md](INSTALACION.md) para el orden y las dependencias.

## 9. Por qué se ha organizado así y qué se podría mejorar

Las siguientes son explicaciones de diseño y propuestas de evolución; no son requisitos que todos los LBGs deban adoptar.

| Decisión actual | Motivo práctico | Posible mejora |
| --- | --- | --- |
| Separar Gestión y Participación. | Dar a Secretaría y miembros interfaces y operaciones diferentes. | Centralizar la definición de roles y probar los permisos de forma automática con varios perfiles. |
| Usar Sheets y Apps Script. | Aprovechar herramientas del Workspace y permitir a Secretaría revisar datos. | Si crecen las operaciones o los accesos concurrentes, evaluar una base de datos con transacciones y un backend con controles de acceso más expresivos. |
| Publicar una copia de consulta. | Separar datos de origen de lo que se muestra en Participación. | Versionar las publicaciones, detectar fallos de sincronización y ofrecer un estado de salud para Secretaría. |
| Congelar censos. | Mantener quién estaba convocado aunque cambien los estatus. | Añadir herramientas auditadas para corregir o importar censos históricos sin atribuir faltas automáticamente. |
| Revisar y cerrar borradores. | No deducir por ausencia de justificación que alguien faltó, ni inventar quién votó. | Añadir un registro de auditoría claro de quién cambió cada resultado, cuándo y por qué, y pruebas de corrección posterior. |
| Usar una regla de faltas en código. | Aplicar automáticamente el acuerdo de Valencia en cada tipo de convocatoria. | Llevar ventanas, umbrales, neutralidades, destinatarios y excepciones a una configuración validada por LBG, con pruebas por regla. |
| Avisar por correo. | Facilitar a Board la revisión de una propuesta sin cambiar el estatus automáticamente. | Añadir una cola y un registro de entrega robusto, gestión de errores y protección frente a duplicados. |
| Compartir documentación y recursos. | Permitir que otros grupos comprendan y adapten el proyecto. | Separar configuración local de secretos, automatizar una plantilla de instalación sin datos y acordar permisos y licencia para código y marca. |

### Límites conocidos que conviene revisar

1. **Pruebas reales:** los tests incluidos simulan servicios de Google; no garantizan permisos, triggers, correo o comportamiento con varias cuentas reales. La implementación desplegada puede diferir de esta copia.
2. **Censos anteriores:** sin una fotografía no se conoce automáticamente el electorado histórico. Antes de importar datos antiguos, acordad cómo verificar su origen y evitar faltas erróneas.
3. **Registros marcados:** Gestión excluye del cálculo las convocatorias marcadas para borrado al reconstruir la lista activa, mientras la lectura de «Mi historial» consulta los registros cerrados guardados. Debe comprobarse y unificarse el comportamiento al retirar una convocatoria antes de depender de él para el histórico.
4. **Sin transacciones completas:** distintas hojas y proyectos no forman una única transacción. Los bloqueos y compensaciones existentes reducen algunos conflictos, pero no sustituyen una estrategia de concurrencia y recuperación entre proyectos.
5. **Propiedades y activadores:** configuraciones, marcas de aviso y activadores de Apps Script no viajan automáticamente en el ZIP ni en Git. Restaurar solo el código puede cambiar cuándo se publican datos o se envían avisos.
6. **Identidad de sesión:** en determinados contextos de Apps Script el correo activo puede no estar disponible. Hay que comprobarlo en el Workspace de destino y mantener el fallo cerrado cuando no se pueda verificar.
7. **Borrados y retención:** el marcado lógico no define por sí mismo cuánto tiempo deben conservarse datos personales o cómo atender una eliminación definitiva. Cada LBG debe acordar y aplicar su propio proceso.
8. **Configuración de ejecución de Miembros · Participación:** el comentario del código y el manifiesto recibido no coinciden. Consulta la nota específica en [INSTALACION.md](INSTALACION.md) y verifica la implementación funcional antes de reproducirla.

## 10. Ruta para quien llega por primera vez

1. Leer esta guía y anotar qué coincide y qué no con el procedimiento del LBG.
2. Revisar [README.md](README.md) e [INSTALACION.md](INSTALACION.md), incluidos permisos, recursos y datos que no se deben publicar.
3. Abrir los README de los cinco proyectos para localizar los archivos y sus funciones.
4. Crear un entorno de prueba aislado con datos ficticios; no reutilizar los IDs de otro grupo.
5. Definir y probar las reglas propias antes de hacer cualquier despliegue para miembros.

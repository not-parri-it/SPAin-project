# Instalación, actualización y restauración

Esta guía describe los archivos incluidos en esta copia de Intranet LBG. **No instala ni modifica automáticamente Google Workspace.** Si las aplicaciones ya funcionan, usa el apartado de actualización; la instalación desde cero requiere comprobar los recursos y permisos del dominio.

## 1. Antes de empezar

- Necesitas una cuenta autorizada de Secretaría y acceso al editor de los proyectos Apps Script y a las hojas y documentos que van a utilizar. El código de Gestión restringe el acceso a cuentas definidas en sus constantes; usar una cuenta del dominio no basta.
- Conserva una copia de las hojas y proyectos que ya funcionan. Los `.xlsx` y `.docx` de `Referencias/` en el ZIP completo (excluidos del ZIP para GitHub) son instantáneas de prueba: **no se actualizan desde Google** y pueden contener datos. Para reutilizar una hoja, ábrela o impórtala como hoja nativa de Google Sheets y usa su nuevo ID; revisa antes su contenido y sus permisos.
- Necesitarás cinco proyectos Apps Script independientes, identificados en el [README](README.md), y, para un montaje nuevo, cinco recursos de datos distintos: Miembros, Cambios de estatus, Reuniones y votaciones, publicación y participación privada. La hoja de publicación se comparte entre los dos módulos; la de participación privada guarda justificaciones, delegaciones y seguimiento.
- Las aplicaciones de Participación requieren identificar correctamente a la cuenta activa. Google no garantiza que el correo esté disponible en todos los contextos; compruébalo con cuentas distintas dentro del dominio. Si no puede identificarse, el código debe denegar el acceso: no sustituyas esta comprobación por un correo enviado desde el navegador. [Documentación de Google](https://developers.google.com/apps-script/reference/base/session).
- Los contenidos de Miembros publicados dentro de la aplicación incluyen correo, teléfono y enlaces de documentos, conforme a la configuración preparada. Los permisos propios de cada documento de Drive siguen aplicándose.

## 2. Actualizar una instalación existente

1. Compara primero el código desplegado con esta copia: el ZIP no incluye cambios que se hayan hecho después en Google.
2. Abre el proyecto Apps Script correcto y sustituye **solo los archivos correspondientes al cambio**. Las cinco carpetas tienen un `README.md` propio y se conservan las guías de actualización anteriores. Evita crear dos archivos de servidor con las mismas funciones: para sustituir `Código.gs` o `Publicador.gs`, usa el archivo equivalente que ya existe en ese proyecto, aunque tenga otro nombre.
3. Guarda. En **Implementar → Gestionar implementaciones**, selecciona el lápiz de la app web existente, crea una **Nueva versión** e implementa. Mantén la configuración de cuenta y acceso que ya funciona salvo que hayas decidido cambiarla y volver a probarla.
4. Repite en los otros proyectos afectados y prueba sus URLs. La actualización de código no sincroniza GitHub automáticamente ni implica que cambie el contenido de las hojas.
5. Los triggers ya existentes no necesitan reinstalarse solo por editar el HTML. Añade los del apartado 6 únicamente si realmente faltan o si estás reconstruyendo el entorno.

## 3. Preparar los recursos para un entorno nuevo

Usa archivos de Google nativos separados y anota sus IDs. El ID es el tramo de la URL de una hoja situado entre `/d/` y `/edit`. No mezcles el archivo de publicación ni el privado con los originales; las comprobaciones del código impiden algunas combinaciones.

| Recurso | Pestañas o contenido | Dónde configurar su ID |
| --- | --- | --- |
| Miembros | `Miembros`: `Nombre`, `Apellidos`, `Estatus`, `Correo`, `Fecha de union`, `Teléfono`, `ID_Miembro`, `Marcado_para_borrado`. | `BB_CONFIG.SPREADSHEET_ID`, `MIEM_PART.ORIGINAL_ID`, `VOT_CONFIG.MIEMBROS_SHEET`, `P_CFG.MIEMBROS_ID`. |
| Cambios de estatus | `Cambios de estatus`: `ID_cambio`, `ID_miembro`, `Nombre`, `Apellidos`, `Nuevo estatus`, `Fecha`, `Link / documento`, `Marcado_para_borrado`. | `BB_CONFIG.SPREADSHEET_CAMBIOS_ID`. |
| Reuniones y votaciones | Pestañas `Reuniones`, `Votaciones` y `Plantillas_correo`. Usa el esquema de la copia de prueba y comprueba sus cabeceras. | `REU_CONFIG.SPREADSHEET_ID`, `P_CFG.REUNIONES_ID`. |
| Publicación compartida | El código crea o valida `Miembros_publicos`, `Cambios_estatus_publicos`, `Miembros_publicacion_meta`, `Reuniones_publicas`, `Votaciones_publicas` y su información auxiliar. | `BB_MPUB.PUBLIC_ID`, `MIEM_PART.PUBLIC_ID`, `BB_PUENTE.PUBLIC_ID`, `P_CFG.PUBLIC_ID`. |
| Participación privada | El puente crea o valida `Justificaciones` y `Delegaciones`; el seguimiento crea `Seguimiento`. | `BB_PUENTE.PRIVATE_ID`, `P_CFG.PRIVATE_ID`. |
| Plantilla de actas | Documento nativo de Google Docs compatible con el generador. La copia `.docx` es solo una referencia. | `REU_ACTAS.PLANTILLA_DOC_ID`. |

Los prefijos identifican constantes en distintos archivos: consulta los README de cada proyecto para localizarlas. Mantén el mismo ID para un mismo recurso en todos los lugares indicados. Asegura los permisos de la cuenta que ejecuta cada proyecto; **no concedas a todos los miembros acceso directo a las hojas privadas**. La cuenta propietaria que despliega Participación debe poder acceder a los recursos que esa aplicación necesita.

En una hoja nueva de Miembros se deben preparar las seis primeras cabeceras y la pestaña con el nombre previsto antes de ejecutar `prepararHojaMiembros`; esta función crea o valida columnas técnicas y asigna IDs faltantes. La hoja de Cambios necesita las primeras siete cabeceras antes de `prepararHojaCambios`. No ejecutes estas funciones a ciegas sobre hojas de producción.

En Gestión de Reuniones, `prepararModuloReuniones` solo inicializa la pestaña si cumple sus condiciones; si encuentra un esquema desconocido se detiene. `prepararModuloVotaciones` crea o valida `Votaciones`. Las columnas `Convocatoria_JSON` y `Censo_asistencia_JSON` se usan para datos técnicos; no las ocupes con otros datos.

## 4. Crear los proyectos Apps Script

Para cada una de las cinco carpetas de aplicación:

1. Crea un proyecto Apps Script distinto o abre el existente que corresponda.
2. En el editor crea los archivos de secuencia de comandos y HTML de la carpeta. Pega cada `.gs` en un archivo de secuencia de comandos y `Index.html` en el archivo HTML llamado `Index`. Una extensión `.gs` en el ZIP corresponde al nombre del archivo de servidor en el editor.
3. Evita funciones duplicadas: si el editor creó un `Código.gs` y estás usando un archivo llamado `Code.gs`, conserva una única copia de las funciones del servidor. En `Portal` el archivo es `Code.gs`; en el resto, `Código.gs` es el principal.
4. Ajusta las constantes del apartado 3 y las cuentas autorizadas. Para Gestión de Miembros revisa `BB_CONFIG.SECRETARIA_EMAILS`; para Gestión de Reuniones, `BB_GESTION_SECRETARIA`. Cambia los valores de prueba por los de la instalación prevista. `GRUPO_PRUEBAS` no concede acceso a Gestión.
5. Revisa `DOMINIO`/`DOMAIN`, el grupo de Board y el correo destino del aviso en `seg_notificar_`. Los enlaces del portal están en `Portal/Index.html`; los enlaces de regreso al portal también están en los HTML de las aplicaciones. La plantilla de actas se configura en `REU_ACTAS`. No publiques por accidente los IDs, direcciones o URLs que quieras mantener privados.
6. Guarda y revisa la zona horaria del proyecto: el código usa `Europe/Madrid`. El `appsscript.json` de cada carpeta documenta el manifiesto recibido. En un proyecto existente no lo sustituyas sin comparar sus opciones de ejecución y acceso.

### Cuenta de ejecución y manifiestos

| Proyecto | Configuración documentada en el código o manifiesto recibido |
| --- | --- |
| Portal | Manifiesto recibido: `USER_DEPLOYING` y `DOMAIN`. |
| Miembros · Gestión | `USER_ACCESSING`, acceso de dominio, más comprobación de Secretaría en servidor. |
| Miembros · Participación | **Existe una discrepancia:** el comentario del código y la guía anterior indican «ejecutar como yo», pero el `appsscript.json` recibido dice `USER_ACCESSING`. Comprueba la implementación que funciona en tu entorno y prueba el acceso con cuentas distintas antes de reproducirla; no sustituyas la configuración a ciegas. |
| Reuniones y votaciones · Gestión | `USER_ACCESSING`, acceso de dominio, más comprobación de Secretaría en servidor. |
| Reuniones y votaciones · Participación | `USER_DEPLOYING` y acceso de dominio; el servidor debe identificar a cada usuario. |

`USER_DEPLOYING` ejecuta como quien implementa y `USER_ACCESSING` como quien accede. La elección determina qué cuenta necesita permisos sobre las hojas y cómo se autoriza la app. Mantén las hojas privadas restringidas y verifica las dos cosas: que el miembro correcto es reconocido y que una cuenta no autorizada no puede leer ni modificar información ajena. [Opciones de aplicaciones web de Google](https://developers.google.com/apps-script/guides/web).

## 5. Inicialización de un entorno nuevo

Con los IDs ya configurados, abre cada proyecto de Gestión con una cuenta autorizada y con acceso de edición a los archivos correspondientes. Guarda antes de ejecutar. El selector de funciones del editor permite elegir una función y pulsar **Ejecutar**; acepta los permisos que correspondan al proyecto. Estas funciones escriben o preparan hojas: úsalas primero con un entorno de prueba.

**Miembros · Gestión:**

1. Si las hojas aún no están preparadas, ejecuta `prepararHojaMiembros` y `prepararHojaCambios`, revisando previamente las cabeceras.
2. Ejecuta `reconstruirPublicacionMiembros`. Crea o valida las pestañas de publicación y actualiza sus datos; requiere las hojas de Miembros y Cambios accesibles.
3. Ejecuta `instalarSincronizacionMiembros` para crear el activador periódico, si no está instalado para la cuenta administradora.

**Reuniones y votaciones · Gestión:**

1. Si faltan o necesitan prepararse, ejecuta `prepararModuloReuniones` y `prepararModuloVotaciones` y revisa los resultados.
2. Ejecuta `prepararPuenteBigBrother`, que prepara o valida las pestañas públicas y privadas y puede migrar registros antiguos de propiedades del proyecto una sola vez. Usa una copia y revisa la instalación antes de ejecutarlo si ya existen datos.
3. Ejecuta `instalarTriggersBigBrother` y `seg_instalar` si esos activadores faltan. `seg_instalar` prepara la pestaña de seguimiento y puede crear borradores de convocatorias de prueba ya pasadas.
4. Configura desde Gestión los enlaces y carpetas de actas si los necesitas. El ZIP no recupera las propiedades configuradas en proyectos anteriores.

## 6. Activadores

| Proyecto | Función que se ejecuta desde el editor | Activador instalado | Frecuencia o evento |
| --- | --- | --- | --- |
| Miembros · Gestión | `instalarSincronizacionMiembros` | `sincronizarMiembrosProgramado` | Aproximadamente cada 5 minutos. |
| Reuniones · Gestión | `instalarTriggersBigBrother` | `bb_publicarEnTrigger` | Aproximadamente cada 5 minutos. |
| Reuniones · Gestión | `instalarTriggersBigBrother` | `bb_publicarEnEdicion` | Ediciones manuales en la hoja configurada. |
| Reuniones · Gestión | `seg_instalar` | `seg_trigger` | Aproximadamente cada hora. |

No ejecutes los activadores de eventos a mano como sustituto de las funciones instaladoras. Busca el icono de **Activadores** en el editor para revisar los tuyos. Las funciones instaladoras reemplazan los activadores de esos nombres que puede ver la cuenta actual; los activadores de otra cuenta pueden no ser visibles. Todos se ejecutan bajo la cuenta que los creó, que debe seguir autorizada y tener acceso a las hojas. [Activadores instalables de Google](https://developers.google.com/apps-script/guides/triggers/installable).

El seguimiento envía correos reales al destinatario configurado si se cumplen las condiciones, incluso con datos de prueba. Comprueba el destinatario y los permisos de correo antes de probar umbrales.

## 7. Desplegar y conectar el portal

1. Despliega primero las cuatro aplicaciones de Big Brother como aplicaciones web restringidas al dominio, con la identidad de ejecución revisada en el apartado 4. Para una app nueva: **Implementar → Nueva implementación → Aplicación web**. Autoriza y guarda la URL `/exec` de cada una.
2. Actualiza los cuatro enlaces de `Portal/Index.html` para que correspondan a esas implementaciones. El ZIP conserva enlaces del entorno de prueba recibido, que no cambian solos al crear proyectos nuevos.
3. Despliega el portal y, si cambia su URL, actualiza los enlaces de regreso al portal en los HTML de las aplicaciones.
4. Las guías anteriores describen cómo actualizar una implementación existente manteniendo su enlace. `/dev` es para pruebas de editores; usa la URL `/exec` de la implementación para compartir la app. [Guía de apps web de Google](https://developers.google.com/apps-script/guides/web).

## 8. Comprobaciones funcionales

- Con una cuenta de Secretaría y otra de miembro, verifica identidad y permisos de las dos aplicaciones de Gestión y de las dos de Participación. Prueba que una cuenta no autorizada no puede llamar a las funciones de edición ni leer Sheets privados directamente.
- Comprueba las fichas, filtros, historial y enlaces de documentos de Miembros. Si un documento no abre, revisa sus propios permisos de Drive.
- Confirma una reunión nueva: debe guardar el censo de Fulls y Babies del momento. Una reunión anterior sin censo no se reconstruye automáticamente. Confirma una votación y comprueba su censo.
- Después de la hora aplicable, revisa el borrador de seguimiento, justificaciones y delegaciones; completa resultados y cierra. Prueba en Participación que cada persona solo ve su historial. El correo a Board es real.
- Si una ejecución falla, abre **Ejecuciones** en Apps Script y revisa el mensaje; comprueba IDs, cabeceras, permisos, identidad y autorizaciones. No publiques errores con datos personales en un repositorio público.

Las pruebas incluidas en el [README](README.md) son locales y simuladas; no validan vuestro despliegue ni sustituyen las pruebas con cuentas del dominio.

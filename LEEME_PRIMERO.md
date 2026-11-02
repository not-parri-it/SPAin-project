# Intranet LBG · Portal y Big Brother

Esta carpeta reúne las últimas versiones que hemos preparado en esta conversación para el portal y Big Brother. Es una **copia de los archivos preparados aquí**, no una descarga en directo de tus proyectos de Google Apps Script: si has realizado otros cambios en Google después de pasarlos, no estarán necesariamente incluidos.

## Contenido

- `Portal/`: portal con los enlaces de Participación y Gestión de Reuniones y Miembros, y los archivos originales de servidor y configuración.
- `BigBrother/Miembros/Gestion/`: administración de miembros y cambios de estatus, con colores, separadores y filtros.
- `BigBrother/Miembros/Participacion/`: consulta de miembros con esos mismos colores y categorías.
- `BigBrother/Reuniones_y_votaciones/Gestion/`: gestión de reuniones, votaciones, censos y seguimiento.
- `BigBrother/Reuniones_y_votaciones/Participacion/`: aplicación de miembros para justificaciones, delegaciones y consulta del historial.
- `Referencias/Identidad_visual/`: identidad visual y recursos BEST Valencia que facilitaste.
- En el ZIP completo, `Referencias/Datos_y_documentos_de_prueba/`: copias de las hojas y actas de prueba que compartiste.
- En el ZIP completo, `Referencias/Archivos_y_datos_originales_de_prueba.zip`: el archivo original que nos pasaste, conservado completo como referencia; `BEST_Valencia_Identidad_Visual.zip` conserva el paquete visual original.

Cada carpeta de aplicación contiene sus archivos `.gs`, `Index.html` y `appsscript.json` disponibles en las copias recibidas. Las carpetas de Miembros y de Reuniones y votaciones incluyen sus guías y pruebas locales. En el ZIP completo, `Referencias/Conversacion_previa_aportada.txt` conserva el texto previo que facilitaste. El ZIP para GitHub excluye estas copias privadas y respaldos.

## Antes de sustituir o restaurar algo

Si las aplicaciones que tienes instaladas funcionan, guarda este ZIP como copia de trabajo y consulta los `LEEME` de cada parte antes de sustituir archivos. Para una actualización concreta usa únicamente los archivos indicados en su guía; no es necesario reemplazar todos los archivos ni crear proyectos nuevos.

Este ZIP no puede conservar por sí solo las implementaciones, URLs de despliegue, versiones, permisos de Drive o grupos, autorizaciones, activadores ni propiedades guardadas en Apps Script. Las copias `.xlsx` y `.docx` son los archivos de prueba que compartiste: no son una sincronización actual de tus hojas o documentos de Google. Los códigos contienen configuraciones, identificadores y enlaces del entorno de prueba recibido. Si se reconstruye desde cero habrá que comprobarlos, configurar las conexiones, permisos y activadores, y crear las implementaciones correspondientes.

El seguimiento puede enviar propuestas de Inactive a `board@bestvalencia.org` cuando se cumplan sus condiciones, también con datos de prueba. El `LEEME_actualizacion.md` de Reuniones y votaciones explica la instalación de `seg_instalar` y las pruebas.

## Comprobación

Se han vuelto a ejecutar en esta copia las pruebas locales de filtros y colores, censos, seguimiento y separación de permisos. Son pruebas con datos o servicios simulados; no sustituyen la comprobación de las aplicaciones desplegadas en vuestro Workspace.

Para entender el funcionamiento de Big Brother y sus opciones de adaptación a otros LBGs, consulta `COMO_FUNCIONA_BIG_BROTHER.md`.

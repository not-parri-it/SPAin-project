# Big Brother · Reuniones y votaciones · Gestión

Área de Secretaría para convocatorias, actas, publicación y seguimiento. Al convocar una reunión se guarda un censo de Fulls y Babies; las votaciones confirmadas utilizan su censo congelado.

## Archivos

- `Código.gs`: reuniones, votaciones, permisos, censo y generación de actas.
- `Publicador.gs`: puente hacia las hojas de publicación y participación privada.
- `Seguimiento.gs`: borradores, cierre, contadores y propuestas a Inactive.
- `Index.html`: interfaz de Gestión.
- `appsscript.json`: manifiesto recibido como referencia.

## Configuración e instalación

1. Revisa [INSTALACION.md](../../../INSTALACION.md): allí figuran los cinco recursos de datos, las cuentas y el orden completo.
2. En `Código.gs`, revisa `REU_CONFIG.SPREADSHEET_ID`, `VOT_CONFIG.MIEMBROS_SHEET`, `BB_GESTION_SECRETARIA` y, si vas a generar actas, `REU_ACTAS.PLANTILLA_DOC_ID`. En `Publicador.gs`, ajusta `BB_PUENTE.PUBLIC_ID` y `BB_PUENTE.PRIVATE_ID`. El destinatario de propuestas se define en `seg_notificar_` de `Seguimiento.gs`.
3. Con hojas de prueba preparadas y la cuenta de Secretaría, ejecuta las preparaciones necesarias y `prepararPuenteBigBrother`. Instala `instalarTriggersBigBrother` y `seg_instalar` si faltan. La guía general indica sus efectos y el orden.
4. Implementa como aplicación web restringida al dominio y comprueba la ejecución como usuario que accede y el rechazo de una cuenta sin autorización.

El seguimiento puede enviar correos reales a Board, también durante pruebas. Al cierre se calculan por separado reuniones y votaciones; neutralidades se omiten. Los tests locales están en la carpeta `Tests` superior. Para la actualización sobre una instalación existente, consulta el `LEEME_actualizacion.md` de la carpeta superior.

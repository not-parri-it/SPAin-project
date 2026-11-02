# Big Brother · Reuniones y votaciones · Participación

Aplicación para consultar convocatorias, registrar justificaciones y delegaciones, y ver el historial personal de seguimiento. La consulta de Board mantiene sus controles específicos.

## Archivos

- `Código.gs`: identidad, consultas y operaciones de participación.
- `Seguimiento.gs`: lectura del historial propio cerrado.
- `Index.html`: interfaz de la aplicación.
- `appsscript.json`: manifiesto recibido como referencia.

## Configuración e instalación

1. Consulta la [guía general](../../../INSTALACION.md) y prepara antes el puente desde Gestión.
2. En `Código.gs`, revisa `P_CFG.DOMAIN`, `PUBLIC_ID`, `PRIVATE_ID`, `REUNIONES_ID`, `MIEMBROS_ID` y `BOARD_GROUP`. Los IDs de publicación, privado, reuniones y miembros deben coincidir con los configurados en Gestión y ser los recursos previstos.
3. La copia recibida está diseñada para desplegarse como quien implementa, con acceso limitado al dominio. Esa cuenta necesita acceso a los recursos y la aplicación debe identificar correctamente a cada usuario. Prueba cuentas distintas y comprueba que ninguna ve el historial de otra.
4. Implementa o actualiza la app web. Este proyecto no necesita un activador propio para el seguimiento: el trigger se instala en Gestión. No compartas las hojas privadas directamente para evitar un fallo de autorización.

La disponibilidad del correo de la sesión depende del contexto de Google Workspace; si no puede verificarse la identidad, revisa la configuración en lugar de desactivar el control. Para actualizar una instalación compatible consulta también `LEEME_actualizacion.md` en la carpeta superior.

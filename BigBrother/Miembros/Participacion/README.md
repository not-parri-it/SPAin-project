# Big Brother · Miembros · Participación

Aplicación de consulta para miembros autorizados: fichas, filtros, colores e historial de cambios. No proporciona controles administrativos.

## Archivos

- `Código.gs`: comprobación de identidad y lectura de datos de publicación.
- `Index.html`: directorio y filtros con Actives por defecto.
- `appsscript.json`: manifiesto recibido; revisar la discrepancia descrita más abajo.

## Configuración e instalación

1. Consulta la [guía general](../../../INSTALACION.md). La publicación debe estar preparada desde Miembros · Gestión.
2. En `Código.gs`, verifica `MIEM_PART.DOMINIO`, `ORIGINAL_ID` y `PUBLIC_ID`; los IDs deben coincidir con la hoja de Miembros y la publicación usadas por Gestión. Verifica el acceso de la cuenta que ejecuta la app a esos recursos.
3. **Atención:** el comentario del código y la guía anterior indican ejecutar como quien despliega, pero el `appsscript.json` recibido contiene `USER_ACCESSING`. No hay que sustituir automáticamente una implementación que funciona. Comprueba la configuración real y la identidad con al menos dos cuentas del dominio antes de reproducir o cambiar el despliegue. No abras las hojas privadas a todos los miembros para resolver un fallo de permisos.
4. Implementa como aplicación web con acceso restringido al dominio, de acuerdo con la configuración verificada. Esta aplicación no requiere un trigger propio. Prueba también un correo no autorizado y un miembro marcado para borrado.

Para actualizar solo colores y filtros, sustituye `Index.html` y publica una nueva versión. Los permisos de los documentos enlazados siguen siendo los de Drive.

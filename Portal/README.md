# Portal LBG

El portal ofrece accesos a las aplicaciones de Participación y Gestión de Big Brother. Usa el logo y recursos gráficos BEST integrados en `Index.html`.

## Archivos

- `Index.html`: interfaz y cuatro enlaces a las aplicaciones web.
- `Code.gs`: `doGet`, obtención de cuenta y funciones de prueba heredadas.
- `appsscript.json`: manifiesto recibido como referencia.
- `LEEME.md`: instrucciones de la última actualización del portal.

## Instalar o actualizar

Sigue primero la [guía de instalación general](../INSTALACION.md). Si actualizas el portal existente y solo quieres los enlaces preparados, sustituye únicamente `Index.html`, guarda y actualiza la implementación existente con una nueva versión. No hace falta instalar activadores.

Si reconstruyes los proyectos de Big Brother, sus nuevas URLs `/exec` no serán necesariamente las antiguas: sustituye los cuatro `href` de `Index.html`. Revisa `CONFIG.DOMINIO`, `ADMIN_EMAIL` y `GRUPO_IT` en `Code.gs` si usas las funciones heredadas de prueba. Estas funciones no sustituyen los controles de acceso de cada aplicación; los enlaces de Gestión se muestran identificados, pero el permiso lo comprueba la aplicación de destino.

El manifiesto recibido indica ejecución como implementador y acceso del dominio. Confirma la configuración real y que el portal puede reconocer la cuenta en el entorno antes de compartirlo. El código no instala ni cambia las otras aplicaciones.

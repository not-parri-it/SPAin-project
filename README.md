# Intranet LBG · Portal y Big Brother

Proyecto de BEST Valencia basado en Google Apps Script. El portal enlaza a Big Brother: Miembros y Reuniones y votaciones, cada uno dividido en Gestión y Participación. La interfaz reutiliza la identidad visual BEST Valencia.

> **Estado de esta copia:** reúne los archivos preparados en la conversación hasta el 2 de noviembre de 2026. No se ha sincronizado con los proyectos desplegados; comprueba si allí hay cambios posteriores. Este repositorio es código de una aplicación conectada a Google Workspace: clonarlo no instala ni despliega la aplicación.

## Proyectos

| Proyecto | Carpeta | Función |
| --- | --- | --- |
| Portal | [Portal](Portal/README.md) | Entrada con enlaces a las cuatro aplicaciones. |
| Miembros · Gestión | [Gestión](BigBrother/Miembros/Gestion/README.md) | Altas, edición y cambios de estatus para Secretaría. |
| Miembros · Participación | [Participación](BigBrother/Miembros/Participacion/README.md) | Directorio e histórico en consulta. |
| Reuniones y votaciones · Gestión | [Gestión](BigBrother/Reuniones_y_votaciones/Gestion/README.md) | Convocatorias, censos y seguimiento. |
| Reuniones y votaciones · Participación | [Participación](BigBrother/Reuniones_y_votaciones/Participacion/README.md) | Justificaciones, delegaciones e historial propio. |

**Para entender la arquitectura, los procesos y las decisiones que otro LBG podría adaptar:** consulta [Cómo funciona Big Brother](COMO_FUNCIONA_BIG_BROTHER.md).

**Para instalar, actualizar o restaurar:** consulta [INSTALACION.md](INSTALACION.md). Los `LEEME` anteriores se conservan como referencia histórica; si sus nombres de archivo difieren de este paquete, usa los de la carpeta y la guía principal.

`Referencias/` contiene los recursos de identidad. En el ZIP completo también están las copias de prueba recibidas; el ZIP preparado para GitHub las excluye. El seguimiento utiliza una ventana separada para reuniones y votaciones; las justificaciones y delegaciones se excluyen del recuento. La propuesta a Inactive se envía a Board, sin cambiar automáticamente el estatus.

## Antes de compartir en GitHub

**Este paquete completo contiene datos y configuración de un entorno de prueba. No está listo para hacerse público sin revisarlo.** Hay identificadores de hojas y documentos, direcciones de correo, enlaces de aplicaciones y URLs en el código, además de datos en las copias de prueba. Algunos ejemplos de identidad también pueden contener información de ejemplo que conviene revisar. Un ID o URL no es necesariamente una contraseña, pero revisa si debe compartirse.

El ZIP preparado para GitHub excluye las copias de prueba y respaldos, pero **sigue conteniendo identificadores, correos y enlaces en el código y en documentación histórica**: revísalos antes de compartirlo. El ZIP completo conserva todos los archivos y debe tratarse como copia privada.

El `.gitignore` incluido excluye por defecto las copias de hojas y documentos, la conversación aportada, los ZIP de respaldo y los ejemplos visuales. **No oculta los valores ya escritos dentro del código**, no protege lo ya confirmado en Git, no anonimiza datos y no impide subir un archivo manualmente desde la web de GitHub. Antes del primer `git add`, revisa los archivos que vayan a incluirse y decide con BEST Valencia si el repositorio será privado o público. No subas credenciales ni tokens. Conserva la copia completa en un lugar privado.

Ejemplo para preparar un repositorio local, después de revisar el contenido:

```bash
git init
git status --short --ignored
git add .
git diff --cached --stat
git diff --cached
git status --short
git commit -m "Añadir Intranet LBG"
```

Revisa los cambios preparados y cancela el commit si aparece algo que no deba compartirse. El `.gitignore` actúa sobre archivos no rastreados; no retira datos del historial existente. Si algo sensible se sube por error, sigue la [guía de GitHub para retirarlo](https://docs.github.com/es/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) y gestiona las credenciales afectadas.

No se incluye una licencia: acuerda cuál corresponde a BEST Valencia antes de distribuirlo públicamente, incluidos sus logotipos y otros recursos de identidad.

## Pruebas locales

Con Node.js instalado:

```bash
node BigBrother/Miembros/Pruebas/colores_filtros.cjs
node BigBrother/Reuniones_y_votaciones/Tests/test_censo.js
node BigBrother/Reuniones_y_votaciones/Tests/censo_votacion.js
node BigBrother/Reuniones_y_votaciones/Tests/eventos.js
node BigBrother/Reuniones_y_votaciones/Tests/integracion.js
```

Las pruebas usan simulaciones de servicios de Google. La identidad, los permisos, la interfaz, los activadores y el correo deben comprobarse además en el Workspace de prueba.

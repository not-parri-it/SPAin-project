# Big Brother · Miembros · Gestión

Aplicación de Secretaría para administrar miembros y cambios de estatus. También publica una copia filtrada que consume Participación.

## Archivos

- `Código.gs`: acceso, operaciones de Miembros y cambios de estatus.
- `Publicador.gs`: publicación de los datos de consulta y trigger de sincronización. En instalaciones anteriores puede llamarse `MiembrosPublicador.gs`: actualiza el archivo equivalente, sin duplicar funciones.
- `Index.html`: interfaz administrativa, filtros y colores de estatus.
- `appsscript.json`: manifiesto recibido como referencia.

## Configuración e instalación

1. Consulta [INSTALACION.md](../../../INSTALACION.md), especialmente la tabla de IDs y el orden de inicialización.
2. En `Código.gs`, revisa `BB_CONFIG.DOMINIO`, `SECRETARIA_EMAILS`, `SPREADSHEET_ID` y `SPREADSHEET_CAMBIOS_ID`. En `Publicador.gs`, revisa `BB_MPUB.PUBLIC_ID`. Las hojas Miembros y Cambios deben tener sus pestañas y cabeceras previstas.
3. En un entorno nuevo de prueba, si falta preparar el esquema, ejecuta en ese orden `prepararHojaMiembros` y `prepararHojaCambios`; después ejecuta `reconstruirPublicacionMiembros` e `instalarSincronizacionMiembros`. Estas funciones escriben o preparan hojas: revisa antes qué recursos apuntan los IDs. La última crea `sincronizarMiembrosProgramado` cada cinco minutos.
4. La app de Gestión está diseñada para ejecutarse como usuario que accede y valida Secretaría en el servidor. La cuenta autorizada necesita permisos sobre los recursos. Implementa con acceso de dominio y prueba también una cuenta que no sea Secretaría.

Para actualizar solo los colores/filtros de una instalación compatible, basta con el `Index.html`; conserva el código de servidor y los activadores que funcionan. Consulta además el `LEEME_actualizacion.md` de la carpeta superior.

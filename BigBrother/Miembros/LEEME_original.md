# Big Brother · Miembros v1.1.0 — fichas desplegables y consulta completa

**Base:** Miembros v1.0.0 (Gestión + Participación, basada en la estable v0.3.8).
**Alcance:** solo las dos aplicaciones de Miembros. **No modificar el portal, Reuniones, Votaciones ni sus Sheets.**

## Qué cambia

- **Participación:** miembros en tarjetas desplegables, búsqueda, filtro por estatus y cuatro criterios de orden: estatus + antigüedad de unión (por defecto), unión de más antigua a más reciente, unión de más reciente a más antigua y apellidos. Datos al abrir la tarjeta: nombre y apellidos, estatus, fecha de unión, correo, teléfono y cambios de estatus, con documento/enlace si está registrado.
- **Histórico:** recupera también la columna `Documento` y los enlaces a los documentos originales, tanto en el historial general como dentro de las fichas. Es **solo lectura**.
- **Sin censura de estatus:** incluye Full, Baby, Observer, Alumni, Inactive, Guest, Granizados y cualquier estatus histórico de la hoja, siempre que la fila no esté marcada para borrado.
- **Gestión:** mantiene TODAS sus altas, ediciones, cambios de estatus y borrado lógico. Se refuerza la franja roja «SOLO SUPERADMINS · SECRETARÍA» y se añade una nota roja de acceso exclusivo. La comprobación real de acceso **sigue estando en el servidor**, no en el CSS.
- **Borrado lógico:** los miembros y los cambios marcados para borrado siguen sin aparecer en Participación. Las filas originales nunca se borran.

**Importante sobre «público»:** son datos consultables por miembros autenticados del dominio y registrados en Miembros, NO una web abierta a todo Internet. No compartas los Sheets directamente con todos. Los enlaces a documentos se muestran, pero Google Drive sigue aplicando permisos a cada documento: si un informe no es accesible para el miembro, tendrá que concederse permiso sobre ese documento.

## Estructura del ZIP

```
Gestion/
  Code.gs                 (sin cambios funcionales respecto a v1.0.0)
  Index.html              (señalización roja reforzada)
  MiembrosPublicador.gs   (publicación ampliada a todos los campos consultables)
Participacion/
  Code.gs                 (API de lectura con todos los campos)
  Index.html              (tarjetas desplegables e historial documental)
Tests/
  test_integracion.js
LEEME.md
miembros_escritorio.png
miembros_movil.png
```

## Instalación segura si ya montaste v1.0.0

1. **Haz una copia de seguridad** de `Gestion/Index.html`, `Gestion/MiembrosPublicador.gs`, `Participacion/Code.gs` y `Participacion/Index.html` que tienes desplegados.
2. Abre el Apps Script de **Miembros — Gestión** (el antiguo, que sigue ejecutándose como «Usuario que accede»).
3. Sustituye **`MiembrosPublicador.gs`** por `Gestion/MiembrosPublicador.gs` de este paquete.
4. Sustituye **`Index.html`** de Gestión por `Gestion/Index.html`.
5. **No hace falta cambiar `Code.gs` de Gestión** si estás en v1.0.0: el incluido es solo la versión completa de referencia. Sus funciones y sus permisos siguen igual.
6. Guarda y, desde el editor de **Gestión**, ejecuta **`reconstruirPublicacionMiembros`** UNA VEZ. Esto amplía automáticamente las dos pestañas públicas existentes, sin destruirlas ni crear otras nuevas. Las columnas que ya existían se conservan en el mismo orden, para que la versión antigua de Participación no se rompa durante la actualización. Revisa `BigBrother_Publicacion`: `Miembros_publicos` debe tener siete columnas y `Cambios_estatus_publicos` ocho.
7. En Gestión: **Implementar → Gestionar implementaciones → Lápiz → Nueva versión → Implementar**. Se conserva el enlace actual. No cambies «Ejecutar como: Usuario que accede».
8. Abre **Miembros — Participación** (el proyecto independiente). Sustituye **`Code.gs`** y **`Index.html`** por los de `Participacion/`.
9. Guarda y actualiza esa implementación existente usando **Gestionar implementaciones → Lápiz → Nueva versión → Implementar**. Mantén «Ejecutar como: Yo» y el acceso restringido al dominio `bestvalencia.org`.
10. Prueba desde un usuario Full/Baby: abre una tarjeta, comprueba correo, teléfono, fecha de unión, cambios y enlaces documentales; cambia el criterio de orden y filtra por estatus. Verifica que no existen botones de edición y que no puede abrir el Sheet privado directamente.
11. Comprueba desde tu cuenta de administrador la franja roja de Gestión y que siguen funcionando las operaciones originales. Desde una cuenta de miembro normal, Gestión debe mostrar **«Haber sido secretario crack 😎»** y bloquear las llamadas de edición.

**No necesitas crear Sheets, columnas manualmente, triggers nuevos ni implementaciones nuevas.** El trigger cada cinco minutos instalado para v1.0.0 seguirá usando el nuevo publicador. Las ediciones desde Gestión también publican inmediatamente.

## IDs ya incorporados

| Recurso | ID |
|---|---|
| Miembros privados | `1IZxJW6VMdmBzICjVOCEQXpe7hHu7oTcKc3tVMEp0yPY` |
| Cambios de estatus privados | `1StwdcqsKtdTiADLAMBAjsacVX7_vBsngNrh1vr7nwfQ` |
| BigBrother_Publicacion | `150EVu_CoRCucmJMbv1ihFBWmAXqEI1QoKpQ_abfE48s` |

La aplicación **no toca** `BigBrother_Participacion_Privada`, que sigue reservada a las justificaciones y delegaciones del otro Big Brother.

## Esquema publicado tras reconstruir

- `Miembros_publicos`: `Nombre | Apellidos | Estatus | Correo | Fecha_union | Telefono | ID_Miembro`.
- `Cambios_estatus_publicos`: `Fecha | Nombre | Apellidos | Nuevo_estatus | Documento | URL_documento | ID_Miembro | ID_Cambio`.
- `Miembros_publicacion_meta`: `Clave | Valor`.

Los IDs son técnicos, necesarios para relacionar cambios de estatus con la persona correcta, especialmente si existen homónimos. **No se muestran en las fichas.**

Las primeras **tres** columnas del directorio y las primeras **cuatro** del histórico siguen como antes, para que el proceso de despliegue sea compatible con v1.0.0.

Si algún dato histórico de unión tiene un formato no normalizado, lo conservamos en pantalla tal cual. En los criterios de ordenación, las fechas reconocibles se ordenan primero; las no interpretables quedan al final.

## Pruebas y límites

- Prueba de integración local con todos los estatus, correo/teléfono, histórico con documentos y links, cambio de esquema anterior a nuevo, borrado lógico y no modificación de las pestañas de Reuniones/Votaciones.
- Validación de bloqueo administrativo en el servidor; Participación no tiene funciones de escritura.
- Prueba visual local en Chromium, escritorio y móvil, con datos **ficticios**. Las capturas del ZIP son orientativas y no muestran datos reales.
- Aún debe validarse el resultado con las cuentas reales de BEST Valencia y los permisos concretos de los documentos de Drive.

**Volver atrás:** restaura los archivos guardados y vuelve a publicar otra versión en cada implementación. La publicación ampliada mantiene las columnas iniciales anteriores, por lo que la versión v1.0.0 de Participación puede seguir leyendo los primeros campos.

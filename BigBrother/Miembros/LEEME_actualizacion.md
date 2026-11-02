# Big Brother · Miembros: colores y filtros

Esta actualización parte de los archivos `Index.html` de Gestión y Participación de Miembros que compartiste. Cambia solo la presentación de los directorios y de los distintivos de estatus.

## Instalación

1. En el proyecto **Gestión - Miembros y cambios de estatus**, sustituye todo el contenido de `Index.html` por el archivo de la carpeta `Gestion`. Guarda y actualiza la implementación existente con una **Nueva versión**.
2. En el proyecto **Participación - Miembros y cambios de estatus**, sustituye todo el contenido de `Index.html` por el archivo de la carpeta `Participacion`. Guarda y actualiza la implementación existente con una **Nueva versión**.
3. Recarga ambas aplicaciones y prueba los filtros y la búsqueda. Conserva los archivos `Código`, `Publicador`, `appsscript.json`, las hojas y los activadores que ya tienes.

## Funcionamiento

- El filtro inicial en ambas aplicaciones es **Actives**, que incluye Full, Baby y Observer, igual que la categoría existente de Gestión. También hay Alumnis, Inactives, Otros y Todos; Otros incluye Guest y los distintos Granizados.
- Colores de los distintivos: Full verde, Baby azul, Observer naranja, Granizados amarillos, Alumni morado, Guest granate e Inactive gris. Los estatus desconocidos usan un tono neutro.
- Hay separadores entre estatus. En Participación las opciones de ordenación por fecha o apellidos mantienen su orden global; si ese orden mezcla estatus, el separador puede volver a aparecer cuando cambie el estatus en la lista.
- Los cambios solo afectan a la interfaz. No se cambian miembros, estatus ni permisos en Google Sheets.

Se han comprobado localmente los filtros, la clasificación, los separadores, los colores y la sintaxis. Falta comprobar las dos pantallas en el Workspace real.

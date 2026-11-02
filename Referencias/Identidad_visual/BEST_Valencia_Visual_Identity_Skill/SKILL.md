---
name: best-valencia-visual-identity
description: Aplica la identidad visual de BEST Valencia a presentaciones, documentos, diagramas, recursos gráficos y prototipos de intranet o web. Prioriza los logos y recursos geométricos originales, la paleta BEST y el perfil equilibrado; admite un perfil más libre bajo petición.
---

# BEST Valencia · Visual Identity

## Misión
Cuando el usuario pida diseñar o reformatear materiales de BEST Valencia, aplicar una identidad visual consistente, fresca, profesional y reutilizable. Entregar archivos realmente editables cuando el formato solicitado lo permita. Esta skill NO autoriza alterar nombres, datos, estructura institucional ni afirmaciones del documento fuente.

## Fuente de verdad y prioridades
1. Los archivos originales incluidos en `assets/` tienen prioridad para logotipos, encabezados, pies y composiciones oficiales existentes. **No reconstruir, reinterpretar ni inventar un logo si el original está disponible.**
2. Colores corporativos aportados: azul `#1973BE`, verde `#69CD28`, naranja `#FAA519`. Son la base de la identidad. Ver `references/paleta.json` para colores funcionales **propuestos**, que NO equivalen a colores oficiales.
3. La estética geométrica/poligonal de los recursos es una firma visual. Utilizarla estratégicamente (principalmente portadas, separadores, cabeceras y pies), sin saturar.
4. Preferencia expresada por el usuario: colores y paleta funcional, encabezados/pies y logos importan más que la tipografía. La elección tipográfica es flexible, legible y moderna; nunca hacer de la tipografía una restricción rígida.
5. Mantener fielmente el contenido fuente; distinguir correcciones de estilo de cambios de contenido. Datos temporales, organigramas, horarios y métricas deben verificarse o tratarse como históricos.

## Perfil de diseño (elegir antes de construir)
- `equilibrado` (por defecto): mantiene los recursos geométricos reales, colores corporativos y logotipos; moderniza retículas, márgenes, tipografía, orden visual, proporciones, jerarquía y uso del blanco.
- `libre` (solo si el usuario lo pide): conserva logos, colores base y reconocimiento de BEST pero permite nuevas composiciones geométricas, variantes cromáticas funcionales y disposiciones visuales más creativas. No afirmar que esas variantes son oficiales.
- Si el usuario solicita otro perfil, definirlo como variante sobre el mismo núcleo; no reemplazar los activos maestros.

## Reglas de color
- Azul: identidad, navegación, títulos, enlaces, contenedores institucionales.
- Verde: áreas secundarias, acentos positivos y algunas tarjetas de contenido; en elementos textuales asegurar suficiente contraste.
- Naranja: énfasis puntual, acciones y elementos destacados; evitar usar naranja saturado sobre blanco para texto pequeño.
- Blancos, grises suaves y tinta azul oscuro crean jerarquía; evitar que cada bloque sea un color saturado.
- Valores hex, usos y contrastes: `references/paleta.json`. Los tonos extra son **propuestas**, no valores extraídos del manual.
- Verificar contraste visual mínimo recomendado de 4.5:1 para texto normal, 3:1 para texto grande y elementos esenciales cuando sea posible.

## Reglas de logos y assets
- Seleccionar un archivo de `assets/logos/` según fondo y contexto. Conservar proporciones, sin estirar ni recolorear arbitrariamente; reservar espacio libre.
- Priorizar `.svg` cuando el sistema de destino lo soporte y PNG oficial si no.
- El paquete contiene variantes locales BEST Valencia y recursos históricos. No cambiar el logo principal por una variante cromática sin motivo.
- Cabeceras y pies originales: `assets/geometria/`. No crear imágenes parecidas desde cero salvo ausencia o petición explícita.
- Elegir UNA franja dominante en slides de contenido; en portadas se admite una presencia geométrica más marcada. No colocar un pie decorativo sobre contenido ni invadir el área de lectura.
- Si un formato no puede insertar un recurso sin perder fidelidad, explicarlo y ofrecer exportación.

## Presentaciones
- Formato por defecto: 16:9. Usar una retícula consistente y márgenes respirables.
- Portada: logo oficial y recurso `Fondo_básico de título.png` si encaja; título dominante y subtítulo limpio.
- Diapositivas interiores: espacio de contenido prioritario; logo discreto, numeración si es útil, y pie ligero con una de las variantes reales.
- Secciones: usar fondos claros, tipografía muy legible y acentos BEST. Gráficos y tablas con estructura, no recargar con tres colores fuertes a la vez.
- Evitar collages amontonados y desalineaciones; si hay muchas fotos, repartir en varias slides o usar una cuadrícula.
- No inventar hechos, cifras, miembros de Board ni departamentos; usar el documento original o preguntar.
- Entregar `.pptx` editable cuando sea viable, preparado para abrir/importar en Google Slides. La creación directamente en Drive depende de que haya una integración conectada y con permiso.

## Documentos
- Portada clara; encabezado geométrico original con uso moderado; logo en zona constante; pies que no compitan con los textos.
- Cuerpo legible, estructura H1/H2/H3, tablas sobrias, margen generoso; usar fondos de color suave para alertas/citas.
- Adaptar y recortar assets a cada página sin distorsionarlos.

## Diagramas y organigramas
- Mejorar orden, jerarquía, alineación, conectores ortogonales y aire. Colores de contenedor + tonos suaves para nodos.
- En diagramas jerárquicos: direccionalidad inequívoca; las flechas deben conectar con los nodos adecuados, sin cruces innecesarios.
- Si el usuario aporta roles/departamentos exactos, transcribirlos literalmente; no inferir otros.
- Si se pide archivo draw.io, producir XML `.drawio` editable, no sustituirlo por imagen plana.

## Web e intranet (orientativo, NO normativo todavía)
- Reutilizar design tokens y assets, pero no imponer framework ni estructura UX de forma prematura.
- Proponer componentes accesibles: cabecera, navegación, botones, tarjetas, tablas, estados y responsive. Reutilizar colores de forma funcional.
- Distinguir siempre las ideas/prototipos de un estándar corporativo aprobado.

## Flujo de trabajo
1. Identificar pieza y público (slide, documento, organigrama, portada, prototipo web).
2. Usar `equilibrado` salvo que se solicite `libre`.
3. Revisar recursos originales y elegirlos en vez de recrearlos.
4. Identificar contenido fuente y conservarlo, avisando si hay datos antiguos.
5. Construir material editable y coherente con la paleta funcional.
6. Revisar cada página/slide y comprobar legibilidad, contraste, deformación de logos, márgenes, texto cortado y conexiones.
7. Entregar el archivo final indicando qué es oficial, qué es propuesta y qué queda pendiente.

## Referencias y archivos
- `references/paleta.json`: tokens visuales funcionales (propuesta) + colores corporativos aportados.
- `references/recursos.md`: inventario y pautas de uso de cada asset.
- `assets/logos/`: originales suministrados por el usuario.
- `assets/geometria/`: encabezados, pies y fondo de título originales.
- `assets/ejemplos/`: ejemplos existentes, únicamente como referencia, no reglas inamovibles.

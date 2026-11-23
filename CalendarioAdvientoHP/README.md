# El cuarto campeón — Calendario de Adviento HP

Aplicación web estática para el calendario de Adviento 2026.

## Tecnologías
- HTML, CSS y JavaScript nativo.
- Contenido editable en JSON.
- Progreso local mediante `localStorage`.
- PWA básica mediante manifest y service worker.
- Publicación prevista con GitHub Pages.

## Desarrollo local
Abrir mediante un servidor estático (por ejemplo, Live Server). No se recomienda abrir `index.html` directamente porque el navegador puede bloquear la carga del JSON mediante `fetch`.

## Editor de contenido
El editor permite modificar los 24 días en el navegador, guardar una copia local e importar/exportar `days.json`.

Los cambios del editor se guardan en el navegador actual. Para publicar contenido:
1. Exportar `days.json` desde el editor.
2. Sustituir `CalendarioAdvientoHP/data/days.json` en la rama `NAVIDAD26`.
3. Confirmar el commit y esperar al despliegue de GitHub Pages.

## Persistencia
El progreso y los objetos se guardan en `localStorage`. Se mantienen en el mismo navegador y dispositivo, pero no se sincronizan entre dispositivos ni se comparten con el administrador. Borrar los datos del navegador puede eliminar el progreso.

## Privacidad
GitHub Pages sirve contenido público. El enlace no funciona como autenticación. No publicar aquí información o archivos que deban permanecer privados.

## Estado
Esqueleto inicial: navegación, calendario, cuaderno, editor y persistencia básica. Los 24 retos y los recursos definitivos están pendientes de diseño.
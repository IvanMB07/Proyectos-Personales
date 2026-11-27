# La Estrella de Invierno · Calendario de Navidad de Hogwarts

Calendario interactivo de 24 días, concebido como una aventura personal de Navidad para Andrea dentro del universo de Harry Potter. La protagonista recibe una invitación de Minerva McGonagall para investigar por qué la Estrella de Invierno ha perdido su luz. A lo largo de diciembre reúne cuatro sellos, recupera sus valores y descubre el orden que abre la cámara de Nochebuena.

La historia está escrita para que los datos personales se introduzcan desde el navegador. No hace falta modificar JavaScript ni JSON para personalizar el regalo.

## Empezar a editar

### Opción recomendada: abrir el editor en el navegador

1. Descomprime la carpeta del proyecto.
2. Abre una terminal dentro de esa carpeta y ejecuta:

   ```bash
   python -m http.server 8000
   ```

3. Abre `http://localhost:8000/editor.html` en el navegador.
4. En **Datos personales del regalo**, completa el nombre de la protagonista, tu nombre, una fecha importante y el lugar donde estará el regalo. El recuerdo compartido es opcional.
5. Recorre los 24 días. Puedes cambiar títulos, instrucciones, respuestas, pistas, evidencias y configuraciones, y abrir la previsualización para probar cada reto.
6. Pulsa **Guardar datos personales** y **Guardar borrador**. También puedes exportar un respaldo JSON antes de hacer cambios grandes.
7. Cuando esté todo preparado, pulsa **Preparar versión para Andrea**. El editor descarga un nuevo `calendario-publicado.js`.

El editor guarda el borrador en el almacenamiento local del navegador. Para recuperarlo, utiliza el mismo navegador, perfil y dirección (`localhost:8000`). `Guardar borrador` no modifica los archivos del proyecto ni el repositorio.

### Personalización automática

- **Nombre de la protagonista:** aparece en la invitación y en la carta final.
- **Tu nombre:** firma el mensaje de Nochebuena.
- **Fecha importante:** se incorpora a la historia y se convierte automáticamente en seis cifras (`DDMMAA`) para resolver el pergamino del día 4. No edites manualmente esa cuadrícula ni su respuesta.
- **Recuerdo compartido:** aparece en la carta final. Es opcional y, si se deja vacío, se utiliza una frase neutra.
- **Lugar del regalo:** aparece en la última pista del día 24.

No publiques una versión definitiva hasta comprobar que los datos personales son correctos y que el lugar del regalo está escrito como quieres que Andrea lo lea.

## Publicar en GitHub Pages

1. En el editor, completa y prueba la aventura.
2. Pulsa **Preparar versión para Andrea** y guarda el `calendario-publicado.js` descargado.
3. Sustituye el `calendario-publicado.js` del repositorio por el archivo nuevo y haz commit/push.
4. Espera a que GitHub Pages despliegue el commit y abre la dirección del calendario. La página principal es `index.html`; el editor está en `editor.html`.

El editor no escribe directamente en GitHub: prepara el archivo para que tú lo subas. Si editas desde la URL publicada, el borrador seguirá almacenado solo en el navegador desde el que lo estés editando.

## Cómo se organiza la historia

| Acto | Días | Función narrativa |
|---|---:|---|
| I. La invitación y el archivo | 1–7 | Andrea recibe la misión, encuentra el grimorio y descubre que la Estrella está protegida por cuatro sellos. |
| II. Los mecanismos de Hogwarts | 8–14 | Recorre el castillo, llega al observatorio y recupera el sello del Reloj. |
| III. La luz y las fases | 15–18 | Reconstruye los registros lunares y recupera el sello de la Estrella. |
| IV. La cámara de Nochebuena | 19–24 | Sigue las últimas instrucciones, recupera el sello de la Copa, averigua el orden y abre la cámara. |

Los cuatro valores narrativos son **Pluma = 3**, **Reloj = 9**, **Copa = 4** y **Estrella = 6**. El día 23 establece el orden **Reloj → Pluma → Copa → Estrella**; la combinación final del día 24 es **9346**. Si modificas alguno de esos datos, revisa también las pruebas y pistas que dependen de él.

## Pruebas y evidencias

Los días utilizan formatos variados: fragmentos visuales, cerraduras, anagramas, papel perforado, mensajes reflejados, engranajes, diagnóstico de visores, lógica numérica, recorridos, anillos, ahorcado, vitrales, secuencias de ascensor, registros lunares, nonogramas y cuadros eléctricos.

Las evidencias aparecen en el cuaderno cuando se resuelve el día que las entrega. Los capítulos posteriores pueden declarar dependencias de evidencias anteriores; el editor comprueba que esas referencias existan y que no apunten a días futuros.

## Límites y privacidad

- Es una web estática: no hay servidor de cuentas ni sincronización entre dispositivos.
- El modo de edición es una página del mismo sitio (`editor.html`). No tiene contraseña ni autenticación; cualquier persona que conozca la dirección puede abrirlo. `noindex` solicita a los buscadores que no indexen la página, pero no restringe el acceso.
- El progreso y los borradores se guardan en el almacenamiento local del navegador. Borrar los datos del sitio o cambiar de navegador puede hacer que no estén disponibles; exporta respaldos JSON con regularidad.
- El calendario publicado funciona en el navegador y necesita llevar sus respuestas y configuraciones en archivos descargables. Por tanto, una persona con acceso al sitio puede inspeccionar `calendario-publicado.js`, conocer las soluciones y leer los datos personales incluidos en la publicación. No incluyas información sensible.
- Para una sorpresa privada, mantén el editor y el repositorio fuera del acceso público hasta el momento de entregar el regalo, o utiliza una solución con autenticación y almacenamiento privado. GitHub Pages no convierte los archivos del juego en secretos.

## Comprobaciones técnicas

Con Node.js instalado, desde la carpeta del proyecto ejecuta:

```bash
node tests/calendario.test.cjs
```

La prueba verifica que haya 24 capítulos válidos, que las dependencias estén resueltas, que la personalización del día 4 genere la fecha esperada, que los cuatro sellos formen el código final y que las configuraciones principales sean coherentes.

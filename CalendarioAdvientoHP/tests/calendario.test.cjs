const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
global.window = global;
for (const file of [
  'escape-room.js', 'calendario-publicado.js', 'recursos-reto.js',
  'retos-avanzados.js', 'mecanismos.js', 'experiencias.js',
  'cerradura-transmisiones.js', 'vista-reto.js'
]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

const ER = global.EscapeRoom;
const M = ER.mecanismos;
const datos = ER.calendario(global.CALENDARIO_PUBLICADO);

// Integridad del calendario, de la historia y de las referencias del cuaderno.
assert.equal(datos.capitulos.length, 24, 'El calendario contiene 24 capítulos.');
assert.equal(datos.partida, 'andrea-hogwarts-2026');
assert.equal(datos.personalizacion.destinataria, 'Andrea');
for (const dia of ER.dias) {
  const reto = datos.capitulos[dia - 1];
  assert(reto.titulo, `El día ${dia} tiene título.`);
  assert(reto.instrucciones, `El día ${dia} tiene instrucciones.`);
  assert(reto.contexto, `El día ${dia} tiene contexto narrativo.`);
  assert(reto.transicion, `El día ${dia} hace avanzar la historia.`);
  assert.equal(reto.listo, true, `El día ${dia} está marcado como listo.`);
  assert.deepEqual(ER.errores(datos, dia), [], `El día ${dia} no tiene errores de configuración.`);
  for (const id of reto.dependencias) {
    const numero = Number(id.replace('evidencia-', ''));
    assert(Number.isInteger(numero) && numero >= 1 && numero < dia, `La dependencia ${id} del día ${dia} es anterior.`);
    assert(ER.evidencias(datos).some(e => e.id === id), `La evidencia ${id} existe.`);
  }
}
const relato = JSON.stringify(datos);
const terminosRetirados = [['Cin', 'tia'], ['Tama', 'gotchi'], ['hue', 'vo'], ['cuarto', ' campeón'], ['caja-adviento-', 'v4']];
assert(terminosRetirados.every(partes => !relato.toLowerCase().includes(partes.join('').toLowerCase())),
  'La campaña no contiene restos de la historia anterior.');
assert.match(datos.experiencia.historiaTexto, /Estrella de Invierno/);
assert.match(datos.experiencia.cartaTexto, /Minerva McGonagall/);
assert.match(datos.capitulos[23].transicion, /{{REMITENTE}}/);
assert.match(datos.capitulos[2].descubrimientoTitulo, /lámina/i);
assert.match(datos.capitulos[2].descubrimientoTexto, /siete segmentos/);
assert.match(datos.capitulos[23].premio, /La Estrella de Invierno vuelve a brillar/);
assert.match(fs.readFileSync(path.join(root, 'vista-reto.js'), 'utf8'), /if \(reto\.premio\) resultado\.append/);
assert.doesNotMatch(fs.readFileSync(path.join(root, 'recursos-reto.js'), 'utf8'), /M\.digitos/,
  'El dibujo de la lámina no depende de un objeto M inexistente.');

// Los datos personales se mantienen como marcadores hasta que el juego se inicia.
assert(ER.erroresPersonalizacion(datos).some(e => /nombre para la firma/.test(e)));
const personalizacion = {
  destinataria: 'Andrea',
  remitente: 'Iván',
  fechaEspecial: '2023-07-16',
  recuerdoCompartido: 'Nuestro primer viaje a la costa',
};
const aventura = ER.personalizar({ ...datos, personalizacion });
assert.deepEqual(ER.erroresPersonalizacion({ ...datos, personalizacion }), []);
assert.deepEqual(aventura.capitulos[3].respuestas, ['160723'], 'La fecha genera el código DDMMAA.');
assert.match(aventura.capitulos[3].transicion, /16 de julio de 2023/);
assert.match(aventura.capitulos[23].transicion, /Iván/);
assert.match(aventura.capitulos[23].transicion, /Nuestro primer viaje a la costa/);
assert(!aventura.capitulos[23].transicion.includes('{{LUGAR_REGALO}}'));
assert.match(aventura.experiencia.cartaTexto, /Andrea/);
assert.equal(datos.capitulos[3].respuestas[0], '{{FECHA_ESPECIAL_CODIGO}}', 'El borrador conserva el marcador editable.');
assert.deepEqual(ER.personalizar({ ...datos, personalizacion: { ...personalizacion, fechaEspecial: '2023-02-30' } }).capitulos[3].respuestas, ['000000']);

// Cuatro sellos y orden final: Reloj 9, Pluma 3, Copa 4, Estrella 6.
assert.match(datos.capitulos[5].evidenciaTexto, /PLUMA = 3/);
assert.match(datos.capitulos[11].evidenciaTexto, /RELOJ = 9/);
assert.match(datos.capitulos[17].evidenciaTexto, /ESTRELLA = 6/);
assert.match(datos.capitulos[21].evidenciaTexto, /COPA = 4/);
assert.deepEqual(datos.capitulos[22].orden, ['Reloj', 'Pluma', 'Copa', 'Estrella']);
assert.equal(datos.capitulos[23].combinacion, '9346');
assert(ER.acertada(datos.capitulos[23], '9346'));

// Día 2: la ruta de la cerradura de tres ruedas llega al objetivo.
{
  const c = JSON.parse(datos.capitulos[1].configuracion);
  assert(ER.experiencias.configValida(c));
  const ruta = ER.experiencias.ruta(c);
  assert(ruta?.length > 0);
  let estado = { posiciones: [...c.inicio] };
  for (const paso of ruta) estado = ER.experiencias.girar(estado, paso.rueda, paso.sentido);
  assert(ER.experiencias.alineada(c, estado));
}

// Días 6 y 12: las secuencias de engranajes de los dos sellos se pueden ejecutar.
for (const dia of [6, 12]) {
  const c = JSON.parse(datos.capitulos[dia - 1].configuracion);
  let estado = M.inicial('engranajes', c);
  for (const paso of c.solucion) {
    estado = paso === 'embrague' ? { ...estado, embrague: !estado.embrague } : M.girarEngranajes(c, estado, paso);
  }
  assert(M.completa('engranajes', c, estado), `La secuencia del día ${dia} alinea los engranajes.`);
}

// Días 1 y 22: los fragmentos se agrupan por marca y forman los códigos anunciados.
{
  const digitos = {
    abcdef: '0', bc: '1', abdeg: '2', abcdg: '3', bcfg: '4', acdfg: '5', acdefg: '6', abc: '7',
    abcdefg: '8', abcdfg: '9'
  };
  for (const [dia, esperado] of [[1, '934'], [22, '964']]) {
    const fotogramas = JSON.parse(datos.capitulos[dia - 1].configuracion).fotogramas;
    const grupos = ['I','II','III'].map(marca => {
      const segmentos = [...new Set(fotogramas.filter(f => f.marca === marca).flatMap(f => [...f.segmentos]))].sort().join('');
      return digitos[segmentos] ?? '?';
    }).join('');
    assert.equal(grupos, esperado);
  }
}

// Día 7: cada visor identifica una sola cifra y la consulta reconstruye 8052.
{
  const c = JSON.parse(datos.capitulos[6].configuracion);
  const cifras = c.visores.map(v => M.candidatasVisor(v));
  assert(cifras.every(v => v.length === 1));
  assert.equal(cifras.map(v => v[0]).join(''), c.solucion);
  assert.equal(c.solucion, '8052');
  assert.match(datos.capitulos[6].pregunta, /cuatro cifras/);
}

// Día 8 y día 21: los paneles eléctricos tienen una única solución dentro del límite.
for (const dia of [8, 21]) {
  const c = JSON.parse(datos.capitulos[dia - 1].configuracion);
  const soluciones = ER.especiales.solucionesElectricas(c);
  assert.equal(soluciones.length, 1, `El panel del día ${dia} tiene solución única.`);
  assert.deepEqual(soluciones[0], c.solucion ?? (dia === 8 ? [2, 4, 5, 9] : null));
}

// Día 10: las casillas finales reales, no las intermedias, forman OBSERVATORIO.
{
  const c = JSON.parse(datos.capitulos[9].configuracion);
  const filas = c.filas.map(fila => fila.trim().split(/\s+/));
  let [y, x] = c.inicio;
  let palabra = filas[y - 1][x - 1];
  for (const [direccion, pasos] of c.movimientos) {
    for (let i = 0; i < pasos; i++) {
      if (direccion === 'Norte') y--;
      if (direccion === 'Sur') y++;
      if (direccion === 'Este') x++;
      if (direccion === 'Oeste') x--;
    }
    assert(y >= 1 && y <= filas.length && x >= 1 && x <= filas[0].length, 'El recorrido no sale del tablero.');
    palabra += filas[y - 1][x - 1];
  }
  assert.equal(palabra, 'OBSERVATORIO');
  assert.equal(palabra, datos.capitulos[9].respuestas[0]);
}

// Día 11: la secuencia del astrolabio supera los cuatro anillos.
{
  const c = JSON.parse(datos.capitulos[10].configuracion);
  assert.deepEqual(M.errores('anillos', c), []);
  let estado = M.inicial('anillos', c);
  for (const accion of c.solucion) estado = M.moverAnillos(c, estado, accion);
  assert.equal(estado.bola.anillo, c.anillos.length);
}

// Día 14: cada modelo de vitral tiene una solución de superposición única.
{
  const c = JSON.parse(datos.capitulos[13].configuracion);
  assert.deepEqual(M.errores('vitral', c), []);
  for (const modelo of c.modelos) {
    assert.equal(M.solucionesVitral(c, modelo.opaco).length, 1, `${modelo.nombre} tiene solución única.`);
    assert.deepEqual(M.solucionesVitral(c, modelo.opaco)[0], c.soluciones[modelo.id]);
  }
}

// Día 15: reproduce la aritmética y confirma los pisos anotados en las campanadas.
{
  let piso = 12;
  const inicio = piso;
  piso += 7; const primero = piso;
  piso *= 2;
  piso = Number(String(piso).split('').reverse().join('')); const segundo = piso;
  piso -= String(piso).split('').reduce((a, n) => a + Number(n), 0);
  piso /= 3;
  piso += inicio; const tercero = piso;
  piso = Number(String(piso).split('').reverse().join(''));
  piso -= 24;
  piso /= 3; const cuarto = piso;
  piso += primero;
  piso = Number(String(piso).split('').reverse().join(''));
  piso -= inicio;
  assert.deepEqual([segundo, tercero, cuarto, piso], [83, 36, 13, 11]);
  assert.equal(datos.capitulos[14].respuestas[0], '83361311');
  assert.equal([segundo, tercero, cuarto, piso].join(''), datos.capitulos[14].respuestas[0]);
}

// Días 16 y 18: los valores lunares resuelven el registro y producen el tercer sello.
{
  const registro = datos.capitulos[15];
  assert.deepEqual(ER.especiales.errores(registro), []);
  assert(ER.especiales.acertada(registro, ['4', '2', '6', '5']));
  const maquina = datos.capitulos[17];
  const c = JSON.parse(maquina.configuracion);
  const salida = c.valores[2] * c.valores[3] - (c.valores[0] + c.valores[1]);
  const suma = [...String(salida)].reduce((total, cifra) => total + Number(cifra), 0);
  assert.equal(salida, c.salida);
  assert.equal(suma, c.resultado);
  assert(ER.especiales.acertada(maquina, {ruedas: c.valores.map(String), salida: String(salida), resultado: String(suma)}));
}

// Día 17: el nonograma tiene una única solución y se puede resolver por deducciones.
{
  const c = JSON.parse(datos.capitulos[16].configuracion);
  const revision = M.resolverNonograma(c.solucion);
  assert.equal(revision.soluciones.length, 1);
  assert.equal(revision.deducible, true);
}

// Las dos pruebas perforadas se leen de manera determinista.
function leerPlantilla(config) {
  return config.filas.map((fila, y) => fila.split(/\s+/).filter((_, x) => config.agujeros[y][x] === '1').join('')).join('');
}
{
  const d4 = JSON.parse(aventura.capitulos[3].configuracion);
  assert.equal(leerPlantilla(d4), '160723');
  const d20 = JSON.parse(datos.capitulos[19].configuracion);
  assert.equal(leerPlantilla(d20), 'BAJOLALUZDELALUNA');
}

// Los dos problemas de orden tienen exactamente la secuencia prevista.
assert(ER.acertada(datos.capitulos[18], ['Espejo', 'Campana', 'Luna', 'Estrella']));
assert(ER.acertada(datos.capitulos[22], ['Reloj', 'Pluma', 'Copa', 'Estrella']));
assert(ER.acertada(datos.capitulos[8], '593'));
assert(ER.especiales.acertada(datos.capitulos[12], [...new Set('LA MAGIA ESTA EN LOS DETALLES'.replaceAll(' ', ''))]));
assert(ER.acertada(datos.capitulos[21], '964'));

// Fechas y llaves conservan la progresión diaria del calendario.
assert.equal(ER.estado(1, '2026-11-30', ER.progreso()), 'futura');
assert.equal(ER.estado(1, '2026-12-01', ER.progreso()), 'disponible');
assert.equal(ER.estado(2, '2026-12-01', ER.progreso({ resueltos: [1] })), 'futura');
assert.equal(ER.estado(2, '2026-12-02', ER.progreso({ resueltos: [1] })), 'disponible');
assert.deepEqual(ER.calendario(JSON.parse(JSON.stringify(datos))), datos, 'El respaldo conserva la configuración.');

// La lógica del candado y las dos ordenaciones finales tienen solución única.
{
  const permutaciones = valores => valores.length ? valores.flatMap((v, i) =>
    permutaciones(valores.filter((_, j) => j !== i)).map(resto => [v, ...resto])) : [[]];
  const codigos = [];
  for (let a = 1; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 0; c <= 9; c++) {
    const s = `${a}${b}${c}`;
    if (new Set(s).size !== 3) continue;
    const pertenece = intento => [...intento].filter(d => s.includes(d)).length;
    const bien = intento => [...intento].filter((d, i) => s[i] === d).length;
    if (pertenece('682') !== 0) continue;
    if (pertenece('514') !== 1 || bien('514') !== 1) continue;
    if (pertenece('905') !== 2 || bien('905') !== 0) continue;
    if (pertenece('327') !== 1 || bien('327') !== 0) continue;
    if (pertenece('859') !== 2 || bien('859') !== 0) continue;
    codigos.push(s);
  }
  assert.deepEqual(codigos, ['593']);
  const ordenaciones = (elementos, reglas) => permutaciones(elementos).filter(reglas);
  const posibles19 = ordenaciones(['Espejo','Campana','Luna','Estrella'], p =>
    p.indexOf('Campana') + 1 === p.indexOf('Luna') && p.indexOf('Estrella') > p.indexOf('Luna')
      && (p[0] === 'Espejo' || p[3] === 'Espejo')
      && Math.abs(p.indexOf('Estrella') - p.indexOf('Espejo')) !== 1);
  assert.deepEqual(posibles19, [['Espejo','Campana','Luna','Estrella']]);
  const posibles23 = ordenaciones(['Reloj','Pluma','Copa','Estrella'], p =>
    p[0] === 'Reloj' && p[3] === 'Estrella' && p.indexOf('Pluma') + 1 === p.indexOf('Copa')
      && p[0] !== 'Copa' && p[3] !== 'Copa');
  assert.deepEqual(posibles23, [['Reloj','Pluma','Copa','Estrella']]);
}


// El editor y la página principal deben cargar el mismo calendario y el editor debe estar desplegable.
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const editor = fs.readFileSync(path.join(root, 'editor.html'), 'utf8');
const editorJs = fs.readFileSync(path.join(root, 'editor.js'), 'utf8');
assert.match(index, /calendario-publicado\.js/);
assert.match(editor, /id="formulario-personalizacion"/);
assert.match(editor, /editor\.js/);
assert.match(editor, /Preparar versión para Andrea/);
assert.doesNotMatch(editor, /lugarRegalo|Lugar donde estará el regalo|Última pista del regalo/);
assert.match(editorJs, /calendario-publicado\.js/);
assert.match(editorJs, /hp-estrella-invierno-editor-2026-/);
assert.match(editorJs, /ER\.calendario\(\{ \.\.\.datos/ , 'La publicación conserva marcadores y datos de personalización editables.');
console.log('PASS: calendario de 24 días, narrativa, evidencias, mecánicas, personalización, código 9346 y editor de navegador.');

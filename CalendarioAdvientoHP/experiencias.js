!function(){
  'use strict';
  const ER=window.EscapeRoom, M=ER.mecanismos;
  const mod=n=>((n%6)+6)%6;
  const el=(tag,text='',clase='')=>{const n=document.createElement(tag);n.textContent=text;n.className=clase;return n;};
  const btn=(texto,fn)=>{const b=el('button',texto,'control-reto');b.type='button';b.addEventListener('click',fn);return b;};
  const svg=(tag,attrs={})=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const reducido=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('movimiento-reducido');
  function girar(s,rueda,sentido){
    const posiciones=[...s.posiciones],giros=[...(s.giros??s.posiciones)];
    for(const i of rueda===0?[0,1]:rueda===1?[1,2]:[2]){posiciones[i]=mod(posiciones[i]+sentido);giros[i]+=sentido;}
    return {...s,posiciones,giros,abierta:false};
  }
  function ruta(c){
    const cola=[{p:[...c.inicio],ruta:[]}],vistos=new Set([c.inicio.join(',')]);
    for(let n=0;n<cola.length;n++){
      const actual=cola[n];if(actual.p.every((v,i)=>v===c.objetivos[i]))return actual.ruta;
      for(let rueda=0;rueda<3;rueda++)for(const sentido of [-1,1]){
        const p=girar({posiciones:actual.p},rueda,sentido).posiciones,k=p.join(',');
        if(!vistos.has(k)){vistos.add(k);cola.push({p,ruta:[...actual.ruta,{rueda,sentido}]});}
      }
    }
    return null;
  }
  function configValida(c){return [c?.inicio,c?.objetivos].every(a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0&&n<6));}
  function alineada(c,s){return configValida(c)&&Array.isArray(s?.posiciones)&&s.posiciones.length===3&&s.posiciones.every((v,i)=>Number.isInteger(v)&&v===c.objetivos[i]);}
  function cerradura(padre,reto,opciones){
    const c=JSON.parse(reto.configuracion),guardado=opciones.interaccion;
    let s=configValida({inicio:guardado?.actual?.posiciones,objetivos:c.objetivos})?structuredClone(guardado.actual):{posiciones:[...c.inicio],giros:[...c.inicio],abierta:false};
    let historial=Array.isArray(guardado?.historial)?guardado.historial.slice(-100):[],timer;
    const caja=el('section','','cerradura-mecanica'),dibujo=svg('svg',{viewBox:'0 0 330 280',role:'img','aria-label':'Cerradura de tres ruedas. Las aberturas deben apuntar al pestillo de la derecha.'});
    dibujo.append(svg('rect',{x:5,y:5,width:320,height:270,rx:20,fill:'#373e39',stroke:'#aa8c55','stroke-width':4}));
    const ruedas=[];
    [104,76,48].forEach((r,i)=>{
      const g=svg('g',{'data-rueda-cerradura':i,class:'aro-cerradura'}),a=14*Math.PI/180;
      const x=140+r*Math.cos(a),y=140+r*Math.sin(a),xx=140+r*Math.cos(-a),yy=140+r*Math.sin(-a);
      g.append(svg('path',{d:`M${x} ${y} A${r} ${r} 0 1 1 ${xx} ${yy}`,fill:'none',stroke:['#b39564','#ddc18a','#a28a64'][i],'stroke-width':20,'stroke-linecap':'butt'}));
      for(let j=1;j<6;j++){const t=j*Math.PI/3;g.append(svg('circle',{cx:140+r*Math.cos(t),cy:140+r*Math.sin(t),r:2.5,fill:'#534635'}));}
      dibujo.append(g);ruedas.push(g);
    });
    dibujo.append(svg('circle',{cx:140,cy:140,r:24,fill:'#705c3e',stroke:'#ddc18a','stroke-width':3}));
    const pestillo=svg('rect',{x:257,y:132,width:60,height:16,rx:3,fill:'#e2c58c',stroke:'#76613c','stroke-width':2});dibujo.append(pestillo);
    const estado=el('p','','estado-cerradura');estado.setAttribute('role','status');
    const controles=el('div','','controles-ruedas');
    ['Exterior','Central','Interior'].forEach((nombre,i)=>{
      const fila=el('div'),izquierda=btn('↶',()=>actuar(girar(s,i,-1))),derecha=btn('↷',()=>actuar(girar(s,i,1)));
      izquierda.setAttribute('aria-label','Girar '+nombre.toLowerCase()+' a la izquierda');derecha.setAttribute('aria-label','Girar '+nombre.toLowerCase()+' a la derecha');
      fila.append(el('span',nombre),izquierda,derecha);controles.append(fila);
    });
    const deslizar=btn('Deslizar pestillo →',abrir);deslizar.classList.add('pestillo-control');
    deslizar.setAttribute('aria-label','Deslizar pestillo: arrastra a la izquierda o pulsa para abrir');
    let origen,arrastrado=false;
    deslizar.addEventListener('pointerdown',e=>{origen=e.clientX;arrastrado=false;deslizar.setPointerCapture(e.pointerId);});
    deslizar.addEventListener('pointermove',e=>{if(origen===undefined)return;const distancia=Math.max(0,Math.min(52,origen-e.clientX));deslizar.style.setProperty('--arrastre',distancia+'px');if(distancia>=30)arrastrado=true;});
    deslizar.addEventListener('pointerup',()=>{const listo=arrastrado;origen=undefined;deslizar.style.removeProperty('--arrastre');if(listo){arrastrado=false;abrir();arrastrado=true;}});
    deslizar.addEventListener('pointercancel',()=>{origen=undefined;deslizar.style.removeProperty('--arrastre');});
    const deshacer=btn('Deshacer',()=>{if(historial.length){s=historial.pop();actualizar();}});
    const reiniciar=btn('Reiniciar',()=>actuar({posiciones:[...c.inicio],giros:[...c.inicio],abierta:false}));
    caja.append(dibujo,estado,controles,deslizar,el('p','Arrastra el pestillo hacia la izquierda o púlsalo. También puedes enfocarlo y pulsar Intro o Espacio.','ayuda'),deshacer,reiniciar);padre.append(caja);
    function actualizar(){
      ruedas.forEach((g,i)=>g.style.transform=`rotate(${((s.giros??s.posiciones)[i]-c.objetivos[i])*60}deg)`);
      const listo=alineada(c,s);caja.classList.toggle('alineada',listo);
      pestillo.setAttribute('x',s.abierta?140:257);pestillo.setAttribute('width',s.abierta?177:60);
      estado.textContent=listo?'Las tres muescas están alineadas. Acciona el pestillo.':'Alinea las aberturas con el pestillo de la derecha.';
      deshacer.disabled=!historial.length;
      opciones.guardarInteraccion?.({actual:structuredClone(s),historial:structuredClone(historial)});
    }
    function actuar(nueva){historial.push(structuredClone(s));historial=historial.slice(-100);s=nueva;actualizar();}
    function abrir(){
      if(arrastrado){arrastrado=false;return;}
      if(!alineada(c,s)){estado.textContent='El pestillo choca con las ruedas. Aún hay una abertura desalineada.';return;}
      s.abierta=true;actualizar();clearTimeout(timer);timer=setTimeout(()=>{if(caja.isConnected)opciones.comprobar?.(structuredClone(s));},reducido()?100:400);
    }
    actualizar();if(s.abierta&&alineada(c,s))timer=setTimeout(()=>opciones.comprobar?.(structuredClone(s)),100);
    return {obtener:()=>structuredClone(s),limpiar:()=>clearTimeout(timer),ayuda:null};
  }
  const anterior={inicial:M.inicial,completa:M.completa,errores:M.errores,mostrar:M.mostrar};
  M.tipos.push('cerradura');
  M.inicial=(tipo,c)=>tipo==='cerradura'?{posiciones:[...c.inicio],giros:[...c.inicio],abierta:false}:anterior.inicial(tipo,c);
  M.completa=(tipo,c,s)=>tipo==='cerradura'?alineada(c,s)&&s.abierta===true:anterior.completa(tipo,c,s);
  M.errores=(tipo,c)=>tipo==='cerradura'?(configValida(c)?[]:['configura tres posiciones entre 0 y 5 para el inicio y el objetivo']):anterior.errores(tipo,c);
  M.mostrar=(padre,reto,opciones)=>reto.tipo==='cerradura'?cerradura(padre,reto,opciones):anterior.mostrar(padre,reto,opciones);

  function estadoFinal(s){return {etapa:Math.max(0,Math.min(3,Number.isInteger(s?.etapa)?s.etapa:0))};}
  function final(padre,config,guardado,guardar){
    let s=estadoFinal(guardado),etapa=s.etapa;
    const panel=el('section','','final-hogwarts'),cabecera=el('p','HOGWARTS · NOCHEBUENA','rotulo-final');
    const ilustracion=el('div','','escena-estrella');
    ilustracion.setAttribute('role','img');ilustracion.setAttribute('aria-label','La Estrella de Invierno vuelve a brillar sobre Hogwarts');
    ilustracion.innerHTML='<svg viewBox="0 0 360 220" aria-hidden="true"><defs><radialGradient id="halo-invierno"><stop stop-color="#fff7c6" stop-opacity=".95"/><stop offset=".25" stop-color="#efcf85" stop-opacity=".45"/><stop offset="1" stop-color="#efcf85" stop-opacity="0"/></radialGradient><linearGradient id="estrella-invierno" x2="0" y2="1"><stop stop-color="#fff5c2"/><stop offset=".55" stop-color="#e5bd72"/><stop offset="1" stop-color="#a77a3e"/></linearGradient></defs><circle cx="180" cy="91" r="104" fill="url(#halo-invierno)"/><path d="M180 20 195 70 246 48 219 94 268 119 213 122 211 178 180 136 149 178 147 122 92 119 141 94 114 48 165 70Z" fill="url(#estrella-invierno)" stroke="#fff0b5" stroke-width="3"/><circle cx="180" cy="99" r="13" fill="#fff8d8"/><path d="M128 190h104l-12 18h-80z" fill="#53615e" stroke="#c7a574"/><path d="M145 187v-28h70v28M158 159v-13h44v13" fill="#354b4b" stroke="#c7a574"/><path d="M40 188 53 157 66 188m228 0 13-31 13 31" fill="none" stroke="#8ba09a" stroke-width="5"/><path d="M42 196h276" stroke="#c7a574" stroke-width="2"/></svg>';
    const contenido=el('div','','contenido-final'),acciones=el('div','','acciones-final'),estado=el('p','','estado-final');estado.setAttribute('role','status');
    const repetir=btn('Volver a contemplar la Estrella',()=>{etapa=0;guardarEtapa();dibujar();});
    panel.append(cabecera,ilustracion,estado,contenido,acciones,repetir);padre.append(panel);
    function guardarEtapa(){s.etapa=etapa;guardar?.({...s});}
    function avanzar(){etapa=Math.min(3,etapa+1);guardarEtapa();dibujar();}
    function dibujar(){
      contenido.replaceChildren();acciones.replaceChildren();panel.dataset.etapa=String(etapa);
      if(etapa===0){estado.textContent='Los cuatro sellos están reunidos. Solo falta devolver su luz a la Estrella de Invierno.';acciones.append(btn('Devolver la luz a Hogwarts',avanzar));}
      if(etapa===1){estado.textContent='La Estrella vuelve a encenderse sobre el Gran Comedor. Las luces del castillo responden una a una.';contenido.append(el('p',config.revelacion||'La magia de Hogwarts ha vuelto a brillar.'));acciones.append(btn('Leer la última carta',avanzar));}
      if(etapa===2){estado.textContent='Entre las páginas del Libro de las Veinticuatro Noches aparece una carta dirigida a ti.';if(config.nota)contenido.append(el('article',config.nota,'carta-final'));if(config.mensaje)contenido.append(el('p',config.mensaje,'mensaje-final'));acciones.append(btn('Descubrir la última pista',avanzar));}
      if(etapa===3){estado.textContent='La aventura termina aquí; tu regalo te espera fuera de Hogwarts.';if(config.pista)contenido.append(el('p',config.pista,'pista-final'));}
    }
    dibujar();return ()=>{};
  }

  function introduccion(portada,calendario,config,{vista=false,guardar=()=>{},terminar=()=>{}}={}){
    const escena=calendario.querySelector('.escena'),ancla=document.createComment('castillo del calendario');
    escena.before(ancla);let fase='cerrada',timer;
    portada.replaceChildren();portada.className='entrada-caja carta-hogwarts';
    const valor=(campo,defecto)=>typeof config[campo]==='string'&&config[campo].length?config[campo]:defecto;
    const rotulo=el('p',valor('cartaRotulo','CORREO ESPECIAL · COLEGIO HOGWARTS'),'rotulo-caja');
    const sobre=el('article','','sobre-hogwarts');
    const cabecera=el('p',valor('cartaCabecera','HOGWARTS · ESCUELA DE MAGIA Y HECHICERÍA'),'membrete-hogwarts');
    const escudo=el('div','✦','escudo-hogwarts');escudo.setAttribute('aria-hidden','true');
    const fecha=el('p',valor('cartaFecha','HOGWARTS, 1 DE DICIEMBRE DE 2026'),'fecha-carta');
    const para=el('p',valor('cartaDestinatario','PARA: ANDREA'),'destinatario-carta');
    const titulo=el('h1',valor('cartaTitulo','Una invitación especial'),'titulo-carta');
    const texto=el('div','','texto-carta');
    for(const p of valor('cartaTexto','Querida Andrea:\n\nLa Estrella de Invierno ha perdido su luz y el Libro de las Veinticuatro Noches se ha abierto con tu nombre. Hogwarts necesita tu ayuda para recuperar los cuatro sellos que mantienen vivo su antiguo encantamiento navideño.\n\nCada día encontrarás un desafío. Conserva las evidencias: juntas revelarán el camino hasta la cámara secreta.\n\nEl castillo cuenta contigo. Y alguien, fuera de sus muros, ha preparado una sorpresa que solo tú podrás descubrir.').split(/\n\s*\n/).filter(Boolean))texto.append(el('p',p));
    const firma=el('p',valor('cartaFirma','Atentamente,\nEl equipo de selección de Hogwarts'),'firma-carta');
    const sello=el('div',valor('cartaSello','H'),'sello-hogwarts');sello.setAttribute('aria-label','Sello de Hogwarts');
    sobre.append(cabecera,escudo,fecha,para,titulo,texto,firma,sello);
    const accion=btn(valor('cartaBoton','Aceptar la invitación'),abrir);accion.className='abrir-carta';
    const saltar=btn(valor('cartaSaltar','Entrar directamente al castillo'),()=>finalizar(true));saltar.className='saltar-introduccion';
    const estado=el('p','','estado-entrada');estado.setAttribute('role','status');
    portada.append(rotulo,sobre,accion,estado,saltar);
    function devolver(){escena.style.cssText='';ancla.after(escena);escena.inert=false;calendario.hidden=false;calendario.inert=false;}
    function colocar(){clearTimeout(timer);devolver();portada.hidden=false;portada.style.cssText='';calendario.hidden=true;calendario.inert=true;fase='cerrada';portada.dataset.fase=fase;accion.disabled=false;estado.textContent='';}
    function ocultar(){devolver();portada.hidden=true;portada.style.cssText='';fase='terminada';portada.dataset.fase=fase;guardar();terminar();}
    function finalizar(inmediato=false){
      if(fase==='terminada')return;
      if(inmediato||window.matchMedia('(prefers-reduced-motion: reduce)').matches){ocultar();return;}
      if(fase==='abriendo')return;
      fase='abriendo';portada.dataset.fase=fase;accion.disabled=true;estado.textContent='La invitación ha sido aceptada…';
      sobre.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:'translateY(-18px) rotate(-1deg) scale(.98)',opacity:0}],{duration:420,easing:'ease-in',fill:'forwards'});
      timer=setTimeout(()=>{
        const desde=sobre.getBoundingClientRect();devolver();calendario.inert=true;
        portada.style.cssText='position:fixed;inset:0;z-index:20;pointer-events:none';
        const hasta=escena.getBoundingClientRect();escena.style.zIndex='21';
        escena.animate([{transformOrigin:'0 0',transform:'translate('+(desde.left-hasta.left)+'px,'+(desde.top-hasta.top)+'px) scale('+(desde.width/hasta.width)+','+(desde.height/hasta.height)+')'},{transformOrigin:'0 0',transform:'none'}],{duration:650,easing:'cubic-bezier(.2,.65,.25,1)',fill:'both'});
        portada.animate([{opacity:1},{opacity:0}],{duration:620,fill:'forwards'});timer=setTimeout(ocultar,660);
      },430);
    }
    function abrir(){if(fase!=='cerrada')return;finalizar();}
    function repetir(){colocar();accion.focus({preventScroll:true});}
    if(vista||config.introduccion===false){portada.hidden=true;calendario.hidden=false;terminar();}else colocar();
    return {repetir,revisar:colocar,reproducir:()=>{colocar();abrir();},limpiar:()=>{clearTimeout(timer);devolver();ancla.remove();portada.style.cssText='';}};
  }
  function historia(config,{guardar=()=>{},terminar=()=>{}}={}){
    const dialogo=el('dialog','','historia-entrada');
    dialogo.setAttribute('aria-labelledby','titulo-historia');
    const cabecera=el('header','','cabecera-historia');
    cabecera.append(el('p','HOGWARTS · ARCHIVO DE INVIERNO','sello-historia'));
    const dibujo=el('div','','pedestal-historia');
    dibujo.setAttribute('role','img');dibujo.setAttribute('aria-label','Una estrella dorada encendida sobre un pedestal de piedra en Hogwarts');
    dibujo.innerHTML='<svg viewBox="0 0 360 128" aria-hidden="true"><defs><radialGradient id="halo-archivo"><stop stop-color="#fff4c2" stop-opacity=".9"/><stop offset="1" stop-color="#edc779" stop-opacity="0"/></radialGradient><linearGradient id="piedra-archivo" x2="0" y2="1"><stop stop-color="#776e60"/><stop offset="1" stop-color="#313e40"/></linearGradient></defs><circle cx="180" cy="44" r="57" fill="url(#halo-archivo)"/><path d="M180 4 191 34 222 27 202 50 223 73 191 65 180 96 169 65 137 73 158 50 138 27 169 34Z" fill="#edcc83" stroke="#fff0b7" stroke-width="2"/><path d="M110 81h140l-13 42H123z" fill="url(#piedra-archivo)" stroke="#c7a574"/><path d="M71 31v10m-5-5h10m211-13v8m-4-4h8" stroke="#f0c78e"/></svg>';
    const titulo=el('h2',config.historiaTitulo);titulo.id='titulo-historia';titulo.tabIndex=-1;
    const nota=el('div','','texto-historia');
    for(const parrafo of config.historiaTexto.split(/\n\s*\n/).filter(Boolean))nota.append(el(parrafo.startsWith('«')?'blockquote':'p',parrafo));
    const pie=el('footer'),empezar=btn(config.historiaBoton||'Comenzar la aventura',()=>{guardar();dialogo.close();});
    pie.append(empezar);dialogo.append(cabecera,dibujo,titulo,nota,pie);document.body.append(dialogo);
    dialogo.addEventListener('close',()=>{dialogo.remove();terminar();},{once:true});
    dialogo.showModal();dialogo.scrollTop=0;titulo.focus({preventScroll:true});
    return {limpiar:()=>{dialogo.remove();}};
  }
  ER.experiencias={girar,ruta,alineada,configValida,final,estadoFinal,introduccion,historia};
}();

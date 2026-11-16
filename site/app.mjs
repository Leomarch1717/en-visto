import {initial,introMessages,advance,choicesFor,LABELS,ENDINGS,VOICE} from './story.mjs';
const $=id=>document.getElementById(id),KEY='en-visto-mariana-v1',FOUND='en-visto-finales-v1';
let state=initial(),started=false,busy=false,run=0,fast=false,notifications=false,playing=false,audioContext;
let saved;try{saved=JSON.parse(localStorage.getItem(KEY));if(saved?.transcript?.length&&Array.isArray(saved.choices)&&saved.step>=0&&saved.step<=4){state=saved;started=true;}}catch{}
let found=[];try{const f=JSON.parse(localStorage.getItem(FOUND));if(Array.isArray(f))found=f.filter(x=>ENDINGS[x]);}catch{}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(FOUND,JSON.stringify(found));}catch{}updateFound();}
function updateFound(){$('discovered').textContent=`${found.length} de 3 finales descubiertos`;}
function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3200);}
function show(d){if(!d.open)d.showModal();}function close(d){if(d.open)d.close();}
function status(t){$('status').textContent=t;}
function scroll(){requestAnimationFrame(()=>$('chat').scrollTo({top:$('chat').scrollHeight,behavior:reduced?'instant':'smooth'}));}
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function ping(){if(!notifications)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sine';o.frequency.setValueAtTime(740,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(550,audioContext.currentTime+.12);g.gain.setValueAtTime(.025,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.14);o.start();o.stop(audioContext.currentTime+.15);}catch{}}
function addMessage(m){
 if(m.type==='system'||m.type==='seen'){const e=element('div',m.type==='seen'?'seen-message':'system-message',m.text);$('chat').append(e);return;}
 const wrapper=element('div',`message ${m.sender}`),bubble=element('div','bubble');
 if(m.type==='photo'){
  const b=element('button','attachment');b.type='button';b.setAttribute('aria-label','Abrir foto del escritorio y revisar pistas');
  const img=element('img','photo-thumb');img.src='assets/escritorio.png';img.alt='Foto del escritorio de Daniel con la maqueta y el café.';img.loading='lazy';
  const caption=element('span','photo-caption');caption.append(element('span','','Foto del escritorio'),element('span','','↗'));b.append(img,caption);b.onclick=()=>{show($('photo'));};bubble.append(b);
 }else if(m.type==='audio'){
  const b=element('button','audio-control');b.type='button';b.dataset.audio='';b.setAttribute('aria-label','Escuchar nota de voz de Daniel');b.setAttribute('aria-pressed','false');
  const play=element('span','play-circle','▶'),wave=element('span','wave');wave.setAttribute('aria-hidden','true');
  [7,13,20,10,23,16,9,19,25,11,18,8,21,13,23,8,18,11,22,14,9,18,24,13].forEach(h=>{const bar=element('b');bar.style.setProperty('--h',h+'px');wave.append(bar);});
  b.append(play,wave);b.onclick=()=>toggleAudio();bubble.append(b,element('div','audio-caption','Nota de voz · audio dramatizado'));
  const t=element('button','link transcript-toggle','Leer transcripción');t.type='button';t.setAttribute('aria-expanded','false');
  const trans=element('p','audio-transcript',VOICE);trans.hidden=true;t.onclick=()=>{trans.hidden=!trans.hidden;t.textContent=trans.hidden?'Leer transcripción':'Ocultar transcripción';t.setAttribute('aria-expanded',String(!trans.hidden));};bubble.append(t,trans);
 }else bubble.append(element('span','',m.text));
 const meta=element('span','message-time',m.time||'7:08 p. m.');
 if(m.sender==='mariana')meta.append(element('span','ticks','✓✓'));bubble.append(meta);wrapper.append(bubble);$('chat').append(wrapper);
}
function syncAudio(){document.querySelectorAll('[data-audio]').forEach(b=>{b.querySelector('.play-circle').textContent=playing?'Ⅱ':'▶';b.setAttribute('aria-pressed',String(playing));b.setAttribute('aria-label',playing?'Pausar nota de voz':'Escuchar nota de voz de Daniel');});}
function stopAudio(){if('speechSynthesis'in window)speechSynthesis.cancel();playing=false;syncAudio();}
function toggleAudio(){
 if(playing){stopAudio();return;}
 if(!('speechSynthesis'in window)){toast('Este navegador no ofrece lectura de voz. Abrí la transcripción.');return;}
 const voices=speechSynthesis.getVoices().filter(v=>v.lang.startsWith('es'));
 if(!voices.length){toast('No hay una voz en español disponible aquí. Podés leer la transcripción.');return;}
 const utterance=new SpeechSynthesisUtterance(VOICE);utterance.lang='es-CO';utterance.voice=voices.find(v=>v.lang==='es-CO')||voices.find(v=>v.lang==='es-MX')||voices[0];utterance.rate=.97;utterance.pitch=.9;
 utterance.onend=()=>{playing=false;syncAudio();};utterance.onerror=()=>{playing=false;syncAudio();toast('No se pudo reproducir la voz. La transcripción sigue disponible.');};
 speechSynthesis.cancel();playing=true;syncAudio();speechSynthesis.speak(utterance);if(!state.evidence.includes('Nota de voz de Daniel'))state.evidence.push('Nota de voz de Daniel');save();
}
async function wait(ms,token){let elapsed=0;while(elapsed<ms&&!fast&&!reduced&&token===run){await new Promise(r=>setTimeout(r,60));elapsed+=60;}}
async function sequence(messages){
 const token=run;busy=true;fast=false;$('choices').replaceChildren();$('skip').hidden=false;$('decision-label').textContent='Esperá un momento…';
 for(const m of messages){if(token!==run)return;let typing;
  if(m.sender==='daniel'){status('escribiendo…');typing=element('div','message');typing.innerHTML='<div class="bubble typing" aria-hidden="true"><i></i><i></i><i></i></div>';$('chat').append(typing);scroll();}
  await wait(m.sender==='daniel'?650:180,token);if(token!==run){typing?.remove();return;}typing?.remove();addMessage(m);if(m.sender==='daniel')ping();scroll();await wait(210,token);
 }
 if(token!==run)return;busy=false;$('skip').hidden=true;status(state.ending==='seen'?'últ. vez: 7:31 p. m.':'en línea');renderChoices();save();
}
function renderChoices(){
 $('choices').replaceChildren();$('act-count').textContent=`${String(Math.min(state.step+1,4)).padStart(2,'0')} / 04`;
 $('act-label').textContent=state.ending?'Fin de la conversación':LABELS[state.step];
 $('decision-label').textContent=state.ending?'Tu conversación llegó a un final.':'¿Qué le respondés?';
 if(state.ending){const b=element('button','primary','Leer desenlace');b.onclick=openEnding;$('choices').append(b);return;}
 choicesFor(state).forEach(choice=>{const b=element('button','choice');b.type='button';b.append(element('span','',choice.text),element('span','arrow','↗'));b.onclick=()=>choose(choice.id);$('choices').append(b);});
}
function choose(id){if(busy||state.ending)return;stopAudio();const result=advance(state,id);state=result.state;state.transcript.push(...result.messages);if(state.ending&&!found.includes(state.ending))found.push(state.ending);save();sequence(result.messages);}
function startNew(){run++;stopAudio();state=initial();started=true;state.transcript=structuredClone(introMessages);$('chat').replaceChildren();close($('intro'));close($('ending'));close($('panel'));save();sequence(introMessages);}
function resume(){run++;stopAudio();busy=false;$('chat').replaceChildren();state.transcript.forEach(addMessage);$('skip').hidden=true;close($('intro'));renderChoices();status(state.ending==='seen'?'últ. vez: 7:31 p. m.':'en línea');scroll();}
function openIntro(){run++;stopAudio();busy=false;$('resume').hidden=!started;$('start').textContent=started?'Empezar otra conversación ↗':'Entrar al chat ↗';show($('intro'));}
function openEnding(){const e=ENDINGS[state.ending];if(!e)return;$('ending-number').textContent=`DESENLACE ${e.number} / 03`;$('ending-title').textContent=e.title;$('ending-line').textContent=e.line;$('ending-text').textContent=e.text;$('ending-after').textContent=e.after;$('ending-progress').textContent=`Descubriste ${found.length} de los 3 finales. Ningún desenlace convierte a Mariana en responsable de las acciones de Daniel.`;show($('ending'));}
function panel(content){$('panel-content').replaceChildren(content);show($('panel'));}
function journal(){const box=element('div');box.append(element('p','eyebrow','TU RECORRIDO'),element('h2','','Lo que elegiste'));
 if(!state.choices.length)box.append(element('p','','Todavía no tomaste una decisión. Entrá al chat para empezar.'));
 state.choices.forEach(c=>{box.append(element('p','journal-step',`${c.step+1}. ${LABELS[c.step]}`),element('p','',`«${c.text}»`));});
 box.append(element('div','separator'),element('h3','','Lo que descubriste'));
 const list=element('ul');state.evidence.forEach(t=>list.append(element('li','',t)));if(state.evidence.length)box.append(list);else box.append(element('p','','Las fotos, los audios y la conversación pueden darte nuevas pistas.'));
 const exportButton=element('button','secondary','Descargar mi recorrido');exportButton.onclick=exportRoute;box.append(exportButton);panel(box);
}
function exportRoute(){const title=state.ending?ENDINGS[state.ending].title:'Conversación en curso';const txt=`EN VISTO · La noche de Mariana\n${title}\n\n${state.transcript.map(m=>(m.sender==='mariana'?'MARIANA: ':m.sender==='daniel'?'DANIEL: ':'')+(m.type==='photo'?'[Foto del escritorio]':m.type==='audio'?'[Nota de voz] '+m.text:m.text)).join('\n\n')}\n\nDecisiones:\n${state.choices.map((c,i)=>`${i+1}. ${c.text}`).join('\n')}\n\nFicción interactiva. Versión alternativa en el universo de La mosca.`;const url=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));const a=element('a');a.href=url;a.download='En_visto_mi_recorrido.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function about(){const box=element('div');box.innerHTML='<p class="eyebrow">EN EL UNIVERSO DE LA MOSCA</p><h2>La otra pantalla</h2><p>En el guion original, Daniel lee los mensajes de Mariana, escribe borradores y no envía una respuesta. Esta experiencia imagina qué podría pasar si esa conversación continuara.</p><p>Vos ocupás la perspectiva de Mariana. No ves lo que ocurre en la casa: recibís mensajes, una imagen y una nota de voz. Podés elegir cómo preguntar y cómo intentar acompañarlo.</p><h3>Cómo se juega</h3><p>Elegí una respuesta cada vez que la conversación se detenga. No hay tiempo límite. Abrí los archivos que recibas y consultá tu recorrido en el ícono del cuaderno. Al terminar, podés explorar otra ruta.</p><h3>Sobre las piezas</h3><p>El guion literario de <em>La mosca</em> es la obra de partida. Los diálogos y desenlaces de este chat son una expansión propuesta. La fotografía es una reconstrucción generada para esta ficción. La nota de voz se interpreta mediante una voz sintética en español disponible en tu navegador y siempre incluye transcripción.</p><p>La mosca dibujada pertenece al material visual generado para el proyecto. Las decisiones y el progreso quedan guardados únicamente en este navegador. Este chat no envía mensajes a ninguna persona.</p>';panel(box);}
const clues={table:{text:'La pata de la mesa parece desnivelada. Daniel está trabajando sobre una superficie inestable.',name:'La mesa está inestable'},coffee:{text:'El café está junto a las piezas de cartón. Si la mesa se mueve, puede caer sobre la maqueta.',name:'El café está junto a la maqueta'},model:{text:'Hay piezas sin pegar y herramientas sobre la base. El proyecto todavía necesita trabajo, aunque Daniel insiste en que le falta poco.',name:'La maqueta sigue incompleta'}};
document.querySelectorAll('[data-clue]').forEach(b=>b.onclick=()=>{const c=clues[b.dataset.clue];$('clue-description').textContent=c.text;b.classList.add('active');if(!state.evidence.includes(c.name)){state.evidence.push(c.name);save();}});
$('start').onclick=startNew;$('resume').onclick=resume;$('home').onclick=e=>{e.preventDefault();openIntro();};$('back').onclick=openIntro;$('journal').onclick=journal;$('ending-journal').onclick=journal;$('about').onclick=about;$('panel-close').onclick=()=>close($('panel'));$('photo-close').onclick=()=>close($('photo'));$('photo-return').onclick=()=>close($('photo'));$('read-chat').onclick=()=>{close($('ending'));scroll();};$('replay').onclick=startNew;$('skip').onclick=()=>{fast=true;};
$('sound').onclick=()=>{notifications=!notifications;$('sound').setAttribute('aria-pressed',String(notifications));$('sound').setAttribute('aria-label',notifications?'Desactivar sonidos de notificación':'Activar sonidos de notificación');$('sound').style.opacity=notifications?'1':'.6';toast(notifications?'Sonidos de notificación activados':'Sonidos de notificación desactivados');if(notifications)ping();};
$('intro').addEventListener('cancel',e=>{e.preventDefault();if(started)resume();});
window.addEventListener('pagehide',stopAudio);updateFound();$('resume').hidden=!started;show($('intro'));

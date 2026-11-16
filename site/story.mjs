export const VOICE = 'Marica, mirá cómo voy. La mesa se mueve, se me despegó otra pieza y esa mosca no me deja hacer nada. Yo sé que me estás escribiendo, pero no sé ni qué contestarte. Esperá… ¿oís ese zumbido? Lleva aquí un rato. Quiero terminar esto, Mariana.';
export const ENDINGS = {
 pause: {number:'01',title:'Una pausa a tiempo',line:'Por un momento, el zumbido deja de mandar.',text:'Daniel se aparta del escritorio y deja el café en el suelo. Con la mesa quieta y Mariana al otro lado, puede volver a mirar el proyecto. La maqueta sigue incompleta. Esta vez, no tiene que resolverlo todo de una sentada.',after:'Una posibilidad distinta a la noche del cortometraje.'},
 company: {number:'02',title:'Al otro lado',line:'El proyecto se rompe. La conversación, no.',text:'Daniel no alcanza a detenerse antes de que la mesa ceda. Entre el café y las piezas, encuentra el celular y vuelve al chat. Mariana no puede arreglar la maqueta desde su cuarto. Puede quedarse a escucharlo.',after:'Una ruta alternativa que continúa después del desastre.'},
 seen: {number:'03',title:'En visto',line:'Dos chulos azules. Ninguna respuesta.',text:'El mensaje queda leído. Mariana deja el celular boca arriba, cerca de ella. No sabe cómo termina la noche en esa casa. Solo sabe que su último mensaje sigue ahí, por si Daniel decide volver.',after:'El silencio aproxima esta ruta a la situación del guion original. Los mensajes de esta experiencia son una expansión propuesta.'}
};
export const LABELS=['Abrir la conversación','Leer entre mensajes','Intentar ayudar','Decidir cómo quedarse'];
export const initial = () => ({step:0,rapport:0,prepared:false,evidence:[],choices:[],transcript:[],ending:null});
const msg=(text,type='text',extra={})=>({sender:'daniel',text,type,...extra});
export const introMessages=[
 {sender:'system',type:'system',text:'Hoy · 7:08 p. m.'},
 {sender:'mariana',text:'¿Qué más, Dani? ¿Cómo vas con esa vuelta?'},
 msg('Ahí voy.'),msg('Bueno, no. Marica, hoy me ha pasado de todo.'),msg('Y todavía me falta pegar un poco de cosas.')
];
export const choicesFor=s=>[
 [{id:'ask',text:'¿Qué pasó? Contame una cosa a la vez.'},{id:'call',text:'¿Querés que te llame un momento?'},{id:'space',text:'Te dejo avanzar. Escribime cuando podás.'}],
 [{id:'photo',text:'Mandame una foto de cómo vas.'},{id:'audio',text:'Si no querés escribir, mandame un audio.'},{id:'detail',text:'¿Qué es lo que más te está complicando?'}],
 [{id:'table',text:'Antes de seguir, revisá esa mesa.'},{id:'pause',text:'Hacé una pausa. Yo me quedo por acá.'},{id:'work',text:'Dale, avanzá un poquito y me contás.'}],
 [{id:'stay',text:'Estoy acá. Podemos parar un momento.'},{id:'call_end',text:'Si te sirve, hagamos una llamada.'},{id:'leave',text:'Te doy espacio. Cuando quieras, me escribís.'}]
][s.step]??[];
export function advance(state,id){
 const s=structuredClone(state);const choice=choicesFor(s).find(c=>c.id===id);
 if(!choice||s.ending)throw new Error('Decisión inválida para este momento');
 s.choices.push({step:s.step,id,text:choice.text});
 let messages=[{sender:'mariana',text:choice.text}];
 if(s.step===0){
  if(id==='ask'){s.rapport++;messages.push(msg('Me quemé con el café, se cayó una pieza y ahora hay una mosca jodiendo.'),msg('Me siento a arreglar algo y pasa otra cosa.'));}
  if(id==='call'){s.rapport++;messages.push(msg('Ahorita no. Tengo las manos llenas de pegante.'),msg('Pero quedate por acá, ¿sí? No quiero dejarte hablando sola.'));}
  if(id==='space')messages.push(msg('Gracias. Esperá… tampoco quiero desaparecerme.'),msg('Es que ya ni sé por dónde seguir.'));
  messages.push(msg('Y la mesa no se queda quieta.'));
 }else if(s.step===1){
  if(id==='photo'){s.evidence.push('Foto del escritorio');messages.push(msg('Mirá. No te burlés del reguero.'),msg('Abrir foto del escritorio','photo'),msg('El café está entero, yo no tanto.'))}
  if(id==='audio'){s.rapport++;s.evidence.push('Nota de voz de Daniel');messages.push(msg('Va. Escuchá. No me da para escribir todo.'),msg(VOICE,'audio'),msg('¿Se alcanza a oír?'))}
  if(id==='detail'){s.evidence.push('La mesa está inestable');messages.push(msg('La mesa tiembla cada que me apoyo. Y me da miedo mover la maqueta así.'),msg('Me distraigo con la mosca, me acelero y termino tumbando algo.'))}
  messages.push(msg('Yo lo que quiero es acabar esto de una vez.'));
 }else if(s.step===2){
  if(id==='table'){s.prepared=true;messages.push(msg('Tenés razón. Estoy haciendo fuerza sobre la misma pata floja.'),msg('Voy a quitar el café primero. Esperá, no me escribás un segundo.'))}
  if(id==='pause'){s.prepared=true;s.rapport++;messages.push(msg('No quiero dejarlo a medias otra vez.'),msg('…pero sí. Ya estoy haciendo todo a las carreras. Me voy a parar un momento.'))}
  if(id==='work')messages.push(msg('Sí. Me falta poquito.'),msg('Si esa mosca se queda quieta un segundo…'));
  messages.push({sender:'system',type:'system',text:'Unos minutos después'});
  messages.push(msg(s.prepared?'Estoy al lado de la mesa. Dejé de pegar. Pero tengo la cabeza a mil.':'Se volvió a caer una pieza. Ya no sé si seguir o mandar todo a la mierda.'));
 }else{
  const ending=id==='leave'?'seen':s.prepared?'pause':'company';s.ending=ending;
  if(ending==='seen')messages.push({sender:'system',type:'seen',text:'Leído · 7:31 p. m.'},{sender:'system',type:'system',text:'Daniel dejó de escribir.'});
  if(ending==='pause')messages.push(msg(id==='call_end'?'Dale. Te llamo yo. Un segundo.':'Sí. No te vayás todavía.'),msg('Ya quité el café. Voy a dejar quieta la maqueta mientras arreglo dónde ponerla.'),{sender:'system',type:'system',text:id==='call_end'?'Llamada de Daniel · conectada dentro de la historia':'Daniel deja el celular junto a él.'},msg('Gracias por quedarte, Mari.'));
  if(ending==='company')messages.push({sender:'system',type:'system',text:'Daniel está escribiendo…'},msg('Se cayó la mesa.'),msg('La maqueta quedó vuelta nada.'),msg('No me digás nada todavía. ¿Podés quedarte un rato?'),{sender:'mariana',text:id==='call_end'?'Sí. Te llamo. No tenés que explicarme todo ya.':'Sí, Dani. Estoy acá.'});
 }
 messages=messages.map(m=>({...m,time:['7:12 p. m.','7:18 p. m.','7:24 p. m.','7:31 p. m.'][s.step]}));
 s.step++;return {state:s,messages};
}

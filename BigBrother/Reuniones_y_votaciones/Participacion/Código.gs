/**
 * Big Brother Participación v0.9.0 · Aplicación INDEPENDIENTE.
 * Desplegar: ejecutar como YO (propietario administrador); acceso solo dominio.
 * Solo expone consultas de miembros y sus propias acciones (no Gmail, actas,
 * edición de convocatorias, ni CSV). Nunca compartir los Sheets con miembros.
 *
 * PEGA AQUÍ LOS MISMOS DOS IDs QUE EN Gestion/Publicador.gs.
 */
const P_CFG = Object.freeze({
  DOMAIN: 'bestvalencia.org',
  PUBLIC_ID: '150EVu_CoRCucmJMbv1ihFBWmAXqEI1QoKpQ_abfE48s',
  PRIVATE_ID: '1RMZMfTEO5aDXo6LwO6pI6TQTw9jogB7lZIHJ4Tzs-eg',
  REUNIONES_ID: '1k_S9_ytQGFZwGKwYzfayKPYm4uII4B8H8YgsaFaagXs',
  MIEMBROS_ID: '1IZxJW6VMdmBzICjVOCEQXpe7hHu7oTcKc3tVMEp0yPY',
  BOARD_GROUP: 'board@bestvalencia.org',
  TZ: 'Europe/Madrid'
});
function doGet(){
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Mi participación | Big Brother · BEST Valencia')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function p_id_(type){
  const id=String(type==='pub'?P_CFG.PUBLIC_ID:P_CFG.PRIVATE_ID);
  if(!/^[\w-]{25,}$/.test(id)||id.indexOf('PEGA_AQUI')>=0)
    throw Error('Falta configurar el ID '+type+' en Participacion/Code.gs.');
  if(P_CFG.PUBLIC_ID===P_CFG.PRIVATE_ID||[P_CFG.REUNIONES_ID,P_CFG.MIEMBROS_ID].includes(id))
    throw Error('Los Sheets privados, originales y publicados deben ser distintos.');
  return id;
}
function p_active_(){
  const e=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!e||!e.endsWith('@'+P_CFG.DOMAIN))throw Error('No se pudo comprobar tu identidad @bestvalencia.org. No se permite actuar de forma anónima.');
  return e;
}
function p_alias_(e){return /^(board|secretary|secre|secretaria|president|presi|presidencia|presidency|treasury|treasurer|teso|tesoreria|internal|external|vp-?internal|vp-?external|vpi|vpe|vicepresident(?:e|a)?(?:[-_](?:internal|external|interno|externo))?|hr|it|fr|prd|events|members|full-member|observers)@bestvalencia\.org$/i.test(e);}
function p_text_(v){return String(v===null||v===undefined?'':v).trim();}
function p_norm_(s){return p_text_(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');}
function p_bool_(s){return s===true||String(s).toUpperCase()==='TRUE';}
function p_fecha_(raw){
  if(raw instanceof Date)return Utilities.formatDate(raw,P_CFG.TZ,'yyyy-MM-dd');
  const str=p_text_(raw);
  if(/^\d{4}-\d{2}-\d{2}$/.test(str))return str;
  const es=str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(es)return es[3]+'-'+es[2].padStart(2,'0')+'-'+es[1].padStart(2,'0');
  throw Error('Fecha incorrecta en la base de datos: '+str.slice(0,25));
}
function p_ahora_(){return Utilities.formatDate(new Date(),P_CFG.TZ,'yyyy-MM-dd HH:mm');}
function p_tab_(id,name){const sh=SpreadsheetApp.openById(id).getSheetByName(name);if(!sh)throw Error('Falta la pestaña '+name+'. Ejecuta prepararPuenteBigBrother en Gestión.');return sh;}
function p_rows_(type,name){
  const sh=p_tab_(p_id_(type),name);
  return sh.getLastRow()<=1?[]:sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues().filter(r=>p_text_(r[0]));
}
function p_members_(){
  const sh=p_tab_(P_CFG.MIEMBROS_ID,'Miembros');
  if(sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,8).getValues().filter(r=>p_text_(r[6])&&!p_bool_(r[7])).map(r=>({
    id:p_text_(r[6]),nombre:[p_text_(r[0]),p_text_(r[1])].filter(Boolean).join(' '),
    estatus:p_text_(r[2]),email:p_text_(r[3]).toLowerCase()
  }));
}
function p_me_(){
  const email=p_active_();
  if(p_alias_(email))throw Error('Las cuentas institucionales de Board no pueden votar ni justificar como miembros.');
  const hits=p_members_().filter(m=>m.email===email);
  if(hits.length!==1)throw Error('Tu correo '+email+' no está asignado de forma única en Miembros. Habla con Secretaría.');
  return hits[0];
}
function p_reuMaster_(id){
  const sh=p_tab_(P_CFG.REUNIONES_ID,'Reuniones');
  if(sh.getLastRow()<2)throw Error('Reunión no encontrada.');
  const rows=sh.getRange(2,1,sh.getLastRow()-1,14).getValues();
  const r=rows.find(row=>p_text_(row[0])===id);
  if(!r||p_text_(r[5])!=='Convocada'||p_bool_(r[12]))throw Error('La reunión no está convocada o está marcada para borrado.');
  const conf=p_json_(r[13]);
  return {id:id,fecha:p_fecha_(r[1]),titulo:p_text_(r[3]),conf:conf};
}
function p_json_(s){try{return JSON.parse(String(s||'{}'));}catch(e){throw Error('Datos JSON inválidos en la convocatoria. Contacta con Secretaría.');}}
function p_voteMaster_(id){
  const sh=p_tab_(P_CFG.REUNIONES_ID,'Votaciones');
  if(sh.getLastRow()<2)throw Error('Votación no encontrada.');
  const rows=sh.getRange(2,1,sh.getLastRow()-1,10).getValues();
  const r=rows.find(row=>p_text_(row[0])===id);
  if(!r||p_text_(r[5])!=='Confirmada'||p_bool_(r[9]))throw Error('La votación no está confirmada o está marcada para borrado.');
  return {id:id,fecha:p_fecha_(r[1]),asunto:p_text_(r[2]),conf:p_json_(r[6])};
}
function p_elector_(vote,m){const s=(vote.conf.exportCenso||{}).roster||[];return s.find(x=>x.id===m.id&&Array.isArray(x.preguntas)&&x.preguntas.length)||null;}
function p_priv_(name){
  const sh=p_tab_(p_id_('priv'),name);
  const head=sh.getRange(1,1,1,3).getDisplayValues()[0];
  if(head.join('|')!=='ID|JSON_privado|Actualizado')throw Error('Cabeceras privadas incorrectas en '+name);
  return sh;
}
function p_regs_(name){
  const sh=p_priv_(name);if(sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,2).getValues().filter(r=>p_text_(r[0])).map(r=>{
    const a=p_json_(r[1]);if(a.id!==p_text_(r[0]))throw Error('Datos privados inconsistentes.');return a;
  });
}
function p_save_(name,entry){
  const sh=p_priv_(name),n=sh.getLastRow()-1;
  const ids=n?sh.getRange(2,1,n,1).getValues().map(r=>p_text_(r[0])):[];
  const idx=ids.indexOf(entry.id),row=idx<0?sh.getLastRow()+1:idx+2;
  sh.getRange(row,1,1,3).setValues([[entry.id,JSON.stringify(entry),new Date()]]);
}
function p_delete_(name,id){
  const sh=p_priv_(name),n=sh.getLastRow()-1;if(n<1)return;
  const pos=sh.getRange(2,1,n,1).getValues().findIndex(r=>p_text_(r[0])===id);
  if(pos>=0)sh.deleteRow(pos+2);
}
function p_locked_(cb){const lock=LockService.getScriptLock();lock.waitLock(25000);try{return cb();}finally{lock.releaseLock();}}
/** Los datos de los Sheets públicos SOLO son la lista de referencia; todos
 * los permisos sensibles se verifican contra las hojas maestras privadas.
 */
function obtenerMiParticipacion(){
  const me=p_me_(),email=p_active_();
  const just=p_regs_('Justificaciones').filter(x=>x.miembroId===me.id);
  const deleg=p_regs_('Delegaciones').filter(x=>x.miembroId===me.id);
  const fullBaby=['full','baby'].includes(p_norm_(me.estatus));
  const reuniones=p_rows_('pub','Reuniones_publicas').filter(r=>fullBaby).map(r=>{
    const j=just.find(x=>x.reunionId===p_text_(r[0]));
    const limite=p_text_(r[5])?p_fecha_(r[5])+' '+p_text_(r[6]||'23:50'):'';
    return {id:p_text_(r[0]),fecha:p_fecha_(r[1]),hora:p_text_(r[2]),titulo:p_text_(r[3]),lugar:p_text_(r[4]),limite:limite,
      justificacion:j?j.texto:'',tardia:!!(limite&&p_ahora_()>limite)};
  });
  const votes=p_rows_('pub','Votaciones_publicas').map(r=>{
    const id=p_text_(r[0]);
    // Doblemente comprobar contra maestro para evitar una instantánea atrasada.
    let v;try{v=p_voteMaster_(id);}catch(e){return null;}
    if(!p_elector_(v,me))return null;
    const d=deleg.find(x=>x.votacionId===id);
    const dl=v.conf.dlFecha?String(v.conf.dlFecha)+' '+String(v.conf.dlHora||'23:50'):'';
    return {id:id,fecha:p_fecha_(r[1]),asunto:p_text_(r[2]),online:v.conf.online===true,
      reunionId:p_text_(v.conf.reunionId),reunionMarcada:p_bool_(r[5]),dl:dl,
      puedeDelegar:v.conf.online!==true&&v.conf.dlActivo!==false&&!!v.conf.dlFecha&&p_ahora_()<=dl,
      delegadoId:d?d.delegadoId:'',delegadoNombre:d?d.delegadoNombre||'Otro convocado':''};
  }).filter(Boolean);
  return {email:email,miembro:{nombre:me.nombre,estatus:me.estatus},reuniones:reuniones,votaciones:votes,board:false};
}
function guardarMiJustificacion(reunionId,texto){
  const me=p_me_();if(!['full','baby'].includes(p_norm_(me.estatus)))throw Error('Solo Full y Baby pueden justificar ausencias.');
  const content=p_text_(texto);if(content.length<5||content.length>3000)throw Error('Explica tu ausencia (entre 5 y 3000 caracteres).');
  const id=p_text_(reunionId);if(!/^reu_[\w-]{8,70}$/.test(id))throw Error('Reunión no válida.');
  return p_locked_(()=>{
    const reunion=p_reuMaster_(id);
    const old=p_regs_('Justificaciones').find(x=>x.reunionId===id&&x.miembroId===me.id);
    const now=new Date().toISOString();
    const obj={id:old?old.id:'jus_'+Utilities.getUuid(),reunionId:id,miembroId:me.id,
      email:me.email,nombre:me.nombre,texto:content,creado:old?old.creado:now,
      actualizado:now,board:old?old.board:false};
    p_save_('Justificaciones',obj);
    const limite=reunion.conf.fechaLimite?String(reunion.conf.fechaLimite)+' '+String(reunion.conf.horaLimite||'23:50'):'';
    const pendientes=p_rows_('pub','Votaciones_publicas').filter(r=>p_text_(r[4])===id).filter(r=>{
      try{const v=p_voteMaster_(p_text_(r[0]));return v.conf.online!==true&&v.conf.dlActivo!==false&&p_elector_(v,me)&&v.conf.dlFecha&&p_ahora_()<=String(v.conf.dlFecha)+' '+String(v.conf.dlHora||'23:50')&&!p_regs_('Delegaciones').some(d=>d.votacionId===v.id&&d.miembroId===me.id);}
      catch(e){return false;}
    }).map(r=>({id:p_text_(r[0]),asunto:p_text_(r[2])}));
    return {ok:true,tarde:!!(limite&&p_ahora_()>limite),pendientes:pendientes};
  });
}
function p_validVote_(id){
  const v=p_voteMaster_(id);
  if(v.conf.online===true)throw Error('Esta votación es online y no admite delegación.');
  if(v.conf.dlActivo===false||!v.conf.dlFecha)throw Error('Esta votación no tiene una DL de delegación habilitada.');
  if(p_ahora_()>String(v.conf.dlFecha)+' '+String(v.conf.dlHora||'23:50'))throw Error('La DL de delegación ha terminado.');
  // Si la reunión se marca para borrar después, NO se cancela la votación.
  return v;
}
function p_receiver_(vote,member,targetId){
  const myself=p_elector_(vote,member);
  if(!myself)throw Error('No estás convocado a esta votación.');
  const people=(vote.conf.exportCenso||{}).roster||[];
  const receiver=people.find(x=>x.id===targetId);
  if(!receiver||targetId===member.id||p_alias_(p_text_(receiver.email))||
     !(myself.preguntas||[]).every(k=>(receiver.preguntas||[]).includes(k)))
    throw Error('El delegado debe ser otro convocado con derecho a todas tus preguntas.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.email||''))throw Error('El delegado no tiene correo válido.');
  return receiver;
}
function buscarPosiblesDelegados(votacionId,texto){
  const me=p_me_(),q=p_norm_(texto);if(q.length<2)return [];
  const v=p_validVote_(p_text_(votacionId));if(!p_elector_(v,me))throw Error('No estás convocado.');
  return ((v.conf.exportCenso||{}).roster||[]).filter(x=>x.id!==me.id&&p_norm_(x.nombre).includes(q))
    .filter(x=>{try{return !!p_receiver_(v,me,x.id);}catch(e){return false;}})
    .slice(0,12).map(x=>({id:x.id,nombre:x.nombre,estatus:x.estatus}));
}
function p_checkCap_(vote,deles){
  const people=(vote.conf.exportCenso||{}).roster||[],map={};people.forEach(m=>{map[m.id]=m;});
  const out=new Set(),incoming={};
  deles.forEach(d=>{
    const a=map[d.miembroId],b=map[d.delegadoId];
    if(!a||!b||a.id===b.id||out.has(a.id))throw Error('Delegación inválida o duplicada.');
    out.add(a.id);
    if(!(a.preguntas||[]).every(k=>(b.preguntas||[]).includes(k)))throw Error('El delegado no tiene derecho a todas esas preguntas.');
    incoming[b.id]=(incoming[b.id]||0)+1;
  });
  deles.forEach(d=>{if(out.has(d.delegadoId))throw Error('No puedes recibir votos si ya has delegado el tuyo.');});
  Object.keys(incoming).forEach(id=>{if(incoming[id]>1)throw Error('Límite: dos votos totales por persona, contando el propio.');});
}
function guardarMiDelegacion(votacionId,delegadoId){
  const me=p_me_(),id=p_text_(votacionId),destId=p_text_(delegadoId);
  return p_locked_(()=>{
    const v=p_validVote_(id),dest=p_receiver_(v,me,destId);
    const ds=p_regs_('Delegaciones').filter(d=>d.votacionId===id),old=ds.find(d=>d.miembroId===me.id);
    p_checkCap_(v,ds.filter(d=>d.miembroId!==me.id).concat([{miembroId:me.id,delegadoId:dest.id}]));
    const now=new Date().toISOString();
    p_save_('Delegaciones',{id:old?old.id:'del_'+Utilities.getUuid(),votacionId:id,
      miembroId:me.id,email:me.email,delegadoId:dest.id,delegadoEmail:dest.email,
      delegadoNombre:dest.nombre,creado:old?old.creado:now,actualizado:now});
    const rid=p_text_(v.conf.reunionId);
    let debeJustificar=false;
    if(rid&&['full','baby'].includes(p_norm_(me.estatus))){
      try{p_reuMaster_(rid);debeJustificar=!p_regs_('Justificaciones').some(j=>j.reunionId===rid&&j.miembroId===me.id);}catch(e){}
    }
    return {ok:true,delegado:dest.nombre,debeJustificar:debeJustificar,reunionId:debeJustificar?rid:''};
  });
}
function quitarMiDelegacion(votacionId){
  const me=p_me_(),id=p_text_(votacionId);
  return p_locked_(()=>{
    p_validVote_(id);
    const old=p_regs_('Delegaciones').find(d=>d.votacionId===id&&d.miembroId===me.id);
    if(old)p_delete_('Delegaciones',old.id);
    return {ok:true};
  });
}
function obtenerJustificacionesBoard(){
  const email=p_active_();let allowed=false;
  try{allowed=!!GroupsApp.getGroupByEmail(P_CFG.BOARD_GROUP).hasUser(email);}catch(e){}
  if(!allowed)throw Error('No tienes permiso de Board para esta consulta.');
  return p_regs_('Justificaciones').filter(j=>j.board===true).map(j=>({
    nombre:j.nombre,texto:j.texto,reunionId:j.reunionId,actualizado:j.actualizado
  }));
}
/** Verificación rápida del propio administrador antes de pasar la URL a los miembros. */
function comprobarConexionParticipacion(){
  if(p_active_()!==String(Session.getEffectiveUser().getEmail()||'').toLowerCase())throw Error('Comprobación reservada al propietario.');
  const pub=SpreadsheetApp.openById(p_id_('pub')),priv=SpreadsheetApp.openById(p_id_('priv'));
  ['Reuniones_publicas','Votaciones_publicas'].forEach(name=>{if(!pub.getSheetByName(name))throw Error('Falta '+name);});
  ['Justificaciones','Delegaciones'].forEach(name=>{if(!priv.getSheetByName(name))throw Error('Falta '+name);});
  return {ok:true,publicacion:pub.getName(),privado:priv.getName()};
}

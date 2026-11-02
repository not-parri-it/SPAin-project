/** Seguimiento de asistencia y votaciones. La hoja PRIVADA no se comparte. */
const SEG = Object.freeze({SHEET:'Seguimiento',HEAD:['ID','JSON','Actualizado'], TZ:'Europe/Madrid'});
function seg_hoja_(crear){
  const ss=SpreadsheetApp.openById(bb_puenteID_('private'));
  let sh=ss.getSheetByName(SEG.SHEET);
  if(!sh&&crear){sh=ss.insertSheet(SEG.SHEET);sh.getRange(1,1,1,3).setValues([SEG.HEAD]);sh.setFrozenRows(1);}
  if(!sh)return null;
  if(sh.getRange(1,1,1,3).getDisplayValues()[0].join('|')!==SEG.HEAD.join('|'))throw Error('La pestaña privada Seguimiento tiene cabeceras incorrectas.');
  return sh;
}
function seg_leer_(){
  const sh=seg_hoja_(false);if(!sh||sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,2).getValues().filter(r=>r[0]).map(r=>{
    let x;try{x=JSON.parse(String(r[1]));}catch(e){throw Error('Datos de seguimiento dañados: '+r[0]);}
    if(x.key!==String(r[0]))throw Error('Identificador de seguimiento incoherente.');return x;
  });
}
function seg_guardar_(sh,x){
  const json=JSON.stringify(x);if(json.length>45000)throw Error('El registro de seguimiento supera el tamaño permitido.');
  const n=sh.getLastRow()-1, ids=n?sh.getRange(2,1,n,1).getValues():[];
  const i=ids.findIndex(r=>String(r[0])===x.key);sh.getRange(i<0?sh.getLastRow()+1:i+2,1,1,3).setValues([[x.key,json,new Date()]]);
}
function seg_eventos_(){
  const sh=abrirHojaReuniones_(), n=sh.getLastRow()-1;
  const raw=n&&sh.getMaxColumns()>=15?sh.getRange(2,1,n,15).getValues():[];
  const censusHeader=sh.getMaxColumns()>=15&&sh.getRange(1,15).getDisplayValue()==='Censo_asistencia_JSON';
  const porReu={};leerReuniones_().filter(r=>!r.marcado&&r.estado==='Convocada').forEach(r=>porReu[r.id]=r);
  const reuniones=raw.filter(r=>porReu[String(r[0])]).map(r=>{
    const x=porReu[String(r[0])];let snap=null;try{snap=JSON.parse(String(r[14]||'null'));}catch(e){}
    return {key:'reu:'+x.id,id:x.id,tipo:'reunion',fecha:x.fecha,hora:x.hora,titulo:x.titulo,
      roster:censusHeader&&snap&&snap.reunionId===x.id&&Array.isArray(snap.roster)?snap.roster:null};
  });
  const votos=vot_leer_().filter(v=>!v.marcado&&v.estado==='Confirmada').map(v=>{
    const r=porReu[String(v.config.reunionId||'')];
    // Sin hora de votación definida, esperamos al final del día en Madrid.
    const hora=r&&r.fecha===v.fecha?r.hora:'23:59';
    const finBase=v.fecha+' '+hora;
    const dl=v.config.online===true&&v.config.dlActivo!==false&&v.config.dlFecha&&v.config.dlHora?String(v.config.dlFecha)+' '+String(v.config.dlHora):'';
    const fin=dl>finBase?dl:finBase;
    const c=v.config.exportCenso;
    return {key:'vot:'+v.id,id:v.id,tipo:'votacion',fecha:v.fecha,hora:hora,titulo:v.asunto,
      fin:fin,roster:c&&Array.isArray(c.roster)?c.roster.filter(m=>Array.isArray(m.preguntas)&&m.preguntas.length):null};
  });
  return reuniones.concat(votos);
}
function seg_actualizar_(){
  const sh=seg_hoja_(true),all=seg_leer_(),by={};all.forEach(x=>by[x.key]=x);
  const eventos=seg_eventos_(),just=bb_justificaciones_(),deleg=bb_delegaciones_(),now=bb_ahoraMadrid_();
  eventos.forEach(e=>{
    if(!e.roster||!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha)||!/^\d{2}:\d{2}$/.test(e.hora)||(e.fin||e.fecha+' '+e.hora)>=now)return;
    let doc=by[e.key];
    if(!doc){
      const vistos=new Set();
      const rows=e.roster.map(m=>{
        if(!m.id||vistos.has(m.id))throw Error('Censo inválido en '+e.titulo+'.');vistos.add(m.id);
        return {id:String(m.id),nombre:String(m.nombre||''),estatus:String(m.estatus||''),resultado:'pendiente'};
      });
      doc={key:e.key,id:e.id,tipo:e.tipo,fecha:e.fecha,hora:e.hora,titulo:e.titulo,estado:'borrador',personas:rows};by[e.key]=doc;all.push(doc);
    }
    if(doc.estado!=='borrador')return;
    // No pisar una corrección manual de Secretaría.
    doc.personas.forEach(m=>{
      if(m.resultado!=='pendiente'||m.origen==='manual')return;
      const neutral=e.tipo==='reunion'?just.some(j=>j.reunionId===e.id&&j.miembroId===m.id):deleg.some(d=>d.votacionId===e.id&&d.miembroId===m.id);
      if(neutral){m.resultado=e.tipo==='reunion'?'justificado':'delegado';m.origen='automatico';}
    });
    seg_guardar_(sh,doc);
  });
  const activas=new Set(eventos.map(e=>e.key));
  return {eventos:eventos,registros:all.filter(x=>activas.has(x.key))};
}
function seg_contar_(docs,id,tipo){
  const sorted=docs.filter(x=>x.estado==='cerrado'&&x.tipo===tipo&&x.personas.some(m=>m.id===id))
    .sort((a,b)=>(b.fecha+' '+b.hora+' '+b.id).localeCompare(a.fecha+' '+a.hora+' '+a.id));
  const evaluables=sorted.map(x=>({evento:x,persona:x.personas.find(m=>m.id===id)}))
    .filter(x=>x.persona.resultado==='ok'||x.persona.resultado==='falta').slice(0,4);
  return {faltas:evaluables.filter(x=>x.persona.resultado==='falta').length, evaluables:evaluables};
}
function seg_notificar_(docs){
  const props=PropertiesService.getScriptProperties();let avisos=[];
  const members={};docs.filter(x=>x.estado==='cerrado').forEach(x=>x.personas.forEach(m=>members[x.tipo+'|'+m.id]={id:m.id,nombre:m.nombre,tipo:x.tipo}));
  Object.keys(members).forEach(key=>{
    const m=members[key],conteo=seg_contar_(docs,m.id,m.tipo),prop='SEG_ALERTA_'+Utilities.base64EncodeWebSafe(key),active=props.getProperty(prop)==='1';
    // No se decide una propuesta con resultados provisionales de esta persona y tipo.
    const provisional=docs.some(x=>x.estado==='borrador'&&x.tipo===m.tipo&&x.personas.some(p=>p.id===m.id));
    if(provisional)return;
    if(conteo.faltas>=3&&!active){
      try{MailApp.sendEmail('board@bestvalencia.org','[HR] Propuesta a inactive de '+m.nombre,'Propuesta a Inactive de '+m.nombre+' por '+(m.tipo==='reunion'?'asistencia a reuniones':'participación en votaciones')+'.\n\nSe han registrado '+conteo.faltas+' faltas entre las últimas '+conteo.evaluables.length+' convocatorias evaluables. Las justificaciones o delegaciones se excluyen del cómputo.\n\n'+conteo.evaluables.map(x=>x.evento.fecha+' · '+x.evento.titulo+' · '+x.persona.resultado).join('\n')+'\n\nEsta propuesta no cambia automáticamente el estatus.');
        props.setProperty(prop,'1');avisos.push('Propuesta enviada: '+m.nombre);
      }catch(e){avisos.push('No se pudo enviar la propuesta de '+m.nombre+': '+e.message);}
    } else if(conteo.faltas<3&&active)props.deleteProperty(prop);
  });return avisos;
}
function seg_listar(mes){
  bb_exigirSecretaria_();requerirPruebas_();if(!/^\d{4}-\d{2}$/.test(String(mes)))throw Error('Mes inválido.');
  return bajoBloqueo_(()=>{
    const a=seg_actualizar_(), by={};a.registros.forEach(x=>by[x.key]=x);
    const eventos=a.eventos.filter(e=>e.fecha.slice(0,7)===mes).sort((a,b)=>(a.fecha+a.hora).localeCompare(b.fecha+b.hora)).map(e=>{
      const d=by[e.key];return {key:e.key,tipo:e.tipo,fecha:e.fecha,hora:e.hora,titulo:e.titulo,sinCenso:!e.roster,estado:d?d.estado:'esperando',personas:d?d.personas.map(m=>Object.assign({},m,{faltas:seg_contar_(a.registros,m.id,e.tipo).faltas})):[]};
    });
    return {eventos:eventos,fulls:vot_miembros_().filter(m=>vot_norm_(m.estatus)==='full').length};
  });
}
function seg_guardarResultados(key, resultados, cerrar){
  bb_exigirSecretaria_();requerirPruebas_();
  return bajoBloqueo_(()=>{
    const a=seg_actualizar_(),doc=a.registros.find(x=>x.key===key);if(!doc)throw Error('No existe borrador para esta convocatoria.');
    if(doc.estado==='cerrado')throw Error('La convocatoria ya está cerrada.');
    if(!resultados||typeof resultados!=='object'||Array.isArray(resultados))throw Error('Resultados inválidos.');
    const ids=new Set(doc.personas.map(m=>m.id));if(Object.keys(resultados).some(id=>!ids.has(id)))throw Error('Miembro fuera del censo.');
    const valid=doc.tipo==='reunion'?['pendiente','ok','falta','justificado']:['pendiente','ok','falta','delegado'];
    doc.personas.forEach(m=>{if(Object.prototype.hasOwnProperty.call(resultados,m.id)){const value=resultados[m.id];if(!valid.includes(value))throw Error('Resultado inválido.');m.resultado=value;m.origen='manual';}});
    if(cerrar&&doc.personas.some(m=>m.resultado==='pendiente'))throw Error('Quedan personas pendientes.');
    if(cerrar){doc.estado='cerrado';doc.cerradoEn=new Date().toISOString();doc.cerradoPor=bb_identidadActiva_();}
    seg_guardar_(seg_hoja_(true),doc);SpreadsheetApp.flush();return {ok:true,avisos:cerrar?seg_notificar_(a.registros):[]};
  });
}
function seg_instalar(){
  bb_exigirSecretaria_();requerirPruebas_();
  bajoBloqueo_(()=>seg_actualizar_());
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='seg_trigger').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('seg_trigger').timeBased().everyHours(1).create();return {ok:true};
}
function seg_trigger(){bb_exigirSecretariaTrigger_();bajoBloqueo_(()=>{const a=seg_actualizar_();seg_notificar_(a.registros);});}
/** Una corrección posterior se hace reabriendo y cerrando de nuevo. */
function seg_reabrir(key){
  bb_exigirSecretaria_();requerirPruebas_();
  return bajoBloqueo_(()=>{
    const a=seg_actualizar_(),doc=a.registros.find(x=>x.key===key);
    if(!doc||doc.estado!=='cerrado')throw Error('La convocatoria no está cerrada o no existe.');
    doc.estado='borrador';doc.reabiertoEn=new Date().toISOString();doc.reabiertoPor=bb_identidadActiva_();
    seg_guardar_(seg_hoja_(true),doc);return {ok:true};
  });
}

/**
 * Big Brother v0.9.1 · Publicador y almacén privado, SOLO proyecto Gestión.
 * LOS DOS IDs SE CONFIGURAN AQUÍ. No compartir ninguno de los dos Sheets.
 * Las cabeceras en los archivos de origen no se alteran.
 */
const BB_PUENTE = Object.freeze({
  PUBLIC_ID: '150EVu_CoRCucmJMbv1ihFBWmAXqEI1QoKpQ_abfE48s',
  PRIVATE_ID: '1RMZMfTEO5aDXo6LwO6pI6TQTw9jogB7lZIHJ4Tzs-eg',
  REUNIONES_PUBLICAS: 'Reuniones_publicas',
  VOTACIONES_PUBLICAS: 'Votaciones_publicas',
  JUSTIFICACIONES: 'Justificaciones',
  DELEGACIONES: 'Delegaciones'
});
const BB_PUB_CAB_REU = ['ID','Fecha','Hora','Titulo','Lugar','Limite_justificacion_fecha','Limite_justificacion_hora'];
const BB_PUB_CAB_VOT = ['ID','Fecha','Asunto','Online','Reunion_ID','Reunion_marcada','DL_fecha','DL_hora'];
const BB_PRIV_CAB = ['ID','JSON_privado','Actualizado'];
function bb_puenteID_(kind) {
  const id = String(kind === 'private' ? BB_PUENTE.PRIVATE_ID : BB_PUENTE.PUBLIC_ID).trim();
  if (!/^[a-zA-Z0-9_-]{25,}$/.test(id) || id.indexOf('PEGA_AQUI') >= 0)
    throw new Error('Configura PUBLIC_ID y PRIVATE_ID en Gestion/Publicador.gs antes de iniciar el puente.');
  if (id === REU_CONFIG.SPREADSHEET_ID || id === VOT_CONFIG.MIEMBROS_SHEET || BB_PUENTE.PUBLIC_ID === BB_PUENTE.PRIVATE_ID)
    throw new Error('El Sheet público, el privado y las bases originales deben ser archivos DISTINTOS.');
  return id;
}
function bb_puenteConfigurado_() {
  return /^[a-zA-Z0-9_-]{25,}$/.test(BB_PUENTE.PRIVATE_ID) && !BB_PUENTE.PRIVATE_ID.startsWith('PEGA_AQUI');
}
function bb_hojaNueva_(spreadsheet, nombre, headers) {
  let sh=spreadsheet.getSheetByName(nombre);
  if(!sh){ sh=spreadsheet.insertSheet(nombre); sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#1973BE'); }
  const got=sh.getRange(1,1,1,headers.length).getDisplayValues()[0];
  if(headers.some((h,i)=>got[i]!==h))throw new Error('Cabeceras incorrectas en '+nombre+'. No se sobreescribe un esquema desconocido.');
  return sh;
}
function bb_privHoja_(tipo) {
  const ss=SpreadsheetApp.openById(bb_puenteID_('private'));
  const nom=tipo==='just'?BB_PUENTE.JUSTIFICACIONES:BB_PUENTE.DELEGACIONES;
  const sh=ss.getSheetByName(nom);
  if(!sh)throw new Error('Primero ejecuta prepararPuenteBigBrother() en Gestión: falta '+nom+'.');
  const cab=sh.getRange(1,1,1,3).getDisplayValues()[0];
  if(BB_PRIV_CAB.some((h,i)=>h!==cab[i]))throw new Error('Esquema privado inválido: '+nom);
  return sh;
}
/** Puente de escritura; el publicador se invoca DESPUÉS de cada cambio de estado.
 * Si falla, el cambio principal no se deshace; el trigger periódico reparará la copia.
 */
function bb_publicarTrasCambio_() {
  if(!bb_puenteConfigurado_())return;
  try{bb_publicarSnapshot_();}
  catch(e){console.error('Fallo de publicación: '+e.message);}
}
function bb_publicarSnapshot_() {
  const reuniones=leerReuniones_();
  const votos=vot_leer_();
  const porId={};reuniones.forEach(r=>{porId[r.id]=r;});
  // Solo datos explícitamente publicables; NUNCA copiar agendas,
  // Configuracion_JSON, correos, censos ni motivos de ausencia.
  const rs=reuniones.filter(r=>r.estado==='Convocada'&&!r.marcado).map(r=>[
    r.id,r.fecha,r.hora,r.titulo,r.lugar,
    String((r.convocatoria||{}).fechaLimite||''),String((r.convocatoria||{}).horaLimite||'23:50')
  ]);
  const vs=votos.filter(v=>v.estado==='Confirmada'&&!v.marcado).map(v=>{
    const rid=String((v.config||{}).reunionId||'');
    const linked=porId[rid];
    return [v.id,v.fecha,v.asunto,v.config.online===true,rid,!!(linked&&linked.marcado),
      String(v.config.dlFecha||''),String(v.config.dlHora||'23:50')];
  });
  const ss=SpreadsheetApp.openById(bb_puenteID_('public'));
  // Validar las DOS pestañas antes de empezar a reemplazar datos.
  const rsh=bb_hojaNueva_(ss,BB_PUENTE.REUNIONES_PUBLICAS,BB_PUB_CAB_REU);
  const vsh=bb_hojaNueva_(ss,BB_PUENTE.VOTACIONES_PUBLICAS,BB_PUB_CAB_VOT);
  [[rsh,rs,BB_PUB_CAB_REU.length],[vsh,vs,BB_PUB_CAB_VOT.length]].forEach(x=>{
    const sh=x[0],data=x[1],cols=x[2],prior=sh.getLastRow();
    if(prior>1)sh.getRange(2,1,prior-1,cols).clearContent();
    if(data.length){sh.getRange(2,1,data.length,cols).setNumberFormat('@').setValues(data);}
  });
  SpreadsheetApp.flush();
  return {ok:true,reuniones:rs.length,votaciones:vs.length,actualizado:new Date().toISOString()};
}
/** Lee en el almacén NUEVO; solo se usa ScriptProperties antes de configurar los IDs. */
function bb_privLeer_(prefix) {
  const sh=bb_privHoja_(prefix===BB_PART.JUST_PREFIX?'just':'deleg');
  if(sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,2).getValues().filter(r=>r[0]).map(r=>{
    try {const o=JSON.parse(String(r[1]||''));if(o.id!==String(r[0]))throw Error('ID distinto');return o;}
    catch(e){throw Error('Registro privado corrupto: '+r[0]+'. No se ha eliminado.');}
  });
}
function bb_privGuardar_(prefix,reg) {
  const sh=bb_privHoja_(prefix===BB_PART.JUST_PREFIX?'just':'deleg');
  const n=sh.getLastRow()-1;
  const ids=n?sh.getRange(2,1,n,1).getValues().map(r=>String(r[0])):[];
  const pos=ids.indexOf(reg.id),row=pos>=0?pos+2:sh.getLastRow()+1;
  sh.getRange(row,1,1,3).setValues([[reg.id,JSON.stringify(reg),new Date()]]);
}
function bb_privBorrar_(prefix,id) {
  const sh=bb_privHoja_(prefix===BB_PART.JUST_PREFIX?'just':'deleg');
  const n=sh.getLastRow()-1;
  if(n<1)return;
  const ids=sh.getRange(2,1,n,1).getValues().map(r=>String(r[0]));
  const i=ids.indexOf(id);if(i>=0)sh.deleteRow(i+2);
}
/** Ejecuta una sola vez antes de desplegar Gestión actualizada o Participación.
 * Migra todos los registros antiguos, sin borrar sus copias de seguridad.
 */
function prepararPuenteBigBrother() {
  bb_exigirSecretaria_();
  requerirPruebas_();
  const pub=SpreadsheetApp.openById(bb_puenteID_('public'));
  const priv=SpreadsheetApp.openById(bb_puenteID_('private'));
  bb_hojaNueva_(pub,BB_PUENTE.REUNIONES_PUBLICAS,BB_PUB_CAB_REU);
  bb_hojaNueva_(pub,BB_PUENTE.VOTACIONES_PUBLICAS,BB_PUB_CAB_VOT);
  bb_hojaNueva_(priv,BB_PUENTE.JUSTIFICACIONES,BB_PRIV_CAB);
  bb_hojaNueva_(priv,BB_PUENTE.DELEGACIONES,BB_PRIV_CAB);
  const p=PropertiesService.getScriptProperties().getProperties();
  const propsService=PropertiesService.getScriptProperties();
  let migrados=0;
  if(!propsService.getProperty('BB_MIGRACION_CERRADA_V09'))[BB_PART.JUST_PREFIX,BB_PART.DELEG_PREFIX].forEach(prefix=>{
    Object.keys(p).filter(k=>k.startsWith(prefix)).forEach(k=>{
      const r=JSON.parse(p[k]);
      const presentes=bb_privLeer_(prefix);
      if(!presentes.some(x=>x.id===r.id)){bb_privGuardar_(prefix,r);migrados++;}
    });
  });
  // La migración se cierra una sola vez: repetir esta función jamás
  // resucitará una delegación antigua que ya haya sido cancelada.
  const publicados=bb_publicarSnapshot_();
  propsService.setProperty('BB_MIGRACION_CERRADA_V09','true');
  return {ok:true,migrados:migrados,copiasConservadas:true,publicados:publicados};
}
function publicarBigBrotherAhora(){
  bb_exigirSecretaria_();requerirPruebas_();return bb_publicarSnapshot_();}
function bb_publicarEnTrigger(){bb_exigirSecretariaTrigger_();return bb_publicarSnapshot_();}
/** Publica cada 5 min (los cambios por Apps Script no activan onEdit).
 * También actualiza por edición manual en el Sheet original.
 */
function instalarTriggersBigBrother(){
  bb_exigirSecretaria_();
  requerirPruebas_();
  const nombres=['bb_publicarEnTrigger','bb_publicarEnEdicion'];
  ScriptApp.getProjectTriggers().forEach(t=>{if(nombres.includes(t.getHandlerFunction()))ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('bb_publicarEnTrigger').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('bb_publicarEnEdicion').forSpreadsheet(REU_CONFIG.SPREADSHEET_ID).onEdit().create();
  return {ok:true,mensaje:'Publicación cada 5 minutos y tras ediciones manuales del Sheet de Reuniones/Votaciones.'};
}
function bb_publicarEnEdicion(e){
  bb_exigirSecretariaTrigger_();
  if(e&&e.range&&['Reuniones','Votaciones'].includes(e.range.getSheet().getName()))bb_publicarSnapshot_();
}

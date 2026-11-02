/**
 * Big Brother · Miembros v1.1.0 · Publicación con todos los campos visibles en v0.3.8.
 * Fuente de verdad: hojas privadas. Este Sheet publicado NO se comparte con los miembros.
 * Conserva las columnas originales iniciales para que v1.0.0 siga leyendo durante el despliegue.
 */
const BB_MPUB=Object.freeze({
  PUBLIC_ID:'150EVu_CoRCucmJMbv1ihFBWmAXqEI1QoKpQ_abfE48s',
  MIEMBROS_TAB:'Miembros_publicos',
  CAMBIOS_TAB:'Cambios_estatus_publicos',
  META_TAB:'Miembros_publicacion_meta'
});
const BB_PUB_MIEM_CAB=['Nombre','Apellidos','Estatus','Correo','Fecha_union','Telefono','ID_Miembro'];
const BB_PUB_CAM_CAB=['Fecha','Nombre','Apellidos','Nuevo_estatus','Documento','URL_documento','ID_Miembro','ID_Cambio'];

function bb_mpub_hoja_(libro,nombre,cabecera,legado) {
  let h=libro.getSheetByName(nombre);
  if(!h) h=libro.insertSheet(nombre);
  const n=h.getLastColumn();
  const actual=n?h.getRange(1,1,1,Math.min(n,cabecera.length)).getDisplayValues()[0]:[];
  const esNueva=actual.every(c=>!c);
  const esLegada=actual.slice(0,legado.length).every((v,i)=>v===legado[i])&&actual.slice(legado.length).every(v=>!v);
  const esNuevaVersion=actual.slice(0,cabecera.length).every((v,i)=>v===cabecera[i]);
  if(!esNueva&&!esLegada&&!esNuevaVersion) throw new Error('Esquema inesperado en '+nombre+'. No se ha modificado.');
  if(h.getMaxColumns()<cabecera.length)h.insertColumnsAfter(h.getMaxColumns(),cabecera.length-h.getMaxColumns());
  h.getRange(1,1,1,cabecera.length).setValues([cabecera]);
  h.getRange(1,1,1,cabecera.length).setFontWeight('bold').setFontColor('#fff').setBackground('#1973BE');
  h.setFrozenRows(1);
  return h;
}
function bb_mpub_seguro_(valor){
  const s=String(valor==null?'':valor).trim();
  return /^[\s]*[=+\-@]/.test(s)?"'"+s:s;
}
function bb_mpub_escribir_(hoja,filas,columnas){
  const n=Math.max(0,hoja.getLastRow()-1);
  if(n)hoja.getRange(2,1,n,columnas).clearContent();
  if(filas.length)hoja.getRange(2,1,filas.length,columnas).setValues(filas);
}
function sincronizarPublicacionMiembros_(){
  const ssId=String(BB_MPUB.PUBLIC_ID||'').trim();
  if(ssId===BB_CONFIG.SPREADSHEET_ID||ssId===BB_CONFIG.SPREADSHEET_CAMBIOS_ID)
    throw new Error('No se puede publicar sobre un Sheet original.');
  const origen=abrirHoja_();validarEsquema_(origen);
  const n=Math.max(0,origen.getLastRow()-1);
  const filas=n?origen.getRange(2,1,n,8).getValues():[];
  const visibles=n?origen.getRange(2,1,n,6).getDisplayValues():[];
  const idsMarcados=new Set(filas.filter(r=>estaMarcado_(r[7])).map(r=>String(r[6]||'').trim()).filter(Boolean));
  const miembros=filas.map((r,i)=>({
    id:String(r[6]||'').trim(),nombre:String(r[0]||'').trim(),
    apellidos:String(r[1]||'').trim(),estatus:String(r[2]||'').trim(),
    correo:String(r[3]||'').trim(),
    fechaUnion:fechaDesdeHoja_(r[4],origen)||String(visibles[i][4]||'').trim(),
    telefono:String(r[5]||'').trim(),marcado:estaMarcado_(r[7])
  })).filter(m=>m.id&&!m.marcado&&(m.nombre||m.apellidos))
    .sort((a,b)=>(a.apellidos+' '+a.nombre).localeCompare(b.apellidos+' '+b.nombre,'es'));
  // El histórico mantiene documentos y enlaces rich-text, tal como la v0.3.8.
  const cambios=listarCambiosEstatus_(true).filter(c=>!idsMarcados.has(c.miembroId));
  const ss=SpreadsheetApp.openById(ssId);
  const hm=bb_mpub_hoja_(ss,BB_MPUB.MIEMBROS_TAB,BB_PUB_MIEM_CAB,['Nombre','Apellidos','Estatus']);
  const hc=bb_mpub_hoja_(ss,BB_MPUB.CAMBIOS_TAB,BB_PUB_CAM_CAB,['Fecha','Nombre','Apellidos','Nuevo_estatus']);
  const meta=bb_mpub_hoja_(ss,BB_MPUB.META_TAB,['Clave','Valor'],['Clave','Valor']);
  bb_mpub_escribir_(hm,miembros.map(m=>[
    bb_mpub_seguro_(m.nombre),bb_mpub_seguro_(m.apellidos),bb_mpub_seguro_(m.estatus),
    bb_mpub_seguro_(m.correo),bb_mpub_seguro_(m.fechaUnion),bb_mpub_seguro_(m.telefono),bb_mpub_seguro_(m.id)
  ]),BB_PUB_MIEM_CAB.length);
  bb_mpub_escribir_(hc,cambios.map(c=>[
    bb_mpub_seguro_(c.fecha),bb_mpub_seguro_(c.nombre),bb_mpub_seguro_(c.apellidos),
    bb_mpub_seguro_(c.nuevoEstatus),bb_mpub_seguro_(c.documento),bb_mpub_seguro_(c.url),
    bb_mpub_seguro_(c.miembroId),bb_mpub_seguro_(c.id)
  ]),BB_PUB_CAM_CAB.length);
  bb_mpub_escribir_(meta,[
    ['Actualizado',Utilities.formatDate(new Date(),'Europe/Madrid','dd/MM/yyyy HH:mm:ss')],
    ['Miembros',String(miembros.length)],['Cambios',String(cambios.length)],['Version','1.1.0']
  ],2);
  SpreadsheetApp.flush();
  return {miembros:miembros.length,cambios:cambios.length};
}
function reconstruirPublicacionMiembros(){
  requerirPermiso_();
  const r=sincronizarPublicacionMiembros_();
  return 'Publicado: '+r.miembros+' miembros y '+r.cambios+' cambios, con todos los campos de consulta.';
}
function sincronizarMiembrosProgramado(){
  const email=String(Session.getEffectiveUser().getEmail()||'').toLowerCase();
  if(!esSecretariaMiembros_(email))throw new Error('Este trigger debe pertenecer a Secretaría.');
  return sincronizarPublicacionMiembros_();
}
function instalarSincronizacionMiembros(){
  requerirPermiso_();
  const nombre='sincronizarMiembrosProgramado';
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===nombre).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(nombre).timeBased().everyMinutes(5).create();
  return 'Sincronización de Miembros instalada cada cinco minutos.';
}

/** Big Brother Miembros · Participación · v1.1.0
 * Ejecutar como: YO (cuenta administradora de pruebas actual).
 * Acceso: usuarios del dominio BEST Valencia.
 * NO conceder acceso a Sheets a los miembros.
 * No incluye ni invoca acciones administrativas.
 */
const MIEM_PART=Object.freeze({
  DOMINIO:'bestvalencia.org',
  ORIGINAL_ID:'1IZxJW6VMdmBzICjVOCEQXpe7hHu7oTcKc3tVMEp0yPY',
  ORIGINAL_TAB:'Miembros',
  PUBLIC_ID:'150EVu_CoRCucmJMbv1ihFBWmAXqEI1QoKpQ_abfE48s',
  PUBLIC_MIEMBROS_TAB:'Miembros_publicos',
  PUBLIC_CAMBIOS_TAB:'Cambios_estatus_publicos',
  PUBLIC_META_TAB:'Miembros_publicacion_meta',
  ESTATUS_ACCESO:['Full','Baby','Observer','Alumni','Inactive','Granizado de pleno derecho','Granizado simple','Guest']
});
function doGet(){
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Miembros · BEST Valencia').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function miemPartEstaMarcado_(v){return v===true||/^true$/i.test(String(v||'').trim());}
function miemPartCorreo_(){
  const correo=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
  if(!correo||!correo.endsWith('@'+MIEM_PART.DOMINIO))
    throw new Error('No se ha podido verificar tu correo de BEST Valencia. Entra con tu cuenta @bestvalencia.org.');
  return correo;
}
function miemPartVerificarMiembro_(){
  const email=miemPartCorreo_();
  const hoja=SpreadsheetApp.openById(MIEM_PART.ORIGINAL_ID).getSheetByName(MIEM_PART.ORIGINAL_TAB);
  if(!hoja)throw new Error('No se encuentra la hoja de Miembros.');
  const n=hoja.getLastRow()-1;
  if(n<=0)throw new Error('No tienes un registro activo en Miembros.');
  // Acceso a datos privados solamente en servidor para comprobar identidad.
  // Nunca devolver correo, teléfono, ID ni filas crudas al navegador.
  const filas=hoja.getRange(2,1,n,8).getValues();
  const activos=filas.filter(r=>String(r[3]||'').trim().toLowerCase()===email&&String(r[6]||'').trim()&&!miemPartEstaMarcado_(r[7]));
  if(activos.length!==1 || !MIEM_PART.ESTATUS_ACCESO.includes(String(activos[0][2]||'').trim()))
    throw new Error('Tu correo no está asociado de forma única a un miembro autorizado. Consulta con Secretaría.');
  return {correo:email,nombre:String(activos[0][0]||'').trim()};
}
function miemPartComprobarCabecera_(h,cab){
  if(!h)throw new Error('Falta publicar Miembros. Secretaría debe ejecutar reconstruirPublicacionMiembros().');
  const real=h.getRange(1,1,1,cab.length).getDisplayValues()[0];
  if(cab.some((v,i)=>real[i]!==v))throw new Error('Esquema de publicación no válido.');
}
function miemPartLeer_(h,cols){
  const n=Math.max(0,h.getLastRow()-1);
  return n?h.getRange(2,1,n,cols).getDisplayValues():[];
}
/** ÚNICA API expuesta para consulta: solo devuelve columnas públicas. */
/** API exclusivamente de lectura. Datos públicos dentro del dominio y del directorio de miembros.
 * Ninguna función de modificación ni acceso a datos marcados para borrado.
 */
function consultarMiembrosPublicos(){
  const ident=miemPartVerificarMiembro_();
  const ss=SpreadsheetApp.openById(MIEM_PART.PUBLIC_ID);
  const mh=ss.getSheetByName(MIEM_PART.PUBLIC_MIEMBROS_TAB);
  const ch=ss.getSheetByName(MIEM_PART.PUBLIC_CAMBIOS_TAB);
  const meta=ss.getSheetByName(MIEM_PART.PUBLIC_META_TAB);
  miemPartComprobarCabecera_(mh,['Nombre','Apellidos','Estatus','Correo','Fecha_union','Telefono','ID_Miembro']);
  miemPartComprobarCabecera_(ch,['Fecha','Nombre','Apellidos','Nuevo_estatus','Documento','URL_documento','ID_Miembro','ID_Cambio']);
  const m=miemPartLeer_(mh,7).map(r=>({
    nombre:r[0],apellidos:r[1],estatus:r[2],correo:r[3],fechaUnion:r[4],telefono:r[5],id:r[6]
  }));
  const c=miemPartLeer_(ch,8).map(r=>({
    fecha:r[0],nombre:r[1],apellidos:r[2],nuevoEstatus:r[3],documento:r[4],url:r[5],miembroId:r[6],id:r[7]
  }));
  const actualizado=meta&&meta.getLastRow()>1?String(meta.getRange(2,2).getDisplayValue()||''):'';
  return {usuario:ident.correo,nombre:ident.nombre,miembros:m,cambios:c,actualizado:actualizado};
}

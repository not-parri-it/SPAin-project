/** Solo expone al usuario identificado sus resultados cerrados. */
function obtenerMiHistorialSeguimiento(){
  const me=p_me_(), sh=SpreadsheetApp.openById(p_id_('priv')).getSheetByName('Seguimiento');
  if(!sh)return {nombre:me.nombre,eventos:[],reuniones:0,votaciones:0};
  if(sh.getRange(1,1,1,3).getDisplayValues()[0].join('|')!=='ID|JSON|Actualizado')throw Error('Esquema de seguimiento incorrecto. Contacta con Secretaría.');
  const n=sh.getLastRow()-1,rows=n>0?sh.getRange(2,1,n,2).getValues():[];
  const events=rows.filter(r=>r[0]).map(r=>{let x;try{x=JSON.parse(String(r[1]));}catch(e){throw Error('Registro de seguimiento dañado. Contacta con Secretaría.');}
    if(x.key!==String(r[0]))throw Error('Registro de seguimiento incoherente.');
    const m=Array.isArray(x.personas)?x.personas.find(p=>p.id===me.id):null;
    return m&&x.estado==='cerrado'?{id:x.id,tipo:x.tipo,fecha:x.fecha,hora:x.hora,titulo:x.titulo,resultado:m.resultado}:null;
  }).filter(Boolean).sort((a,b)=>(b.fecha+' '+b.hora+' '+b.id).localeCompare(a.fecha+' '+a.hora+' '+a.id));
  function contar(t){return events.filter(x=>x.tipo===t&&(x.resultado==='ok'||x.resultado==='falta')).slice(0,4).filter(x=>x.resultado==='falta').length;}
  return {nombre:me.nombre,eventos:events,reuniones:contar('reunion'),votaciones:contar('votacion')};
}

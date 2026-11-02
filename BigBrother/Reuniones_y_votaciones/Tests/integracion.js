const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['Gestion/Código.gs','Gestion/Publicador.gs','Gestion/Seguimiento.gs','Participacion/Código.gs','Participacion/Seguimiento.gs'])new vm.Script(fs.readFileSync(__dirname+'/../'+file,'utf8'),{filename:file});
for(const file of ['Gestion/Index.html','Participacion/Index.html']){const html=fs.readFileSync(__dirname+'/../'+file,'utf8');for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:file});}
function sheet(){const rows=[['ID','JSON','Actualizado']];return {rows,getLastRow(){return rows.length},setFrozenRows(){},getRange(r,c,n=1,m=1){return {getValues(){return Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>(rows[r+i-1]||[])[c+j-1]??''))},getDisplayValues(){return this.getValues().map(a=>a.map(String))},setValues(v){for(let i=0;i<n;i++){while(rows.length<r+i)rows.push([]);for(let j=0;j<m;j++)rows[r+i-1][c+j-1]=v[i][j]}return this}}}}}
const sh=sheet(),props=new Map(),mails=[];let allowed=true;
const ctx={console,Set,Date,SpreadsheetApp:{openById(){return {getSheetByName(){return sh},insertSheet(){return sh}}},flush(){}},
  PropertiesService:{getScriptProperties(){return {getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v),deleteProperty:k=>props.delete(k)}}},
  Utilities:{base64EncodeWebSafe:s=>Buffer.from(s).toString('base64url')},MailApp:{sendEmail(...args){mails.push(args)}},
  bb_puenteID_:()=> 'private',bb_justificaciones_:()=>[],bb_delegaciones_:()=>[{votacionId:'v3',miembroId:'m1'}],bb_ahoraMadrid_:()=> '2027-12-31 23:59',
  bb_exigirSecretaria_:()=>{if(!allowed)throw Error('denegado')},requerirPruebas_:()=>{},bb_identidadActiva_:()=> 'admin@example.org',bajoBloqueo_:fn=>fn(),vot_miembros_:()=>[{id:'m1',estatus:'Full'}],vot_norm_:s=>s.toLowerCase()};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../Gestion/Seguimiento.gs','utf8'),ctx);
const roster=[{id:'m1',nombre:'Persona Uno',estatus:'Baby'},{id:'m2',nombre:'Persona Dos',estatus:'Full'}];
const events=[1,2,3,4].map(i=>({key:'vot:v'+i,id:'v'+i,tipo:'votacion',fecha:'2026-10-0'+i,hora:'20:00',titulo:'Votación '+i,roster}));
events.push({key:'reu:r1',id:'r1',tipo:'reunion',fecha:'2026-10-05',hora:'20:00',titulo:'Reunión',roster});
ctx.seg_eventos_=()=>events;
let view=ctx.seg_listar('2026-10');assert.equal(view.eventos.length,5);assert.equal(view.fulls,1);assert.equal(view.eventos[2].personas[0].resultado,'delegado');
assert.throws(()=>ctx.seg_guardarResultados('vot:v1',{m1:'falta'},true),/pendientes/);assert.equal(mails.length,0);
for(const [i,result] of [[1,'falta'],[2,'falta'],[3,'delegado'],[4,'falta']]){
 ctx.seg_guardarResultados('vot:v'+i,{m1:result,m2:'ok'},true);
 if(i<4)assert.equal(mails.length,0);
}
assert.equal(mails.length,1);assert.equal(mails[0][0],'board@bestvalencia.org');assert.match(mails[0][1],/Persona Uno/);
let docs=ctx.seg_leer_();assert.equal(ctx.seg_contar_(docs,'m1','votacion').faltas,3);assert.equal(ctx.seg_contar_(docs,'m1','reunion').faltas,0);
ctx.seg_notificar_(docs);assert.equal(mails.length,1);
ctx.seg_guardarResultados('reu:r1',{m1:'ok',m2:'justificado'},true);assert.equal(mails.length,1);
assert.throws(()=>ctx.seg_guardarResultados('reu:r1',{m1:'falta'},true),/cerrada/);
ctx.seg_reabrir('reu:r1');ctx.seg_guardarResultados('reu:r1',{m1:'ok'},true);assert.equal(mails.length,1);
allowed=false;assert.throws(()=>ctx.seg_listar('2026-10'),/denegado/);assert.throws(()=>ctx.seg_guardarResultados('vot:v4',{},false),/denegado/);allowed=true;
props.clear();mails.length=0;
const pending=docs.concat([{key:'vot:pendiente',id:'pendiente',tipo:'votacion',fecha:'2026-10-06',hora:'20:00',estado:'borrador',personas:[{id:'m1',nombre:'Persona Uno',resultado:'pendiente'}]}]);
ctx.seg_notificar_(pending);assert.equal(mails.length,0);ctx.seg_notificar_(docs);assert.equal(mails.length,1);
const participant={p_me_:()=>({id:'m1',nombre:'Persona Uno'}),p_id_:()=> 'private',SpreadsheetApp:{openById(){return {getSheetByName(){return sh}}}}};vm.createContext(participant);vm.runInContext(fs.readFileSync(__dirname+'/../Participacion/Seguimiento.gs','utf8'),participant);
const mine=participant.obtenerMiHistorialSeguimiento();assert.equal(mine.votaciones,3);assert.equal(mine.reuniones,0);assert.equal(mine.eventos.length,5);assert(!JSON.stringify(mine).includes('Persona Dos'));assert(!JSON.stringify(mine).includes('m2'));
console.log('OK: sintaxis, borradores, cierre, neutros, contadores separados, correo sin duplicar, permisos e historial propio.');

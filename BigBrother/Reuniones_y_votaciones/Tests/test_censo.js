const fs=require('fs'), vm=require('vm'), assert=require('assert');
const source=fs.readFileSync(__dirname+'/../Gestion/Código.gs','utf8');
function sheet(rows, maxCols=26) {
  return {rows,maxCols, getLastRow(){return this.rows.length;},getMaxRows(){return 50;},getMaxColumns(){return this.maxCols;},insertColumnsAfter(n,c){this.maxCols+=c;},hideColumns(){},getRange(row,col,n=1,m=1){
    const sh=this;
    const get=()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>(sh.rows[row+i-1]||[])[col+j-1]??''));
    const put=(vals)=>{for(let i=0;i<n;i++){while(sh.rows.length<row+i)sh.rows.push([]);for(let j=0;j<m;j++)sh.rows[row+i-1][col+j-1]=vals[i][j];}};
    return {getValues:get,getDisplayValues(){return get().map(r=>r.map(String));},getDisplayValue(){return String(get()[0][0]);},setValue(v){put([[v]]);return this;},setValues(v){put(v);return this;},setBackground(){return this;},setFontColor(){return this;},setFontWeight(){return this;},setNumberFormat(){return this;}};
  }};
}
const header=['ID_reunion','Fecha','Hora','Titulo','Lugar','Estado','Puntos_dia_JSON','Puntos_noche_JSON','Link_acta','Link_acta_anterior','Ultima_actualizacion','Actualizado_por','Marcado_para_borrado','Convocatoria_JSON'];
const mh=['Nombre','Apellidos','Estatus','Correo','Fecha de union','Teléfono','ID_Miembro','Marcado_para_borrado'];
let members=sheet([mh,['Ana','Uno','Full','ana@example.org','','','m1',false],['Bea','Dos','Baby','bea@example.org','','','m2',false],['C','Tres','Inactive','','','','m3',false],['D','Cuatro','Full','','','','m4',true]]);
let meetings=sheet([header.slice(),['reu_12345678901234567890','2026-11-02','20:00','Reunión','Sala','Borrador','','','','','','',false,'{}']]);
let failMembers=false;
const context={console,SpreadsheetApp:{openById(){if(failMembers)throw Error('No se puede abrir Miembros');return {getSheetByName(){return members;}}},flush(){}},Session:{getActiveUser(){return {getEmail(){return 'pablo.parrilla@bestvalencia.org';}}}},LockService:{getScriptLock(){return {waitLock(){},releaseLock(){}}}}};
vm.createContext(context);vm.runInContext(source,context);
context.abrirHojaReuniones_=()=>meetings;
context.bb_publicarTrasCambio_=()=>{};
const id='reu_12345678901234567890';
let res=context.confirmarConvocatoriaReunion(id);
assert.equal(res.estado,'Convocada');assert.equal(meetings.rows[1][5],'Convocada');
const snap=JSON.parse(meetings.rows[1][14]);assert.equal(snap.reunionId,id);assert.deepEqual(snap.roster.map(x=>x.id),['m1','m2']);
members.rows[1][2]='Inactive';members.rows[2][2]='Full';
context.confirmarConvocatoriaReunion(id);assert.equal(meetings.rows[1][14],JSON.stringify(snap));
// Exercise the real meeting save path, including its 14-column write.
meetings.getParent=()=>({getSpreadsheetTimeZone:()=> 'Europe/Madrid'});
context.validarReunion_=x=>x;context.leerReuniones_=()=>[];context.reunionAnteriorCronologica_=()=>null;
context.guardarReunion({id,fecha:'2026-11-02',hora:'20:00',titulo:'Cambio de título',lugar:'Sala',puntosDia:[],puntosNoche:[],linkActa:'',linkActaAnterior:'',convocatoria:{}});
assert.equal(meetings.rows[1][14],JSON.stringify(snap));assert.equal(meetings.rows[1][5],'Convocada');
meetings.rows.push(['reu_abcdef01234567890123','2026-11-03','20:00','Otra','Sala','Borrador']);
members.rows[2][6]='';assert.throws(()=>context.confirmarConvocatoriaReunion('reu_abcdef01234567890123'),/Falta el ID/);assert.equal(meetings.rows[2][5],'Borrador');
members.rows[2][6]='m2';members.rows.push(['E','Cinco','Full','','','','m2',false]);assert.throws(()=>context.confirmarConvocatoriaReunion('reu_abcdef01234567890123'),/duplicado/);assert.equal(meetings.rows[2][5],'Borrador');
members.rows.pop(); failMembers=true;assert.throws(()=>context.confirmarConvocatoriaReunion('reu_abcdef01234567890123'),/Miembros/);assert.equal(meetings.rows[2][5],'Borrador');failMembers=false;
let occupied=sheet([[...header,'OTROS'],['reu_abcdef01234567890123','','','','','Borrador']]);meetings=occupied;assert.throws(()=>context.confirmarConvocatoriaReunion('reu_abcdef01234567890123'),/ocupada/);assert.equal(meetings.rows[1][5],'Borrador');
meetings=sheet([header.slice(),['reu_abcdef01234567890123','','','','','Borrador','','','','','','',false,'{}','dato']]);assert.throws(()=>context.confirmarConvocatoriaReunion('reu_abcdef01234567890123'),/sin encabezado/);assert.equal(meetings.rows[1][14],'dato');
console.log('OK: censo, conservación, estados, errores, bloqueo de columnas y repetición.');

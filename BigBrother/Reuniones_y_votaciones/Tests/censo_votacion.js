const fs=require('fs'),vm=require('vm'),assert=require('assert');
const writes=[];let proposed={roster:[{id:'a',preguntas:['q0']}]};
const old={id:'v1',estado:'Confirmada',fila:2,marcado:false,config:{exportCenso:{generado:'original',roster:[{id:'a',preguntas:['q0']}]}}};
const sh={getRange(){return {setValues(v){writes.push(v);return this}}}};
const c={console,SpreadsheetApp:{flush(){}},Utilities:{getUuid:()=> 'uuid'},bb_exigirSecretaria_:()=>{},requerirPruebas_:()=> 'admin',bajoBloqueo_:fn=>fn(),vot_validar_:()=>({fecha:'2026-10-01',asunto:'Prueba',tipo:'simple',subtipo:'cargos'}),vot_leer_:()=>[old],vot_hoja_:()=>sh,vot_snapshot_:()=>proposed,bb_delegacionesDeVoto_:()=>[],bb_publicarTrasCambio_:()=>{},textoParaHoja_:x=>x};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../Gestion/Código.gs','utf8'),c);
// Assign stubs after evaluating the original declarations.
Object.assign(c,{bb_exigirSecretaria_:()=>{},requerirPruebas_:()=> 'admin',bajoBloqueo_:fn=>fn(),vot_validar_:()=>({fecha:'2026-10-01',asunto:'Prueba',tipo:'simple',subtipo:'cargos'}),vot_leer_:()=>[old],vot_hoja_:()=>sh,vot_snapshot_:()=>proposed,bb_delegacionesDeVoto_:()=>[],bb_publicarTrasCambio_:()=>{},textoParaHoja_:x=>x});
c.guardarVotacionSimple({id:'v1'});assert.equal(JSON.parse(writes[0][0][6]).exportCenso.generado,'original');
proposed={roster:[{id:'b',preguntas:['q0']}]};assert.throws(()=>c.guardarVotacionSimple({id:'v1'}),/cambiaría el censo/);assert.equal(writes.length,1);
console.log('OK: el censo original de la votación se conserva y se rechazan cambios de electorado.');

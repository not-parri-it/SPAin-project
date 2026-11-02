const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path'), base=path.join(__dirname,'..'); const script=f=>{const h=fs.readFileSync(path.join(base,f,'Index.html'),'utf8');const m=h.match(/<script[^>]*>([\s\S]*?)<\/script>/);if(!m)throw Error('Falta script en '+f);return m[1];}; const p=script('Participacion'),g=script('Gestion');
const statuses=['Full','Baby','Observer','Alumni','Inactive','Granizado de pleno derecho','Granizado simple','Granizado','Guest'];
const members=statuses.map((estatus,i)=>({id:'id'+i,nombre:'N'+i,apellidos:'Apellido'+i,estatus,fechaUnion:'2020-01-'+String(i+1).padStart(2,'0'),correo:'',telefono:''}));
function dom(){const m={};return {m,getElementById(id){if(!m[id])m[id]={value:'',innerHTML:'',textContent:'',hidden:false,querySelectorAll(){return []}};return m[id]}}}
const d=dom(),ctx={document:d,Set};vm.createContext(ctx);vm.runInContext(p.slice(0,p.indexOf('function paintChanges()')),ctx);ctx.fixture=members;vm.runInContext('state.miembros=fixture; state.cambios=[]',ctx);
d.getElementById('filtro-estatus').value='actives';d.getElementById('orden-miembros').value='estatus';ctx.paintMembers();let html=d.m['listado-miembros'].innerHTML;assert.equal((html.match(/<details class="member-card"/g)||[]).length,3);assert.equal((html.match(/class="status-separator"/g)||[]).length,3);assert(!html.includes('Alumni'));
for(const [filter,n] of [['alumnis',1],['inactives',1],['otros',4],['',9]]){d.m['filtro-estatus'].value=filter;ctx.paintMembers();html=d.m['listado-miembros'].innerHTML;assert.equal((html.match(/<details class="member-card"/g)||[]).length,n,filter)}
for(const [status,klass] of [['Full','st-full'],['Baby','st-baby'],['Observer','st-observer'],['Granizado simple','st-granizado'],['Granizado de pleno derecho','st-granizado'],['Granizado','st-granizado'],['Alumni','st-alumni'],['Guest','st-guest'],['Inactive','st-inactive']])assert.equal(ctx.statusClass(status),klass);
d.m['orden-miembros'].value='recientes';ctx.paintMembers();html=d.m['listado-miembros'].innerHTML;assert(html.indexOf('N8 Apellido8')<html.indexOf('N0 Apellido0'));
const dd=dom(),cc={document:dd,Set};vm.createContext(cc);vm.runInContext(g.slice(0,g.indexOf('function safeLink(')),cc);cc.fixture=members;vm.runInContext('members=fixture',cc);
dd.getElementById('memberFilter').value='actives';cc.paintMembers();let gh=dd.m['membersBody'].innerHTML;assert.equal((gh.match(/data-id=/g)||[]).length,3);assert.equal((gh.match(/class="status-separator"/g)||[]).length,3);
for(const [filter,n] of [['alumnis',1],['inactives',1],['otros',4],['',9]]){dd.m['memberFilter'].value=filter;cc.paintMembers();gh=dd.m['membersBody'].innerHTML;assert.equal((gh.match(/data-id=/g)||[]).length,n,filter)}
for(const status of statuses)assert.equal(cc.statusClass(status),ctx.statusClass(status));
console.log('OK: ambos directorios, categorías, filtros, separadores, colores y orden cronológico.');

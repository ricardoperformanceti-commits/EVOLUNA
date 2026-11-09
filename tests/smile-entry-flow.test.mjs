import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('typed name and phone persist once; repeated confirmation reuses the same person',async()=>{
 const workspace={patients:[]},auth={data:{session:{user:{id:'owner'}}}};let saves=0;const cloud={client:{auth:{getSession:async()=>auth}},flush:async()=>true,save:async()=>{saves++;return true}};const ctx={crypto,Date,window:{EvolunaApp:{get:()=>workspace},EvolunaCloud:cloud,addEventListener(){}},document:{},location:{},JSON,Promise,Error};vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../public/smile-studio-host.js',import.meta.url),'utf8'),ctx);const bridge=ctx.window.EvolunaSmileBridge;const [a,b]=await Promise.all([bridge.createPatient({name:'Pessoa teste',phone:'11999990000'},'owner'),bridge.createPatient({name:'Pessoa teste',phone:'11999990000'},'owner')]);assert.equal(a.id,b.id);assert.equal(workspace.patients.length,1);assert.equal(saves,1);await assert.rejects(bridge.createPatient({name:'Teste',phone:'1'},'owner'),/válidos/);await assert.rejects(bridge.createPatient({name:'Teste',phone:'11999990000'},'other'),/conta/);
});
test('opening Sorriso IA goes straight to the studio contact form',()=>{
 const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(source,/if\(routeEl\)\{navigate\(routeEl\.dataset\.route\);return\}/);
 assert.doesNotMatch(source,/routeEl\.dataset\.route==='sorriso'\)\{quickSmileModal\(\)/);
});

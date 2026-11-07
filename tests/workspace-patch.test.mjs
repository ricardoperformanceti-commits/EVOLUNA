import test from 'node:test';
import assert from 'node:assert/strict';
import {workspacePatch} from '../cloud/patch.js';
function apply(before,patch){const state=structuredClone(before);for(const c of patch){let parent=state;for(const k of c.path.slice(0,-1))parent=parent[k];const key=c.path.at(-1);if(c.op==='insert')parent.splice(+key,0,c.value);else if(c.op==='remove'){if(Array.isArray(parent))parent.splice(+key,1);else delete parent[key]}else Object.defineProperty(parent,key,{value:c.value,writable:true,enumerable:true,configurable:true});}return state;}
test('array splices and nested changes reproduce snapshots without sending unchanged photos',()=>{
 const photo='data:image/png;base64,'+'a'.repeat(4*1024*1024),before={patients:[{id:'p',photo,name:'Antes'}],documents:[{id:'d',image:photo}],settings:{clinic:'A',nullable:null}};
 const after=structuredClone(before);after.patients[0].name='Depois';after.documents.unshift({id:'new',text:'Novo'});delete after.settings.nullable;after.settings.extra={nested:null};
 const patch=workspacePatch(before,after);assert.ok(JSON.stringify(patch).length<700);assert.deepEqual(apply(before,patch),after);assert.deepEqual(workspacePatch(after,after),[]);
 for(const list of [[],[1],[2,1],[1,3,2],[null,{a:[1,2]}],[3,2,1]])for(const other of [[],[null],[2,1],[4,3,2,1],[{a:[3]},false]]){
  const a={list},b={list:other};assert.deepEqual(apply(a,workspacePatch(a,b)),b);
 }
});
test('failed writes leave the compact-write baseline intact for retries',async()=>{
 const {WorkspaceStore}=await import('../cloud/store.js');let offline=true,request;
 const baseline={patients:[{id:'p',name:'Antes',photo:'large-image'}]};
 const client={async rpc(name,args){if(name==='evoluna_load_workspace')return{data:{state:baseline,revision:4}};request=args;if(offline)throw Error('offline');return{data:{revision:5}}}};
 const store=new WorkspaceStore(client,'owner');await store.load();const edited=structuredClone(baseline);edited.patients[0].name='Depois';
 await assert.rejects(store.save(edited),/offline/);const first=structuredClone(request);offline=false;await store.save(edited);assert.deepEqual(request,first);assert.equal(store.revision,5);assert.deepEqual(store.baseline,edited);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function localFixture(dirty){
 const source=fs.readFileSync(new URL('../smile-studio/src/app.js',import.meta.url),'utf8'),start=source.indexOf('async function saveLocal('),end=source.indexOf('\nfunction downloadBlob',start);let uploads=0,syncs=0;
 const blob=new Blob(['png'],{type:'image/png'}),state={base:'immutable-ai-base',shade:'BL2',previewShade:'BL2',afterBlob:blob,mouth:{mask:true},dirty,record:{id:'record',revision:1}};
 const context={busy:false,s:state,unsaved:null,documentPending:false,context:()=>({}),store:{async upload(id,kind,value){assert.equal(value,blob);uploads++;return 'owner/record/local.png'},async update(row,patch){return {...row,...patch,revision:2}}},render(){},live:()=>true,adjust(){throw Error('The cached local result must be reused')},objectURL:()=> 'local-result',replaceGeneration:(rows,row)=>[row],records:[],synchronizeDocument:async()=>{syncs++},toast(){},fail(error){throw error}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);return {context,state,save:()=>vm.runInContext('saveLocal()',context),counts:()=>({uploads,syncs})};
}
 test('saving an unchanged AI result does not upload or regenerate the image',async()=>{const f=localFixture(false);await f.save();assert.deepEqual(f.counts(),{uploads:0,syncs:0});assert.equal(f.context.busy,false)});
 test('saving a local shade reuses its cached PNG and writes only once',async()=>{const f=localFixture(true);await f.save();assert.equal(f.counts().uploads,1);assert.equal(f.state.dirty,false);assert.equal(f.state.base,'immutable-ai-base');await f.save();assert.equal(f.counts().uploads,1)});
 test('document synchronization skips already saved paths but persists changed images',async()=>{
  let saves=0;const workspace={patients:[{id:'p',name:'Paciente'}],documents:[],simulations:[],settings:{doctor:'D',clinic:'C'}};
  const cloud={client:{auth:{getSession:async()=>({data:{session:{user:{id:'owner'}}}})}},flush:async()=>true,save:async()=>{saves++;return true}};
  const context={window:{EvolunaApp:{get:()=>workspace},EvolunaCloud:cloud,addEventListener(){}},document:{},location:{},JSON,Promise,Error};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../public/smile-studio-host.js',import.meta.url),'utf8'),context);
  const row={id:'r',user_id:'owner',patient_id:'p',current_path:'owner/r/base.png',procedure:'lentes',shade:'BL1',created_at:'2026-11-07T12:00:00Z',updated_at:'2026-11-07T12:00:00Z'};
  const bridge=context.window.EvolunaSmileBridge;await bridge.syncDocument(row,'owner');await bridge.syncDocument(row,'owner');assert.equal(saves,1);assert.equal(workspace.documents.length,1);
  await bridge.syncDocument({...row,current_path:'owner/r/local.png',shade:'BL2'},'owner');assert.equal(saves,2);assert.equal(workspace.documents.length,1);assert.equal(workspace.simulations.length,1);
 });

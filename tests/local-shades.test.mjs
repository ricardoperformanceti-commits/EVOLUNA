import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {shades,retone} from '../smile-studio/src/model.js';
test('shade references match approved HEX values and remain distinct on bright enamel',()=>{
 assert.deepEqual(shades.BL1.rgb,[255,248,240]);assert.deepEqual(shades.BL2.rgb,[250,241,231]);assert.deepEqual(shades.A1.rgb,[213,209,175]);
 const outputs=[];for(const shade of ['BL1','BL2','A1']){const pixels=new Uint8ClampedArray([240,240,240,255,130,70,60,255]);retone(pixels,new Uint8Array([255,0]),shade,100);assert.deepEqual([...pixels].slice(4),[130,70,60,255]);outputs.push([...pixels].slice(0,3));}
 assert(outputs[0][0]>outputs[1][0]);assert(outputs[1][0]>outputs[2][0]);assert(outputs[0][1]>outputs[1][1]);assert(outputs[1][1]>outputs[2][1]);
});
function fixture(failure=false){
 const source=fs.readFileSync(new URL('../smile-studio/src/app.js',import.meta.url),'utf8'),start=source.indexOf('async function previewShade('),end=source.indexOf('\nasync function synchronizeDocument',start),blob=new Blob(['local-png']);let saved=0;
 const state={base:'saved-ai-base',shade:'BL1',after:'previous',afterBlob:null,mouth:{cached:true},dirty:false};
 const context={busy:false,loading:false,shades,s:state,context:()=>({}),live:()=>true,render(){},async adjust(base,shade,intensity,mouth){assert.equal(base,'saved-ai-base');assert.equal(shade,'A1');assert.equal(intensity,100);if(failure)throw Error('Detection failed');return {blob,mouth}},objectURL:()=> 'adjusted-preview',async saveLocal(){assert.equal(state.afterBlob,blob);assert.equal(state.previewShade,'A1');saved++;state.dirty=false},fail(){}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);return {state,context,saved:()=>saved,click:()=>vm.runInContext("previewShade('A1')",context)};
}
test('shade selection changes only the local preview without saving or calling the API',async()=>{const f=fixture();await f.click();assert.equal(f.saved(),0);assert.equal(f.state.after,'adjusted-preview');assert.equal(f.state.base,'saved-ai-base');assert.equal(f.state.dirty,true);assert.equal(f.context.busy,false)});
test('failed adjustment keeps the original preview and does not save an old or partial result',async()=>{const f=fixture(true);await f.click();assert.equal(f.saved(),0);assert.equal(f.state.after,'previous');assert.equal(f.state.shade,'BL1');assert.equal(f.context.busy,false)});

test('selecting the already previewed shade does not recalculate or save again',async()=>{const f=fixture();await f.click();f.context.adjust=()=>{throw Error('Must reuse preview')};await f.click();assert.equal(f.saved(),0);assert.equal(f.state.previewShade,'A1')});

test('the shade selected before AI generation still performs its first local adjustment',async()=>{
 const f=fixture();f.state.shade='A1';f.state.previewShade='A1';f.state.afterBlob=new Blob(['unadjusted-ai-result']);await f.click();assert.equal(f.state.after,'adjusted-preview');assert.equal(await f.state.afterBlob.text(),'local-png');assert.equal(f.state.dirty,true);assert.equal(f.saved(),0);
});
test('all veneer shades switch on the same AI base and revisiting one reuses its PNG without saving',async()=>{
 const f=fixture(),calls=[];f.context.adjust=async(base,shade,intensity,mouth)=>{assert.equal(base,'saved-ai-base');assert.equal(intensity,100);calls.push(shade);return {blob:new Blob([shade]),mouth}};
 for(const shade of ['BL1','BL2','A1','BL1','BL2','A1']){await vm.runInContext(`previewShade('${shade}')`,f.context);assert.equal(await f.state.afterBlob.text(),shade);assert.equal(f.state.shade,shade);assert.equal(f.state.previewShade,shade)}
 assert.deepEqual(calls,['BL1','BL2','A1']);assert.equal(f.saved(),0);assert.equal(f.state.base,'saved-ai-base');
});
test('previews from a different AI result are never reused',async()=>{
 const f=fixture();f.state.shadePreviewBase='different-ai-base';f.state.previewShade='A1';f.state.afterBlob=new Blob(['old-result']);f.state.shadePreviews={A1:{blob:f.state.afterBlob,mouth:null}};await f.click();assert.equal(await f.state.afterBlob.text(),'local-png');assert.equal(f.state.shadePreviewBase,'saved-ai-base');
});

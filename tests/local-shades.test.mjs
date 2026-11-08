import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {shades,retone} from '../smile-studio/src/model.js';
test('shade references match approved HEX values and remain distinct on bright enamel',()=>{
 assert.deepEqual(shades.BL1.rgb,[251,242,233]);assert.deepEqual(shades.BL2.rgb,[250,241,231]);assert.deepEqual(shades.A1.rgb,[211,190,170]);
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

test('natural A1 retains photographic brightness differences, neutral highlights and deep shadows',()=>{
 const values=[45,80,125,160,190,215,235,252,255],pixels=new Uint8ClampedArray(values.flatMap(y=>[y,y,y,255])),mask=new Uint8Array(values.length).fill(255),original=pixels.slice();retone(pixels,mask,'A1',100);
 for(const p of [0,1,7,8])assert.deepEqual(pixels.slice(p*4,p*4+4),original.slice(p*4,p*4+4));
 for(let p=2;p<=6;p++){assert.ok(pixels[p*4]>pixels[p*4+1]);assert.ok(pixels[p*4+1]>pixels[p*4+2]);assert.equal(pixels[p*4+3],255);if(p>2)assert.ok(pixels[p*4]>pixels[(p-1)*4])}
 assert.ok(pixels[6*4]-pixels[3*4]>55,'enamel shading and contrast remain visible');
 const off=original.slice();retone(off,mask,'A1',0);assert.deepEqual(off,original);
});
test('natural A1 leaves tissue and the immutable source untouched while adapting warm and cool enamel',()=>{
 const source=Uint8ClampedArray.from([215,205,190,255,230,235,240,255,170,80,70,255]),mask=Uint8Array.from([255,255,0]);
 const first=source.slice(),second=source.slice();retone(first,mask,'A1',100);retone(second,mask,'A1',100);assert.deepEqual(first,second);assert.deepEqual(first.slice(8),source.slice(8));assert.deepEqual([...source].slice(0,3),[215,205,190]);
 for(const p of [0,1])assert.ok(first[p*4]>first[p*4+2],'natural warm ivory chroma');
});

test('A1 changes very bright veneer enamel instead of classifying the whole tooth as a reflection',()=>{
 for(const value of [245,250,252,255]){
  const pixels=new Uint8ClampedArray([value,value,value,255]),before=pixels.slice();
  assert.ok(retone(pixels,new Uint8Array([255]),'A1',100)>0);
  assert.notDeepEqual(pixels,before);assert.ok(pixels[0]>pixels[1]&&pixels[1]>pixels[2]);
  assert.ok(pixels[1]<=value-12,'visible natural body tone on bright veneers');assert.equal(pixels[3],255);
 }
});
test('A1 changes the broad bright tooth body while preserving isolated specular highlights',()=>{
 const values=[...Array(60).fill(240),...Array(30).fill(220),...Array(8).fill(190),252,255],pixels=new Uint8ClampedArray(values.flatMap(y=>[y,y,y,255])),before=pixels.slice();retone(pixels,new Uint8Array(values.length).fill(255),'A1',100);
 assert.ok(pixels[1]<before[1]-12);assert.ok(pixels[61*4]>pixels[91*4],'body texture keeps its contrast');assert.deepEqual(pixels.slice(-8),before.slice(-8));
});

test('a shade click reveals the result when the comparison had been showing only the original',async()=>{const f=fixture();f.state.compare=100;await f.click();assert.equal(f.state.compare,50);assert.equal(f.saved(),0)});

test('BL1 moves 10 percent from BL2 toward white while keeping masked tissue and alpha unchanged',()=>{
 const source=Uint8ClampedArray.from([180,175,165,255,225,220,210,255,245,242,238,255,130,70,60,255]),mask=Uint8Array.from([255,255,255,0]),bl1=source.slice(),bl2=source.slice();
 retone(bl1,mask,'BL1',100);retone(bl2,mask,'BL2',100);
 for(let p=0;p<3;p++){for(let c=0;c<3;c++){const i=p*4+c;assert.equal(bl1[i],Math.round(bl2[i]+(255-bl2[i])*.1))}assert.equal(bl1[p*4+3],255)}
 assert.deepEqual(bl1.slice(12),source.slice(12));assert.ok(bl1[8]>bl1[0],'contrast retained');
 const off=source.slice();retone(off,mask,'BL1',0);assert.deepEqual(off,source);
});

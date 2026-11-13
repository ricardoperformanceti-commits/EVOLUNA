import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/smile-studio-host.js',import.meta.url),'utf8');
const fitSource=source.slice(source.indexOf('function fit()'),source.indexOf('\nfunction schedule()'));
function layout({width=390,height=844,nav=81,banner=0,sidebar=0,topbar=68}={}){
 const frame={style:{}},context={scheduled:true,innerWidth:width,innerHeight:height,window:{},document:{
  getElementById:id=>id==='smile-studio-frame'?frame:id==='cloud-error'?{hidden:!banner,getBoundingClientRect:()=>({height:banner})}:{getBoundingClientRect:()=>({width:sidebar})},
  querySelector:selector=>({getBoundingClientRect:()=>({height:selector==='.mobile-bottom-nav'?nav:topbar})})
 }};
 vm.createContext(context);vm.runInContext(fitSource,context);vm.runInContext('fit()',context);return frame.style;
}
test('mobile studio leaves the menu and raised Sorriso button outside the iframe',()=>{
 const style=layout();assert.equal(style.height,'678px');assert.equal(style.top,'68px');assert.equal(style.width,'390px');
});
test('installed wide PWA reserves the visible menu while browser desktop retains its sidebar',()=>{
 const pwa=layout({width:1366,height:900});assert.equal(pwa.height,'734px');assert.equal(pwa.width,'1366px');
 const desktop=layout({width:1366,height:900,sidebar:248,topbar:79,nav:0});assert.equal(desktop.height,'821px');assert.equal(desktop.left,'248px');assert.equal(desktop.width,'1118px');
});
test('safe area, save-error banner and keyboard viewport resize retain space for navigation',()=>{
 const style=layout({height:500,nav:115,banner:80});assert.equal(style.height,'212px');
});

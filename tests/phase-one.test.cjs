const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function fixture(){
 const events={},windowEvents={},nodes=new Map();let time=new Date(2026,10,1,23,59,0).getTime(),prints=0;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[time]))}static now(){return time}}
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{value:'',dataset:{},hidden:true,innerHTML:'',classList:{values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)},contains(v){return this.values.has(v)},toggle(){}},setAttribute(){},removeAttribute(){},focus(){},querySelectorAll(){return[]}});return nodes.get(selector)}
 const ctx={Date:Clock,URLSearchParams,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},innerWidth:390,location:{hash:'#inicio'},document:{hidden:false,querySelector(s){if(s==='.modal'||s==='input:focus,textarea:focus,select:focus')return null;return node(s)},querySelectorAll:()=>[],getElementById:node,addEventListener(type,fn){(events[type]??=[]).push(fn)}},window:{addEventListener(type,fn){(windowEvents[type]??=[]).push(fn)},scrollTo(){},print(){prints++},EvolunaCloud:{ready:false,boot(){},save:async()=>true,stageDraft:()=>true,retainPatientSelections:(_,x)=>x},DocumentActions:{markup:()=>'<p>preview</p>',action:()=>''}}};
 ctx.DocumentActions=ctx.window.DocumentActions;vm.createContext(ctx);for(const file of ['app.js','session-notes.js','header-search.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),ctx,{filename:file});
 const run=code=>vm.runInContext(code,ctx);
 async function dispatch(type,target){target.dataset??={};target.classList??={contains:()=>false};target.closest??=selector=>selector==='[data-action]'&&target.dataset.action?target:null;for(const fn of events[type]||[])await fn({target})}
 run("db=seed();documentPatient=db.patients[0].id;documentType='Atestado Odontológico';certificate={date:dateKey(),days:'1',cro:'CRO-SP 12345',from:'',to:'',editing:false,needsReview:false}");
 return{ctx,events,windowEvents,node,run,dispatch,advance(ms){time+=ms},prints:()=>prints};
}

test('changed certificate fields require review before saving or printing edited text',async()=>{
 const f=fixture(),textarea=f.node('#document-text');textarea.value=f.run('documentText(documentType,patient(documentPatient))')+'\nTexto editado.';textarea.dataset.userEdited='true';
 await f.dispatch('input',{id:'certificate-days',value:'5'});
 assert.equal(f.run('certificate.needsReview'),true);assert.equal(f.node('#document-review').hidden,false);
 assert.equal(await f.run("window.SessionNotes.saveStandalone(documentType,documentPatient,document.querySelector('#document-text').value,{...certificate})"),null);
 await f.dispatch('click',{dataset:{action:'print-document'}});assert.equal(f.prints(),0);
 await f.dispatch('click',{dataset:{action:'document-use-template'}});assert.match(textarea.value,/5 dia\(s\)/);assert.equal(f.run('certificate.needsReview'),false);
 const saved=await f.run("window.SessionNotes.saveStandalone(documentType,documentPatient,document.querySelector('#document-text').value,{...certificate})");assert.equal(saved.fields.days,'5');assert.match(saved.text,/5 dia\(s\)/);assert.equal('editing' in saved.fields,false);
 textarea.dataset.userEdited='true';await f.dispatch('input',{id:'certificate-days',value:'6'});assert.equal(f.run('certificate.needsReview'),true);
 textarea.value=textarea.value.replace('5 dia(s)','6 dia(s)');await f.dispatch('click',{dataset:{action:'document-review-text'}});assert.equal(f.run('certificate.needsReview'),false);
 await f.dispatch('input',{id:'certificate-cro',value:'CRO-SP 67890'});assert.equal(f.run('certificate.needsReview'),true);
});

test('menu closes on hash navigation, including selection of the current page',async()=>{
 const f=fixture(),sidebar=f.node('#sidebar');sidebar.classList.add('open');f.ctx.location.hash='#agenda';for(const fn of f.windowEvents.hashchange)fn();assert.equal(sidebar.classList.contains('open'),false);
 sidebar.classList.add('open');const link={dataset:{},classList:{contains:()=>false},closest(selector){return selector==='#navigation a[href^="#"]'||selector==='#sidebar'?this:null}};await f.dispatch('click',link);assert.equal(sidebar.classList.contains('open'),false);
});

test('midnight refresh advances current-day agenda and new records while preserving chosen dates and draft text',async()=>{
 const f=fixture(),old=f.run('dateKey()');f.run('selectedDate=dateKey()');f.node('#document-text').value='Rascunho que deve permanecer';
 f.advance(120000);assert.notEqual(f.run('dateKey()'),old);f.run('refreshCurrentDay()');assert.equal(f.run('selectedDate'),f.run('dateKey()'));assert.equal(f.node('#document-text').value,'Rascunho que deve permanecer');
 await f.run("activity('Registro depois da meia-noite')");assert.equal(f.run('db.activity[0].date'),f.run('dateKey()'));
 f.run("selectedDate='2026-10-15'");f.advance(86400000);f.run('refreshCurrentDay()');assert.equal(f.run('selectedDate'),'2026-10-15');
 f.run('certificate.editing=false;renderDocuments()');assert.equal(f.run('certificate.date'),f.run('dateKey()'));
 f.run("certificate.editing=true;certificate.date='2026-10-20'");f.advance(86400000);f.run('renderDocuments()');assert.equal(f.run('certificate.date'),'2026-10-20');
});

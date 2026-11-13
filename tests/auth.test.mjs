import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../cloud/client.js',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}
function fixture(){
 const nodes=new Map(),events={},timers=[],loaded=[],created=[],displayed=[];let account={id:'A'},authListener,getUser=async()=>({data:{user:account},error:null}),load=async owner=>({owner,patients:[]});const classes=new Set();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,innerHTML:'',textContent:'',dataset:{},classList:{add(){},remove(){}}});return nodes.get(id)};
 const client={auth:{getUser:()=>getUser(),onAuthStateChange:fn=>authListener=fn,signOut:async()=>({error:null})}};
 class WorkspaceStore{constructor(_client,owner){this.owner=owner;this.revision=1}async load(){loaded.push(this.owner);return load(this.owner)}async create(state){created.push(this.owner);return state}}
 const ctx={URLSearchParams,JSON,console,AbortSignal,fetch:async()=>{throw Error('Unexpected fetch')},location:{hash:'',origin:'https://app.example',pathname:'/'},document:{getElementById:node,querySelector:()=>null,addEventListener:(type,fn)=>(events[type]??=[]).push(fn),body:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}}},window:{EVOLUNA_SUPABASE:{url:'https://example.supabase.co',key:'public-key'},EvolunaApp:{empty:()=>({patients:[]}),set:state=>displayed.push(state),get:()=>displayed.at(-1),render(){},stop(){}},addEventListener(){}},createClient:()=>client,WorkspaceStore,retainPatientSelections:(_,s)=>s,localStorage:{getItem:()=>null,removeItem(){}},clearTimeout(){},setTimeout:fn=>{timers.push(fn);return timers.length}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {client,ctx,cloud:ctx.window.EvolunaCloud,loaded,created,displayed,node,classes,events,timers,setAccount:value=>account=value,setLoad:fn=>load=fn,setGetUser:fn=>getUser=fn,event:(type,session)=>authListener(type,session)};
}
test('current hosted auth gate blocks missing sessions and remote validation failures before loading patient data',async()=>{
 for(const result of [{data:{user:null},error:null},{data:{user:null},error:Error('invalid')}]){const f=fixture();f.setGetUser(async()=>result);await f.cloud.boot();assert.equal(f.loaded.length,0);assert.equal(f.cloud.ready,false);assert.ok(f.classes.has('auth-required'));assert.match(f.node('auth-root').innerHTML,/Entre na sua clínica/)}
});
test('confirmed session loads only the authenticated owner and displays the workspace after loading succeeds',async()=>{const f=fixture();await f.cloud.boot();assert.deepEqual(f.loaded,['A']);assert.equal(f.cloud.ready,true);assert.equal(f.displayed.at(-1).owner,'A');assert.ok(!f.classes.has('auth-required'))});
test('logout during workspace loading cannot reveal a late result or create another workspace',async()=>{
 const f=fixture(),wait=deferred();f.setLoad(()=>wait.promise);const opening=f.cloud.boot();await Promise.resolve();await Promise.resolve();f.event('SIGNED_OUT',null);wait.resolve(null);await opening;assert.equal(f.cloud.ready,false);assert.equal(f.created.length,0);assert.ok(!f.displayed.some(s=>s.owner==='A'));assert.ok(f.classes.has('auth-required'));
});
test('switching account while the previous workspace loads never renders the previous patient data',async()=>{
 const f=fixture(),wait=deferred();f.setLoad(owner=>owner==='A'?wait.promise:Promise.resolve({owner,patients:[]}));const first=f.cloud.boot();await Promise.resolve();await Promise.resolve();f.setAccount({id:'B'});f.event('SIGNED_IN',{user:{id:'B'}});await f.timers.shift()();wait.resolve({owner:'A',patients:[]});await first;assert.equal(f.cloud.ready,true);assert.equal(f.displayed.at(-1).owner,'B');assert.ok(!f.displayed.some(s=>s.owner==='A'));
});
test('password recovery while loading remains on password form even after an old workspace response arrives',async()=>{
 const f=fixture(),wait=deferred();f.setLoad(()=>wait.promise);const opening=f.cloud.boot();await Promise.resolve();await Promise.resolve();f.event('PASSWORD_RECOVERY',{user:{id:'A'}});wait.resolve({owner:'A',patients:[]});await opening;assert.equal(f.cloud.ready,false);assert.match(f.node('auth-root').innerHTML,/Escolha sua nova senha/);assert.ok(!f.displayed.some(s=>s.owner==='A'));
});
test('an old failed identity lookup cannot replace a newer successful login with an error gate',async()=>{
 const f=fixture(),wait=deferred();f.setGetUser(()=>wait.promise);const first=f.cloud.boot();f.setAccount({id:'B'});f.setGetUser(async()=>({data:{user:{id:'B'}},error:null}));await f.cloud.boot();wait.resolve({data:{user:null},error:Error('expired')});await first;assert.equal(f.cloud.ready,true);assert.equal(f.displayed.at(-1).owner,'B');assert.ok(!f.classes.has('auth-required'));
});
test('auth messages escape markup and never include executable HTML',()=>{const f=fixture();vm.runInContext(`gate('login','<script>alert(1)</script>')`,f.ctx);const html=f.node('auth-root').innerHTML;assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'))});

test('session expiry during identity lookup cannot reopen a previous account',async()=>{const f=fixture(),wait=deferred();f.setGetUser(()=>wait.promise);const opening=f.cloud.boot();f.event('TOKEN_REFRESHED',null);wait.resolve({data:{user:{id:'A'}},error:null});await opening;assert.equal(f.cloud.ready,false);assert.equal(f.loaded.length,0);assert.ok(f.classes.has('auth-required'))});

test('username sign-in persists only the Supabase-verified session and ordinary emails keep their existing login path',async()=>{
 const f=fixture(),calls=[];f.ctx.window.EVOLUNA_MAGIC_HOUR={endpoint:'https://worker.example'};f.ctx.fetch=async(url,init)=>{calls.push(JSON.parse(init.body));assert.equal(url,'https://worker.example/v1/auth/login');return Response.json({access_token:'valid-access',refresh_token:'valid-refresh'})};f.client.auth.setSession=async tokens=>{assert.equal(tokens.access_token,'valid-access');return {data:{user:{id:'A'},session:tokens},error:null}};
 const signed=await f.ctx.signIn({email:'admin',password:'test-password'});assert.equal(signed.data.user.id,'A');assert.deepEqual(calls,[{username:'admin',password:'test-password'}]);
 f.client.auth.signInWithPassword=async value=>({data:{user:{id:'email-owner'},email:value.email},error:null});assert.equal((await f.ctx.signIn({email:'person@example.com',password:'test-password'})).data.user.id,'email-owner');assert.equal(calls.length,1);
 vm.runInContext("gate('login')",f.ctx);assert.match(f.node('auth-root').innerHTML,/E-mail ou usuário/);assert.match(f.node('auth-root').innerHTML,/Continuar com Google/);vm.runInContext("gate('signup')",f.ctx);const signup=f.node('auth-root').innerHTML;assert.match(signup,/name="email" type="email"/);assert.match(signup,/Continuar com Google/);assert.doesNotMatch(signup,/full_name|address|phone|cro|tax_id|confirmation/);
});

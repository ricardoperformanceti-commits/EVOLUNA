import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../dist/server/index.js';
const env = {SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test'};
const req = (path, options) => new Request('https://app.example'+path,options);
const mock = (auth) => () => ({auth});
test('páginas públicas abrem sem sessão',async()=>{
  const handle=createHandler(()=>{throw Error('cliente não necessário')});
  for(const path of ['/','/cadastro']) assert.equal((await handle(req(path),env)).status,200);
});
test('painel e subrotas bloqueiam sessão ausente ou inválida',async()=>{
  const handle=createHandler(mock({getUser:async()=>({data:{user:null},error:Error('invalid')})}));
  for(const path of ['/painel','/painel/dados']) {
    const r=await handle(req(path,{headers:{cookie:'sb-auth-token=falso'}}),env);
    assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/');
  }
});
test('painel valida usuário no servidor e escapa HTML',async()=>{
  const handle=createHandler(mock({getUser:async()=>({data:{user:{email:'<script>alert(1)</script>'}},error:null})}));
  const r=await handle(req('/painel'),env);const html=await r.text();
  assert.equal(r.status,200);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});
test('POST de outra origem é bloqueado antes de autenticar',async()=>{
  const handle=createHandler(()=>{throw Error('não deve chamar')});
  const r=await handle(req('/auth/logout',{method:'POST',headers:{origin:'https://attacker.example'}}),env);
  assert.equal(r.status,403);
});
test('login bem-sucedido preserva cookie e redireciona',async()=>{
  const handle=createHandler((url,key,options)=>({auth:{signInWithPassword:async()=>{
    options.cookies.setAll([{name:'sb-test',value:'session',options:{path:'/',secure:true,httpOnly:true,sameSite:'lax'}}]);return {error:null};
  }}}));
  const r=await handle(req('/auth/login',{method:'POST',headers:{origin:'https://app.example'},body:new URLSearchParams({email:'test@example.com',password:'long-password'})}),env);
  assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/painel');assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));
});
test('cadastro exige confirmação e usa callback no domínio hospedado',async()=>{
  const handle=createHandler(mock({signUp:async({options})=>{
    assert.equal(options.emailRedirectTo,'https://app.example/auth/callback');return {data:{session:null},error:null};
  }}));
  const r=await handle(req('/auth/signup',{method:'POST',headers:{origin:'https://app.example'},body:new URLSearchParams({email:'test@example.com',password:'long-password'})}),env);
  assert.equal(r.status,200);assert.ok((await r.text()).includes('Confira seu e-mail'));
});
test('callbacks incompletos não autenticam e eliminam token do destino',async()=>{
  const handle=createHandler(()=>{throw Error('não deve chamar')});
  for(const path of ['/auth/callback','/auth/confirm?token_hash=secret&type=admin']){
    const r=await handle(req(path),env);assert.equal(r.headers.get('location'),'/auth/erro');
  }
});
test('logout não usa GET e mantém erro remoto visível',async()=>{
  const handle=createHandler(mock({signOut:async()=>({error:Error('network')})}));
  assert.equal((await handle(req('/auth/logout'),env)).status,404);
  assert.equal((await handle(req('/auth/logout',{method:'POST',headers:{origin:'https://app.example'}}),env)).status,502);
});

test('login redireciona ao início e início não oferece formulário de acesso',async()=>{
 const handle=createHandler(()=>{throw Error('não deve autenticar')});
 const r=await handle(req('/login'),env);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'/');
 const home=await handle(req('/'),env);const html=await home.text();assert.equal(home.status,200);assert.ok(!html.includes('href="/login"'));assert.ok(!html.includes('type="password"'));
});

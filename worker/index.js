import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import css from './styles.css';

const escape = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shell(content) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sorriso com IA</title><meta name="description" content="Acesso seguro à plataforma odontológica"><style>${css}</style></head><body><header><a href="/">◡ Sorriso com IA</a><span>Seu próximo sorriso começa aqui</span></header><main>${content}</main></body></html>`;
}
function authForm(signupMode = false, message = '', error = false) {
  return shell(`<section class="card"><p class="eyebrow">SORRISO COM IA</p><h1>${signupMode ? 'Comece por aqui.' : 'Que bom ter você aqui.'}</h1><p>${signupMode ? 'Crie sua conta para acessar a plataforma.' : 'Entre para acessar seu espaço.'}</p><form method="post" action="/auth/${signupMode ? 'signup' : 'login'}"><label for="email">E-mail</label><input name="email" id="email" type="email" autocomplete="email" maxlength="254" required placeholder="voce@clinica.com.br"><label for="password">Senha</label><input name="password" id="password" type="password" autocomplete="${signupMode ? 'new-password' : 'current-password'}" minlength="${signupMode ? 12 : 1}" maxlength="128" required>${signupMode ? '<small>Use pelo menos 12 caracteres.</small>' : ''}${message ? `<p ${error ? 'class="error" role="alert"' : 'role="status"'}>${escape(message)}</p>` : ''}<button>${signupMode ? 'Criar minha conta' : 'Entrar →'}</button></form><p>${signupMode ? 'Já tem conta? <a href="/login">Entrar</a>' : 'Ainda não tem conta? <a href="/cadastro">Cadastre-se</a>'}</p></section>`);
}
const home = () => shell('<section class="hero"><p class="eyebrow">CUIDADO QUE CONECTA</p><h1>Mais tempo para<br>cuidar de sorrisos.</h1><p>Bem-vindo ao espaço da sua clínica.</p><div class="note">Sorriso com IA · Plataforma odontológica</div></section>');

export function createHandler(clientFactory = createServerClient) {
  return async function handle(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const headers = new Headers({ 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; form-action 'self'; base-uri 'self'; object-src 'none'" });
    const respond = (body, status = 200) => { headers.set('Content-Type','text/html; charset=utf-8'); return new Response(body, {status,headers}); };
    const redirect = (target) => { headers.set('Location',target); return new Response(null, {status:303,headers}); };
    let supabase;
    function client() {
      if (!supabase) {
        if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) throw new Error('Auth configuration missing');
        supabase = clientFactory(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY, { cookieOptions:{secure:url.protocol === 'https:',httpOnly:true,sameSite:'lax',path:'/'}, cookies:{
          getAll:() => parseCookieHeader(request.headers.get('Cookie') ?? '').map(({name,value}) => ({name,value:value ?? ''})),
          setAll(values, extraHeaders = {}) {
            for (const {name,value,options} of values) headers.append('Set-Cookie',serializeCookieHeader(name,value,options));
            for (const [name,value] of Object.entries(extraHeaders)) headers.set(name,value);
          }
        }});
      }
      return supabase;
    }
    try {
      if (request.method === 'POST') {
        // All state-changing operations require a same-origin browser form.
        if (request.headers.get('Origin') !== url.origin) return respond(shell('<section class="card"><h1>Solicitação não autorizada.</h1><a href="/login">Voltar</a></section>'),403);
        if (!['/auth/login','/auth/signup','/auth/logout'].includes(path)) return respond('Não encontrado',404);
        if (path === '/auth/logout') {
          const {error} = await client().auth.signOut();
          return error ? respond(authForm(false,'Não foi possível sair. Tente novamente.',true),502) : redirect('/login');
        }
        if (Number(request.headers.get('Content-Length') ?? 0) > 8192) return respond('Solicitação muito grande',413);
        const rawBody = await request.text();
        if (rawBody.length > 8192) return respond('Solicitação muito grande',413);
        const form = new URLSearchParams(rawBody);
        const email = (form.get('email') ?? '').trim();
        const password = form.get('password') ?? '';
        const signingUp = path === '/auth/signup';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < (signingUp ? 12 : 1) || password.length > 128) return respond(authForm(signingUp,'Informe um e-mail válido e uma senha válida.' + (signingUp ? ' Use pelo menos 12 caracteres.' : ''),true),400);
        if (signingUp) {
          const {data,error} = await client().auth.signUp({email,password,options:{emailRedirectTo:url.origin+'/auth/callback'}});
          if (error) return respond(authForm(true,'Não foi possível concluir o cadastro. Tente novamente mais tarde.',true),400);
          return data.session ? redirect('/painel') : respond(authForm(true,'Confira seu e-mail para confirmar o cadastro. Depois, entre com sua senha.'));
        }
        const {error} = await client().auth.signInWithPassword({email,password});
        return error ? respond(authForm(false,'Não foi possível entrar. Confira seus dados e a confirmação do e-mail.',true),401) : redirect('/painel');
      }
      if (request.method !== 'GET' && request.method !== 'HEAD') return respond('Método não permitido',405);
      if (path === '/' && url.searchParams.has('code')) return redirect('/auth/callback?code='+encodeURIComponent(url.searchParams.get('code')));
      if (path === '/') return respond(home());
      if (path === '/login') return redirect('/');
      if (path === '/cadastro') return respond(authForm(true));
      if (path === '/painel' || path.startsWith('/painel/')) {
        const {data,error} = await client().auth.getUser();
        if (error || !data.user) return redirect('/');
        if (path !== '/painel') return respond(shell('<section class="card"><h1>Página não encontrada.</h1><a href="/painel">Voltar ao painel</a></section>'),404);
        return respond(shell(`<section class="card wide"><p class="eyebrow">ÁREA PROTEGIDA</p><h1>Seu espaço está pronto.</h1><p>Você está conectado como <strong>${escape(data.user.email)}</strong>.</p><div class="note">Esta é a base de acesso da plataforma. Os módulos de gestão da clínica serão adicionados nas próximas etapas.</div><form method="post" action="/auth/logout"><button class="secondary">Sair da conta</button></form></section>`));
      }
      if (path === '/auth/callback') {
        const code = url.searchParams.get('code');
        if (!code) return redirect('/auth/erro');
        const {error} = await client().auth.exchangeCodeForSession(code);
        return redirect(error ? '/auth/erro' : '/painel');
      }
      if (path === '/auth/confirm') {
        const token_hash = url.searchParams.get('token_hash');
        if (!token_hash || url.searchParams.get('type') !== 'email') return redirect('/auth/erro');
        const {error} = await client().auth.verifyOtp({token_hash,type:'email'});
        return redirect(error ? '/auth/erro' : '/painel');
      }
      if (path === '/auth/erro') return respond(shell('<section class="card"><h1>Link inválido ou expirado.</h1><p>Entre se seu e-mail já foi confirmado. Se o link foi aberto em outro navegador, volte ao navegador do cadastro.</p><a href="/login">Voltar para entrar</a></section>'));
      return respond(shell('<section class="card"><h1>Página não encontrada.</h1><a href="/">Voltar ao início</a></section>'),404);
    } catch {
      return respond(shell('<section class="card"><h1>Não foi possível continuar.</h1><p>Tente novamente em alguns instantes.</p><a href="/login">Voltar para entrar</a></section>'),503);
    }
  };
}
export default {fetch:createHandler()};

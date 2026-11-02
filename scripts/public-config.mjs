// Only public browser configuration may be embedded in the static build.
export function publicConfigFromEnvironment(env){
 const url=(env.SUPABASE_URL||'').trim(),key=(env.SUPABASE_PUBLISHABLE_KEY||'').trim();
 if(!url&&!key)return null;
 if(!url||!key)throw Error('Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY juntas.');
 let parsed;try{parsed=new URL(url)}catch{throw Error('SUPABASE_URL inválida.')}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error('Use somente a URL HTTPS do projeto Supabase.');
 if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key))throw Error('Use uma chave publicável sb_publishable_. Chaves secretas não podem entrar no site.');
 return {url:parsed.origin,key};
}

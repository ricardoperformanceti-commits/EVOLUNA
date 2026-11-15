import {createHandler} from '../../../magic-hour/worker.mjs';

const keys=Deno.env.get('MAGIC_HOUR_KEYS_JSON')||'';
function publishableKey(){
 const legacy=Deno.env.get('SUPABASE_ANON_KEY');
 if(legacy)return legacy;
 try{return Object.values(JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}'))[0] as string||''}catch{return ''}
}
const origins=[
 'https://sorriso-com-ia-clinica.ricardo-performancet.chatgpt.site',
 'https://evoluna-odonto.pages.dev',
 Deno.env.get('EVOLUNA_SITE_ORIGIN')||''
].filter(Boolean).join(',');

const env={
 MAGIC_HOUR_KEYS_JSON:keys,
 // The key list never leaves the function. Its value also supplies stable ticket signing.
 JOB_SIGNING_KEY:Deno.env.get('MAGIC_HOUR_JOB_SIGNING_KEY')||keys,
 ALLOWED_ORIGINS:origins,
 ALLOW_ALL_AUTHENTICATED:'true',
 SUPABASE_URL:Deno.env.get('SUPABASE_URL')||'',
 SUPABASE_PUBLISHABLE_KEY:publishableKey()
};

const handler=createHandler(fetch);
Deno.serve(request=>{
 const current=new URL(request.url),marker=current.pathname.indexOf('/v1/');
 if(marker>=0)current.pathname=current.pathname.slice(marker);
 return handler(new Request(current,request),env);
});

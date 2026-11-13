const VERSION='evoluna-pwa-v8';
const OFFLINE='/offline.html';
const STATIC_DESTINATIONS=new Set(['style','script','image','font']);

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll([OFFLINE,'/icons/evoluna-192.png','/icons/evoluna-512.png'])));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('evoluna-pwa-')&&key!==VERSION).map(key=>caches.delete(key)))));
  self.clients.claim();
});

function mayCache(request,url){
  if(request.method!=='GET'||url.origin!==self.location.origin)return false;
  if(url.pathname.includes('cloud-config')||url.pathname.includes('rtc-config')||url.pathname.includes('magic-hour-config'))return false;
  return STATIC_DESTINATIONS.has(request.destination);
}

self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>response).catch(()=>caches.match(OFFLINE)));
    return;
  }
  if(!mayCache(request,url))return;
  event.respondWith(caches.match(request).then(cached=>{
    const network=fetch(request).then(response=>{
      if(response.ok&&response.type==='basic')caches.open(VERSION).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(()=>cached);
    return cached||network;
  }));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

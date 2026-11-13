(()=>{
  if(!('serviceWorker' in navigator))return;
  let installPrompt=null;
  const button=document.createElement('button');
  button.type='button';button.className='pwa-install';button.hidden=true;button.innerHTML='<span>↓</span> Instalar Evoluna';
  button.addEventListener('click',async()=>{
    if(!installPrompt)return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt=null;button.hidden=true;
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;button.hidden=false});
  window.addEventListener('appinstalled',()=>{installPrompt=null;button.hidden=true});
  window.addEventListener('DOMContentLoaded',()=>document.body.append(button));
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}));
})();

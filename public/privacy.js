// Footer and navigation links also reveal a collapsed legal section.
(()=>{
 function reveal(){
  const id=location.hash.slice(1);
  if(!['politica-de-privacidade','lgpd','seguranca'].includes(id))return;
  const section=document.getElementById(id);
  if(section){section.open=true;section.scrollIntoView({block:'start'})}
 }
 window.addEventListener('hashchange',reveal);
 reveal();
})();

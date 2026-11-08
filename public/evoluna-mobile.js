/* Mobile presentation only: no patient, generation or persistence changes. */
(()=>{
 const sidebar=document.getElementById('sidebar'),toggle=document.querySelector('[data-action="menu"]');
 if(!sidebar||!toggle)return;
 const mobile=matchMedia('(max-width:800px)');
 const backdrop=document.createElement('button');
 backdrop.className='mobile-menu-backdrop';backdrop.setAttribute('aria-label','Fechar menu');backdrop.hidden=true;backdrop.tabIndex=-1;
 const close=document.createElement('button');close.className='mobile-drawer-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Fechar menu');sidebar.prepend(close);sidebar.before(backdrop);
 toggle.setAttribute('aria-controls','sidebar');
 let wasOpen=false;
 function sync(){
  const open=mobile.matches&&sidebar.classList.contains('open');
  toggle.setAttribute('aria-expanded',String(open));backdrop.hidden=!open;
  document.body.classList.toggle('mobile-menu-open',open);
  sidebar.inert=mobile.matches&&!open;
  if(open&&!wasOpen)close.focus();
  if(!open&&wasOpen&&sidebar.contains(document.activeElement))toggle.focus();
  wasOpen=open;
 }
 function hide(){sidebar.classList.remove('open');sync()}
 close.addEventListener('click',hide);backdrop.addEventListener('click',hide);
 new MutationObserver(sync).observe(sidebar,{attributes:true,attributeFilter:['class']});mobile.addEventListener('change',hide);
 document.addEventListener('keydown',e=>{
  if(!wasOpen)return;
  if(e.key==='Escape'){e.preventDefault();hide()}
  if(e.key==='Tab'){
   const items=[...sidebar.querySelectorAll('a[href],button,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
   const first=items[0],last=items.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
 });
 // Keep table headers available as labels when rows become mobile cards.
 const content=document.getElementById('content');
 function labelTables(){content?.querySelectorAll('table').forEach(table=>{
  const labels=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
  if(!labels.length)return;
  table.classList.add('mobile-card-table');
  table.querySelectorAll('tbody tr').forEach(row=>[...row.cells].forEach((cell,i)=>{
   const label=cell.colSpan>1?'':labels[i]||'';
   if(cell.dataset.label!==label)cell.dataset.label=label;
  }));
 })}
 if(content)new MutationObserver(labelTables).observe(content,{childList:true,subtree:true});
 document.addEventListener('input',e=>{if(!e.target.matches('[data-mobile-document-search]'))return;const query=e.target.value.trim().toLocaleLowerCase('pt-BR');content.querySelectorAll('.documents-list-page tbody tr').forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('pt-BR').includes(query)})});
 document.addEventListener('click',e=>{const button=e.target.closest('[data-mobile-patient-tab]');if(!button)return;const card=button.closest('.reference-patient-detail');card.querySelectorAll('[data-mobile-patient-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));card.querySelectorAll('[data-mobile-patient-pane]').forEach(p=>p.hidden=p.dataset.mobilePatientPane!==button.dataset.mobilePatientTab)});
 labelTables();sync();
})();

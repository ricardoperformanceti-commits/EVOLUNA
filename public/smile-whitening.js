/* Clareamento ilustrativo do caso pronto: cor do esmalte, sem remodelar dentes. */
(()=>{
let prepared=null;
const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)};
const teeth=[
 'M358 316 Q367 315 378 318 L385 346 Q381 357 369 352 Q360 343 357 329 Z',
 'M381 315 Q392 315 402 321 L413 342 Q417 353 410 361 L398 367 Q386 363 383 351 L378 326 Z',
 'M417 321 Q427 318 439 328 Q449 337 451 350 L452 362 Q451 372 439 374 L426 373 Q415 370 414 358 L412 334 Z',
 'M458 322 Q469 320 482 326 Q497 326 502 340 L507 365 Q508 376 498 378 L467 377 Q455 375 454 363 L454 342 Q453 330 458 322 Z',
 'M513 338 Q520 325 537 320 L550 317 Q561 319 563 334 L564 364 Q563 376 552 378 L521 378 Q510 376 510 364 Z',
 'M572 326 Q579 315 594 315 Q604 315 605 330 L608 350 Q608 367 599 371 L584 372 Q571 371 567 359 L566 339 Z',
 'M613 323 Q622 313 632 313 L637 318 L636 344 L632 359 Q628 368 620 365 L610 358 Q606 353 608 339 Z',
 'M641 318 L652 312 L656 313 L654 338 Q651 350 641 354 L636 344 L638 330 Z'
];
async function prepare(){const image=new Image();image.src='/assets/sorriso-antes-depois.webp';await image.decode();const width=image.naturalWidth,height=image.naturalHeight/2;if(!Number.isInteger(height))throw Error('Imagem de referência incompatível.');const original=document.createElement('canvas');original.width=width;original.height=height;const ctx=original.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,width,height,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height);const mask=document.createElement('canvas');mask.width=width;mask.height=height;const m=mask.getContext('2d',{willReadFrequently:true});m.scale(width/1080,height/728);m.fillStyle='white';m.filter='blur(.55px)';for(const path of teeth)m.fill(new Path2D(path));const area=m.getImageData(0,0,width,height).data;let adjusted=0;
for(let i=0;i<pixels.data.length;i+=4){if(!area[i+3])continue;const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];const y=.2126*r+.7152*g+.0722*b;const enamel=smooth(.68,.80,g/Math.max(r,1))*smooth(.25,.45,b/Math.max(r,1))*smooth(90,130,y);const weight=enamel*(area[i+3]/255);if(weight<.01)continue;const targetY=Math.max(y,Math.min(252,y<=210?y+32:242+(y-210)*.22));const remainingChroma=.24;for(let c=0;c<3;c++){const source=pixels.data[i+c];const target=targetY+(source-y)*remainingChroma;pixels.data[i+c]=Math.round(source+(target-source)*weight)}adjusted++}
if(adjusted<100)throw Error('Não foi possível preparar o clareamento.');ctx.putImageData(pixels,0,0);return original.toDataURL('image/png')}
async function mount(){const targets=[...document.querySelectorAll('.dental-whitening:not([data-whitening-ready])')];if(!targets.length)return;try{prepared??=prepare().catch(error=>{prepared=null;throw error});const result=await prepared;for(const target of targets){if(!target.isConnected)continue;target.style.backgroundImage=`url("${result}")`;target.style.backgroundSize='100% 100%';target.style.backgroundPosition='center';target.dataset.whiteningReady='true'}}catch{for(const target of targets){const label=target.parentElement?.querySelector('.compare-label.right');if(label)label.textContent='Prévia indisponível · recarregue a página'}}}
window.SmileWhitening={mount};
})();

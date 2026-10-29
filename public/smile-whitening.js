/* Clareamento ilustrativo do caso pronto: cor do esmalte, sem remodelar dentes. */
(()=>{
const prepared=new Map();
const tones={BL1:{lift:42,chroma:.10,peak:246,warmth:0},BL2:{lift:34,chroma:.24,peak:241,warmth:2},A1:{lift:20,chroma:.52,peak:233,warmth:4}};
const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t)};
function applyTone(pixels,mask,shade){const tone=tones[shade]||tones.BL1;let adjusted=0;for(let p=0;p<mask.length;p++){const weight=mask[p]/255;if(weight<.01)continue;const i=p*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],y=.2126*r+.7152*g+.0722*b;const targetY=Math.max(y,Math.min(252,y<=210?y+tone.lift:tone.peak+(y-210)*.12));for(let c=0;c<3;c++){const original=pixels[i+c],target=targetY+(original-y)*tone.chroma-(c===2?tone.warmth:0);pixels[i+c]=Math.round(original+(target-original)*weight)}adjusted++}return adjusted}
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
async function prepare(source,shade){const image=new Image();image.src='/assets/sorriso-antes-depois.webp';await image.decode();const width=image.naturalWidth,height=image.naturalHeight/2;if(!Number.isInteger(height))throw Error('Imagem de referência incompatível.');const original=document.createElement('canvas');original.width=width;original.height=height;const ctx=original.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,source==='restorative'?height:0,width,height,0,0,width,height);const pixels=ctx.getImageData(0,0,width,height);const mask=document.createElement('canvas');mask.width=width;mask.height=height;const m=mask.getContext('2d',{willReadFrequently:true});m.scale(width/1080,height/728);m.fillStyle='white';m.filter='blur(.55px)';for(const path of teeth)m.fill(new Path2D(path));const area=m.getImageData(0,0,width,height).data;const weights=new Uint8Array(width*height);
for(let i=0;i<pixels.data.length;i+=4){if(!area[i+3])continue;const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2],y=.2126*r+.7152*g+.0722*b;const enamel=smooth(.52,.70,g/Math.max(r,1))*smooth(.10,.25,b/Math.max(r,1))*smooth(65,110,y);weights[i/4]=Math.round(enamel*area[i+3])}
const adjusted=applyTone(pixels.data,weights,shade);
if(adjusted<100)throw Error('Não foi possível preparar o clareamento.');ctx.putImageData(pixels,0,0);return original.toDataURL('image/png')}
async function mount(){const targets=[...document.querySelectorAll('.dental-after[data-smile-shade]:not([data-whitening-ready])')];await Promise.all(targets.map(async target=>{const shade=target.dataset.smileShade,source=target.classList.contains('dental-restorative')?'restorative':'original',key=source+':'+shade;try{if(!prepared.has(key))prepared.set(key,prepare(source,shade).catch(error=>{prepared.delete(key);throw error}));const result=await prepared.get(key);if(!target.isConnected)return;target.style.backgroundImage=`url("${result}")`;target.style.backgroundSize='100% 100%';target.style.backgroundPosition='center';target.dataset.whiteningReady='true'}catch{const label=target.parentElement?.querySelector('.compare-label.right');if(label)label.textContent='Prévia indisponível · recarregue a página'}}))}
window.SmileWhitening={mount,applyTone};
})();

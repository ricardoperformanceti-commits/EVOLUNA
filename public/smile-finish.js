/* Clareamento local moderado: mantém luminância, textura e separação dos dentes. */
(()=>{
const profiles={BL1:{white:224,chroma:.72,lift:18},BL2:{white:216,chroma:.82,lift:14},A1:{white:206,chroma:.92,lift:9}};
const luma=(pixels,i)=>.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
const clamp=v=>Math.max(0,Math.min(1,v));
function apply(pixels,mask,width,height,shade,procedure='clareamento',intensity=55){const tone=profiles[shade]||profiles.BL1,strength=clamp((Number.isFinite(Number(intensity))?Number(intensity):55)/100);if(!strength)return 0;const histogram=new Uint32Array(256);let count=0;for(let p=0;p<mask.length;p++)if(mask[p]>=128){histogram[Math.round(luma(pixels,p*4))]++;count++}if(count<5)return 0;let cumulative=0,reference=0;for(;reference<255;reference++){cumulative+=histogram[reference];if(cumulative>=count*.75)break}const exposure=Math.min(.2,Math.max(0,(tone.white-reference)/Math.max(1,255-reference)));let adjusted=0;
for(let p=0;p<mask.length;p++){const coverage=mask[p]/255;if(coverage<.015)continue;const i=p*4,y=luma(pixels,i),shadow=clamp((y-85)/65),highlight=clamp((252-y)/28),amount=coverage*strength*shadow*highlight;if(amount<.001)continue;const lift=Math.min(tone.lift,(255-y)*exposure),white=y+lift;
// A redução de cor é gradual, sem apagar os reflexos ou preencher as frestas.
for(let c=0;c<3;c++){const original=pixels[i+c],desired=white+(original-y)*tone.chroma,delta=Math.max(-24,Math.min(24,desired-original));pixels[i+c]=Math.round(Math.max(0,Math.min(255,original+delta*amount)))}adjusted++}return adjusted}
window.SmileFinish={apply};
})();

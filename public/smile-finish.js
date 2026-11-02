/* Acabamento fotográfico local: conserva anatomia, textura e contraste do esmalte. */
(()=>{
const profiles={BL1:{white:226,esthetic:234,chroma:.18,warmth:.3,lift:48},BL2:{white:216,esthetic:225,chroma:.30,warmth:1,lift:40},A1:{white:204,esthetic:213,chroma:.55,warmth:2,lift:32}};
const luma=(pixels,i)=>.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
const clamp=v=>Math.max(0,Math.min(1,v));
function apply(pixels,mask,width,height,shade,procedure='clareamento'){const tone=profiles[shade]||profiles.BL1,esthetic=procedure!=='clareamento',histogram=new Uint32Array(256);let count=0;for(let p=0;p<mask.length;p++)if(mask[p]>=128){histogram[Math.round(luma(pixels,p*4))]++;count++}if(count<5)return 0;let cumulative=0,reference=0;for(;reference<255;reference++){cumulative+=histogram[reference];if(cumulative>=count*.75)break}const target=esthetic?tone.esthetic:tone.white,exposure=Math.min(.62,Math.max(0,(target-reference)/Math.max(1,255-reference))),maxLift=esthetic?tone.lift:tone.lift*.83;let adjusted=0;
for(let p=0;p<mask.length;p++){const coverage=mask[p]/255;if(coverage<.015)continue;const i=p*4,y=luma(pixels,i),protection=clamp((y-65)/50),lift=Math.min(maxLift,(255-y)*exposure)*protection,white=y+lift;
// Nenhum preenchimento de cor sólida ou alisamento da fotografia: a luminância
// original continua determinando as sombras, o relevo, os reflexos e a textura.
for(let c=0;c<3;c++){const original=pixels[i+c],desired=white+(original-y)*tone.chroma+(c===0?tone.warmth:c===2?-tone.warmth:0);pixels[i+c]=Math.round(Math.max(0,Math.min(255,original+(desired-original)*coverage)))}adjusted++}return adjusted}
window.SmileFinish={apply};
})();

/* Acabamento estético local. Não cria dentes nem altera anatomia da fotografia. */
(()=>{
const profiles={BL1:{white:228,esthetic:237,chroma:.10,warmth:.3},BL2:{white:216,esthetic:227,chroma:.19,warmth:1.2},A1:{white:202,esthetic:214,chroma:.36,warmth:2.7}};
const luma=(pixels,i)=>.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];
const clamp=v=>Math.max(0,Math.min(1,v));
function apply(pixels,mask,width,height,shade,procedure='clareamento'){const tone=profiles[shade]||profiles.BL1,esthetic=procedure!=='clareamento',histogram=new Uint32Array(256);let count=0;for(let p=0;p<mask.length;p++)if(mask[p]>=140){histogram[Math.round(luma(pixels,p*4))]++;count++}if(count<5)return 0;let cumulative=0,median=0;for(;median<255;median++){cumulative+=histogram[median];if(cumulative>=count*.65)break}const target=Math.max(median,Math.min(esthetic?tone.esthetic:tone.white,median+88)),contrast=esthetic?.76:.94,source=pixels.slice();let adjusted=0;
for(let p=0;p<mask.length;p++){const coverage=mask[p]/255;if(coverage<.02)continue;const i=p*4,y=luma(source,i);let brightness=y;
// Suaviza apenas pequenas oscilações internas; reflexos e separações permanecem.
if(esthetic&&mask[p]>=180){let sum=y*4,weight=4;const x=p%width,row=Math.floor(p/width);for(const q of[x>0?p-1:-1,x<width-1?p+1:-1,row>0?p-width:-1,row<height-1?p+width:-1])if(q>=0&&mask[q]>=180){const nearby=luma(source,q*4);if(Math.abs(nearby-y)<15){sum+=nearby;weight++}}brightness=y*.82+sum/weight*.18}
const delta=brightness-median,room=Math.max(3,254-target),shadows=Math.max(1,target-60),mapped=delta>=0?target+room*(1-Math.exp(-delta*contrast/room)):target-shadows*(1-Math.exp(delta*contrast/shadows)),protection=clamp((y-65)/50),white=Math.max(y,y+(mapped-y)*protection),amount=coverage;
for(let c=0;c<3;c++){const original=source[i+c],desired=white+(original-y)*tone.chroma+(c===0?tone.warmth:c===2?-tone.warmth:0);pixels[i+c]=Math.round(Math.max(0,Math.min(255,original+(desired-original)*amount)))}adjusted++}return adjusted}
window.SmileFinish={apply};
})();

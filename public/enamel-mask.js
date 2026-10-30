/* Máscara conservadora de esmalte dentro da abertura da boca.
   Exclui cores rosadas/avermelhadas e pequenas áreas de brilho isoladas. */
(()=>{
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function score(r,g,b){const luma=.2126*r+.7152*g+.0722*b;if(luma<85||g<r*.60||b<r*.23)return 0;const red=r-g,yellow=g-b;if(yellow<red*.25-2||b>g+4)return 0;const spread=Math.max(r,g,b)-Math.min(r,g,b),neutral=spread<32&&g>=r*.84&&b>=r*.73;const hue=spread===0?60:Math.max(r,g,b)===r?60*((g-b)/spread):Math.max(r,g,b)===g?60*(2+(b-r)/spread):60*(4+(r-g)/spread);if(!neutral&&(hue<16||hue>82))return 0;const margin=neutral?1:clamp((yellow-red*.25+2)/10),light=clamp((luma-85)/45),weight=margin*light;return weight<.40?0:Math.round(255*weight)}
function build(pixels,region,width,height){const size=width*height,candidate=new Uint8Array(size),confidence=new Uint8Array(size),seen=new Uint8Array(size),result=new Uint8Array(size);let regionCount=0,minY=height,maxY=0;
for(let p=width+1;p<size-width-1;p++){if(p%width===0||p%width===width-1)continue;const i=p*4;if(region[i]<240||region[i-4]<240||region[i+4]<240||region[i-width*4]<240||region[i+width*4]<240)continue;regionCount++;const py=Math.floor(p/width);minY=Math.min(minY,py);maxY=Math.max(maxY,py);const weight=score(pixels[i],pixels[i+1],pixels[i+2]);if(!weight)continue;candidate[p]=1;confidence[p]=weight}
if(!regionCount)return result;
// Uma faixa fina sobre o lábio pode ter cor clara, mas não a profundidade de um dente.
// Remove esses trechos por coluna antes de unir as superfícies de esmalte.
const minDepth=Math.max(3,Math.round((maxY-minY)*.07));
for(let x=1;x<width-1;x++){let y=minY;while(y<=maxY){if(!candidate[y*width+x]){y++;continue}const start=y;while(y<=maxY&&candidate[y*width+x])y++;if(y-start<minDepth)for(let row=start;row<y;row++){candidate[row*width+x]=0;confidence[row*width+x]=0}}}
// As duas arcadas e os dentes laterais podem formar ilhas separadas.
// Avalia cada superfície dentro da boca, sem descartar tudo fora da maior faixa.
const minArea=Math.max(8,Math.ceil(regionCount*.0015)),minHeight=Math.max(3,Math.round((maxY-minY)*.07)),queue=new Int32Array(size);
for(let p=0;p<size;p++){if(!candidate[p]||seen[p])continue;let head=0,tail=1,top=height,bottom=0,left=width,right=0,strong=0;queue[0]=p;seen[p]=1;
while(head<tail){const q=queue[head++],x=q%width,y=Math.floor(q/width);top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);if(confidence[q]>140)strong++;for(const next of[q-width,q+width,x>0?q-1:-1,x<width-1?q+1:-1])if(next>=0&&next<size&&candidate[next]&&!seen[next]){seen[next]=1;queue[tail++]=next}}
// Reflexos puntuais na gengiva não têm uma superfície contínua de esmalte.
if(tail<minArea||bottom-top+1<minHeight||right-left+1<2||strong<Math.max(3,tail*.12))continue;
for(let k=0;k<tail;k++){const q=queue[k];result[q]=confidence[q]}}
// A suavização é apenas para dentro da máscara: nunca expande a cor para tecidos vizinhos.
const soft=result.slice();for(let p=width+1;p<size-width-1;p++){if(!result[p])continue;let neighbors=0;for(const q of[p-1,p+1,p-width,p+width])if(result[q])neighbors++;soft[p]=Math.round(result[p]*(neighbors===4?1:neighbors>=2?.55:.25))}return soft}
function feather(mask,width,height,radius=2){let current=Float32Array.from(mask);const step=Math.max(1,Math.round(radius));for(let pass=0;pass<3;pass++){const horizontal=new Float32Array(mask.length),next=new Float32Array(mask.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;horizontal[p]=(current[y*width+Math.max(0,x-step)]+2*current[p]+current[y*width+Math.min(width-1,x+step)])/4}for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;next[p]=(horizontal[Math.max(0,y-step)*width+x]+2*horizontal[p]+horizontal[Math.min(height-1,y+step)*width+x])/4}current=next}return Uint8Array.from(mask,(value,p)=>value?Math.round(Math.min(value,current[p])):0)}
window.TeethMask={build,score,feather};
})();

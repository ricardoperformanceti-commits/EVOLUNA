/* Seleção local do esmalte: sementes claras, expansão por cor e bordas suaves.
   A abertura da boca limita o processamento; não há preenchimento sobre tecido vermelho. */
(()=>{
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function smooth(a,b,v){const t=clamp((v-a)/(b-a));return t*t*(3-2*t)}
function score(r,g,b){const y=.2126*r+.7152*g+.0722*b;if(y<70||g<r*.63||b<r*.26||b>g*1.12+6||g>r*1.18+12)return 0;const spread=Math.max(r,g,b)-Math.min(r,g,b),neutral=spread<24&&g>=r*.80&&b>=r*.68;let color;if(neutral)color=1;else if(r>=g&&r>=b){const redness=(r-g)/Math.max(12,r-b);if(redness>.78)return 0;color=1-smooth(.65,.78,redness)}else{if(spread>45||g<r*.9)return 0;color=.8}return Math.round(255*color*smooth(70,115,y))}
function build(pixels,region,width,height){const size=width*height,candidate=new Uint8Array(size),confidence=new Uint8Array(size),seen=new Uint8Array(size),result=new Uint8Array(size);let regionCount=0,minY=height,maxY=0;
for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x,i=p*4;if(region[i]<240||region[i-4]<240||region[i+4]<240||region[i-width*4]<240||region[i+width*4]<240)continue;regionCount++;minY=Math.min(minY,y);maxY=Math.max(maxY,y);const weight=score(pixels[i],pixels[i+1],pixels[i+2]);confidence[p]=weight;if(weight>=42)candidate[p]=1}
if(!regionCount)return result;
const mouthHeight=maxY-minY+1,minArea=Math.max(8,Math.ceil(regionCount*.0012)),minHeight=Math.max(3,Math.round(mouthHeight*.07)),queue=new Int32Array(size);
// Cada ilha de esmalte é avaliada separadamente: arcadas inferior e superior e laterais.
for(let p=0;p<size;p++){if(!candidate[p]||seen[p])continue;let head=0,tail=1,top=height,bottom=0,left=width,right=0,strong=0,totalConfidence=0,maxConfidence=0;queue[0]=p;seen[p]=1;
while(head<tail){const q=queue[head++],x=q%width,y=Math.floor(q/width),weight=confidence[q];top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);totalConfidence+=weight;maxConfidence=Math.max(maxConfidence,weight);if(weight>=145)strong++;for(const next of[q-width,q+width,x>0?q-1:-1,x<width-1?q+1:-1])if(next>=0&&next<size&&candidate[next]&&!seen[next]){seen[next]=1;queue[tail++]=next}}
const seeded=strong>=Math.max(3,tail*.025),shaded=maxConfidence>=100&&totalConfidence/tail>=85&&bottom-top+1>=mouthHeight*.12;if(tail<minArea||bottom-top+1<minHeight||right-left+1<2||(!seeded&&!shaded))continue;
// Cor decide a seleção, não a intensidade: evita manchas brancas no centro dos dentes.
for(let k=0;k<tail;k++)result[queue[k]]=255}
// Fecha somente pequenos vazios cercados por esmalte. O teste de cor impede
// que reflexos vermelhos da gengiva sejam tratados como um buraco no dente.
const closeRadius=Math.max(2,Math.round(mouthHeight*.018));
for(let pass=0;pass<2;pass++){const stride=width+1,integral=new Uint32Array(stride*(height+1));for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){row+=result[y*width+x]?1:0;integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row}}const additions=[];for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x,i=p*4;if(result[p]||region[i]<240)continue;const r=pixels[i],g=pixels[i+1],b=pixels[i+2],yValue=.2126*r+.7152*g+.0722*b,redness=(r-g)/Math.max(12,r-b);if(yValue<105||g<r*.72||b<r*.46||redness>.82||b>g*1.12+6)continue;const x1=Math.max(0,x-closeRadius),x2=Math.min(width,x+closeRadius+1),y1=Math.max(0,y-closeRadius),y2=Math.min(height,y+closeRadius+1),occupied=integral[y2*stride+x2]-integral[y1*stride+x2]-integral[y2*stride+x1]+integral[y1*stride+x1];if(occupied/((x2-x1)*(y2-y1))>.60)additions.push(p)}for(const p of additions)result[p]=255}
// Distância para dentro do esmalte, sem expandir a seleção para lábio, gengiva ou frestas.
const distance=new Uint16Array(size),limit=65500;for(let p=0;p<size;p++)distance[p]=result[p]?limit:0;
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;if(distance[p])distance[p]=Math.min(distance[p],x?distance[p-1]+1:1,y?distance[p-width]+1:1)}
for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const p=y*width+x;if(distance[p])distance[p]=Math.min(distance[p],x<width-1?distance[p+1]+1:1,y<height-1?distance[p+width]+1:1)}
const radius=Math.max(1.5,mouthHeight*.012);return Uint8Array.from(result,(value,p)=>value?Math.round(255*smooth(0,radius,distance[p])):0)}
function feather(mask,width,height,radius=2){let current=Float32Array.from(mask);const step=Math.max(1,Math.round(radius));for(let pass=0;pass<3;pass++){const horizontal=new Float32Array(mask.length),next=new Float32Array(mask.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;horizontal[p]=(current[y*width+Math.max(0,x-step)]+2*current[p]+current[y*width+Math.min(width-1,x+step)])/4}for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;next[p]=(horizontal[Math.max(0,y-step)*width+x]+2*horizontal[p]+horizontal[Math.min(height-1,y+step)*width+x])/4}current=next}return Uint8Array.from(mask,(value,p)=>value?Math.round(Math.min(value,current[p])):0)}
window.TeethMask={build,score,feather};
})();

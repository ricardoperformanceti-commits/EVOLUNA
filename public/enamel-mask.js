/* Seleção local do esmalte: sementes claras, expansão por cor e bordas suaves.
   A abertura da boca limita o processamento; não há preenchimento sobre tecido vermelho. */
(()=>{
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function smooth(a,b,v){const t=clamp((v-a)/(b-a));return t*t*(3-2*t)}
function score(r,g,b){const y=.2126*r+.7152*g+.0722*b;if(y<70||g<r*.58||b<r*.22||b>g*1.12+6||g>r*1.18+12)return 0;const spread=Math.max(r,g,b)-Math.min(r,g,b),neutral=spread<24&&g>=r*.80&&b>=r*.68;let color;if(neutral)color=1;else if(r>=g&&r>=b){const redness=(r-g)/Math.max(12,r-b);if(redness>.86)return 0;color=1-smooth(.72,.86,redness)}else{if(spread>45||g<r*.9)return 0;color=.8}return Math.round(255*color*smooth(70,115,y))}
function build(pixels,region,width,height){const size=width*height,candidate=new Uint8Array(size),confidence=new Uint8Array(size),seen=new Uint8Array(size),result=new Uint8Array(size);let regionCount=0,minY=height,maxY=0,minX=width,maxX=0;
for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x,i=p*4;if(region[i]<240||region[i-4]<240||region[i+4]<240||region[i-width*4]<240||region[i+width*4]<240)continue;regionCount++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);const weight=score(pixels[i],pixels[i+1],pixels[i+2]);confidence[p]=weight;if(weight>=42)candidate[p]=1}
if(!regionCount)return result;
// Nas extremidades, o último dente pode ter apenas poucos pixels sob sombra.
// Aceita esmalte amarelo/neutro mais escuro, sem incluir pixels avermelhados.
for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const p=y*width+x,i=p*4,outer=x<minX+(maxX-minX)*.18||x>minX+(maxX-minX)*.82;if(!outer||confidence[p]<18)continue;const redness=(pixels[i]-pixels[i+1])/Math.max(12,pixels[i]-pixels[i+2]);if(redness<.72)candidate[p]=1}

const mouthHeight=maxY-minY+1,minArea=Math.max(8,Math.ceil(regionCount*.0012)),minHeight=Math.max(3,Math.round(mouthHeight*.07)),queue=new Int32Array(size);
// Cada ilha de esmalte é avaliada separadamente: arcadas inferior e superior e laterais.
for(let p=0;p<size;p++){if(!candidate[p]||seen[p])continue;let head=0,tail=1,top=height,bottom=0,left=width,right=0,strong=0,totalConfidence=0,maxConfidence=0;queue[0]=p;seen[p]=1;
while(head<tail){const q=queue[head++],x=q%width,y=Math.floor(q/width),weight=confidence[q];top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);totalConfidence+=weight;maxConfidence=Math.max(maxConfidence,weight);if(weight>=145)strong++;for(const next of[q-width,q+width,x>0?q-1:-1,x<width-1?q+1:-1])if(next>=0&&next<size&&candidate[next]&&!seen[next]){seen[next]=1;queue[tail++]=next}}
// Dentes distais aparecem menores e mais sombreados por causa da perspectiva.
const centerX=(left+right)/2,lateral=centerX<minX+(maxX-minX)*.28||centerX>minX+(maxX-minX)*.72;
const outermost=centerX<minX+(maxX-minX)*.18||centerX>minX+(maxX-minX)*.82;
const seeded=strong>=Math.max(3,tail*.025),shaded=maxConfidence>=(outermost?30:lateral?75:100)&&totalConfidence/tail>=(outermost?25:lateral?60:85)&&bottom-top+1>=Math.max(3,mouthHeight*(outermost?.03:lateral?.07:.12)),requiredArea=outermost?Math.max(5,Math.ceil(regionCount*.00025)):lateral?Math.max(8,Math.ceil(regionCount*.0006)):minArea,requiredHeight=lateral?Math.max(3,Math.round(mouthHeight*(outermost?.025:.045))):minHeight;if(tail<requiredArea||bottom-top+1<requiredHeight||right-left+1<2||(!seeded&&!shaded))continue;
// Cor decide a seleção, não a intensidade: evita manchas brancas no centro dos dentes.
for(let k=0;k<tail;k++)result[queue[k]]=255}
// Fecha recortes estreitos dentro da silhueta, sem alargar o contorno externo.
// A reconstrução é geométrica; a proteção de tecido continua aplicada por pixel.
const closeRadius=Math.max(2,Math.round(mouthHeight*.045));
function distanceFrom(binary,target){const distance=new Uint16Array(size);for(let p=0;p<size;p++)distance[p]=Boolean(binary[p])===target?0:65500;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;distance[p]=Math.min(distance[p],x?distance[p-1]+1:65500,y?distance[p-width]+1:65500)}for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const p=y*width+x;distance[p]=Math.min(distance[p],x<width-1?distance[p+1]+1:65500,y<height-1?distance[p+width]+1:65500)}return distance}
const fromEnamel=distanceFrom(result,true),dilated=Uint8Array.from(fromEnamel,d=>d<=closeRadius?1:0),fromOutside=distanceFrom(dilated,false);
for(let p=0;p<size;p++){if(result[p]||fromOutside[p]<=closeRadius||region[p*4]<240)continue;const i=p*4;if(tissueGate(pixels[i],pixels[i+1],pixels[i+2])>.18)result[p]=255}
// Distância para dentro do esmalte, sem expandir a seleção para lábio, gengiva ou frestas.
const distance=new Uint16Array(size),limit=65500;for(let p=0;p<size;p++)distance[p]=result[p]?limit:0;
for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;if(distance[p])distance[p]=Math.min(distance[p],x?distance[p-1]+1:1,y?distance[p-width]+1:1)}
for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const p=y*width+x;if(distance[p])distance[p]=Math.min(distance[p],x<width-1?distance[p+1]+1:1,y<height-1?distance[p+width]+1:1)}
const radius=Math.max(1.5,mouthHeight*.012);return Uint8Array.from(result,(value,p)=>value?Math.round(255*smooth(0,radius,distance[p])):0)}
function feather(mask,width,height,radius=2){let current=Float32Array.from(mask);const step=Math.max(1,Math.round(radius));for(let pass=0;pass<3;pass++){const horizontal=new Float32Array(mask.length),next=new Float32Array(mask.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;horizontal[p]=(current[y*width+Math.max(0,x-step)]+2*current[p]+current[y*width+Math.min(width-1,x+step)])/4}for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*width+x;next[p]=(horizontal[Math.max(0,y-step)*width+x]+2*horizontal[p]+horizontal[Math.min(height-1,y+step)*width+x])/4}current=next}return Uint8Array.from(mask,(value,p)=>value?Math.round(Math.min(value,current[p])):0)}
// Filtro guiado por RGB: a seleção acompanha as transições da própria imagem,
// em vez de conservar os degraus e os vazios de uma máscara binária.
function boxMean(values,width,height,radius){const stride=width+1,integral=new Float64Array(stride*(height+1));for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){row+=values[y*width+x];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row}}const out=new Float32Array(values.length);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const x1=Math.max(0,x-radius),x2=Math.min(width,x+radius+1),y1=Math.max(0,y-radius),y2=Math.min(height,y+radius+1);out[y*width+x]=(integral[y2*stride+x2]-integral[y1*stride+x2]-integral[y2*stride+x1]+integral[y1*stride+x1])/((x2-x1)*(y2-y1))}return out}
function tissueGate(r,g,b){const y=.2126*r+.7152*g+.0722*b,redness=(r-g)/Math.max(12,r-b);return smooth(55,85,y)*(1-smooth(.78,.95,redness))*smooth(.45,.64,g/Math.max(r,1))*smooth(.18,.35,b/Math.max(r,1))*(1-smooth(1.12,1.28,b/Math.max(g,1)))}
function refine(pixels,mask,region,width,height,radius=5){const size=mask.length,channels=[new Float32Array(size),new Float32Array(size),new Float32Array(size)],alpha=Float32Array.from(mask,v=>v/255);for(let p=0;p<size;p++)for(let c=0;c<3;c++)channels[c][p]=pixels[p*4+c]/255;const mean=channels.map(c=>boxMean(c,width,height,radius)),mp=boxMean(alpha,width,height,radius),products=[[0,0],[0,1],[0,2],[1,1],[1,2],[2,2]],cov=products.map(([a,b])=>{const product=Float32Array.from(channels[a],(v,p)=>v*channels[b][p]);return boxMean(product,width,height,radius)}),cross=channels.map(c=>boxMean(Float32Array.from(c,(v,p)=>v*alpha[p]),width,height,radius)),coeff=[new Float32Array(size),new Float32Array(size),new Float32Array(size)],offset=new Float32Array(size),eps=.0012;
for(let p=0;p<size;p++){const r=mean[0][p],g=mean[1][p],b=mean[2][p],rr=cov[0][p]-r*r+eps,rg=cov[1][p]-r*g,rb=cov[2][p]-r*b,gg=cov[3][p]-g*g+eps,gb=cov[4][p]-g*b,bb=cov[5][p]-b*b+eps,v0=cross[0][p]-r*mp[p],v1=cross[1][p]-g*mp[p],v2=cross[2][p]-b*mp[p],a00=gg*bb-gb*gb,a01=rb*gb-rg*bb,a02=rg*gb-rb*gg,a11=rr*bb-rb*rb,a12=rg*rb-rr*gb,a22=rr*gg-rg*rg,det=Math.max(1e-12,rr*a00+rg*a01+rb*a02);coeff[0][p]=(a00*v0+a01*v1+a02*v2)/det;coeff[1][p]=(a01*v0+a11*v1+a12*v2)/det;coeff[2][p]=(a02*v0+a12*v1+a22*v2)/det;offset[p]=mp[p]-coeff[0][p]*r-coeff[1][p]*g-coeff[2][p]*b}
const average=coeff.map(c=>boxMean(c,width,height,radius)),mb=boxMean(offset,width,height,radius),out=new Uint8Array(size);for(let p=0;p<size;p++){const i=p*4;if(region[i]<240)continue;const q=clamp(average[0][p]*channels[0][p]+average[1][p]*channels[1][p]+average[2][p]*channels[2][p]+mb[p]),gate=tissueGate(pixels[i],pixels[i+1],pixels[i+2]);out[p]=Math.round(255*q*gate)}return out}

window.TeethMask={build,score,feather,refine,tissueGate};
})();

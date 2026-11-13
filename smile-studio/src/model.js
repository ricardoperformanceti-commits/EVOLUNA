const bl2Reference=[250,241,231];
export const shades={BL1:{name:'Branco intenso',rgb:bl2Reference.map(channel=>Math.round(channel+(255-channel)*.1))},BL2:{name:'Branco suave',rgb:bl2Reference},A1:{name:'Natural marfim',rgb:[243,229,220]}};
export const treatments={clareamento:'Clareamento',lentes:'Lentes'};
export function freshCase(patient=null){return {patient,photo:null,base:null,after:null,record:null,mouth:null,shade:null,procedure:null,intensity:55,compare:50,dirty:false}}
export function sameContext(a,b){return a.user===b.user&&a.epoch===b.epoch&&a.patient===b.patient}
export function replaceGeneration(records,record){return [record,...records.filter(r=>r.id!==record.id)].sort((a,b)=>b.created_at.localeCompare(a.created_at))}
// Natural A1 uses the reference's warm chroma while retaining each photo's luminance.
// Deep inter-tooth shadows and specular reflections are protected independently.
function naturalA1(pixels,mask,strength){
 const target=shades.A1.rgb,referenceY=.2126*target[0]+.7152*target[1]+.0722*target[2],histogram=new Float64Array(256);let total=0,count=0;
 // Estimate exposure from masked tooth enamel, not skin, lips or the background.
 for(let p=0;p<mask.length;p++){if(mask[p]<48)continue;const i=p*4,y=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];if(y<=85)continue;histogram[Math.round(y)]+=mask[p];total+=mask[p]}
 if(!total)return 0;let median=0,weight=0;for(;median<255;median++){weight+=histogram[median];if(weight>=total/2)break}
 const shift=Math.max(-32,Math.min(8,referenceY+(median-200)*.35-median)),highlightStart=Math.max(240,median+8);
 // Bright uniform veneers are enamel; only outliers above the body get reflection protection.
 for(let p=0;p<mask.length;p++){
  const i=p*4,y=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2],coverage=mask[p]/255;
  const shadow=Math.max(0,Math.min(1,(y-85)/65)),h=Math.max(0,Math.min(1,(y-highlightStart)/4)),highlight=1-h*h*(3-2*h),amount=coverage*strength*shadow*highlight*.8;
  if(coverage<.015||amount<=0)continue;
  const luminance=y+shift;
  for(let c=0;c<3;c++){
   const desired=luminance+(target[c]-referenceY)*.7+(pixels[i+c]-y)*.25;
   pixels[i+c]=Math.round(Math.max(0,Math.min(255,pixels[i+c]+(desired-pixels[i+c])*amount)));
  }
  count++;
 }
 return count;
}
// Every edit starts from the immutable AI base. Zero leaves every byte unchanged.
export function retone(pixels,mask,shade,intensity){const strength=Math.max(0,Math.min(100,Number(intensity)))/100,target=shades[shade]?.rgb||shades.BL1.rgb;if(!strength)return 0;if(shade==='A1')return naturalA1(pixels,mask,strength);
 if(shade==='BL1'){
  // BL1 starts from the identical BL2 result, then closes 10% of its gap to white.
  const source=pixels.slice(),count=retone(pixels,mask,'BL2',intensity);
  for(let p=0;p<mask.length;p++){const i=p*4,y=.2126*source[i]+.7152*source[i+1]+.0722*source[i+2],coverage=mask[p]/255,shadow=Math.max(0,Math.min(1,(y-65)/80));if(coverage<.015||!shadow)continue;const amount=.1*strength*coverage*shadow;for(let c=0;c<3;c++)pixels[i+c]=Math.round(pixels[i+c]+(255-pixels[i+c])*amount)}
  return count;
 }
 let count=0;
 for(let p=0;p<mask.length;p++){const i=p*4,y=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2],coverage=mask[p]/255,shadow=Math.max(0,Math.min(1,(y-65)/80));if(coverage<.015||!shadow)continue;
  // A luminance curve preserves tooth shadows and specular highlights instead of filling a flat color.
  const detail=Math.max(.35,Math.min(1,y/225)),amount=coverage*strength*shadow*.85;
  for(let c=0;c<3;c++){const desired=Math.min(255,target[c]*detail+(pixels[i+c]-y)*.28);pixels[i+c]=Math.round(Math.max(0,Math.min(255,pixels[i+c]+(desired-pixels[i+c])*amount)))}count++;
 }return count;
}

export const hasTreatment=value=>Object.hasOwn(treatments,value||'');
export const toggleTreatment=(current,value)=>hasTreatment(value)?current===value?null:value:current;

export const shades={BL1:{name:'Branco intenso',rgb:[255,248,240]},BL2:{name:'Branco suave',rgb:[250,241,231]},A1:{name:'Natural claro',rgb:[243,229,220]}};
export const treatments={clareamento:'Clareamento',lentes:'Lentes'};
export function freshCase(patient=null){return {patient,photo:null,base:null,after:null,record:null,mouth:null,shade:null,procedure:null,intensity:55,compare:50,dirty:false}}
export function sameContext(a,b){return a.user===b.user&&a.epoch===b.epoch&&a.patient===b.patient}
export function replaceGeneration(records,record){return [record,...records.filter(r=>r.id!==record.id)].sort((a,b)=>b.created_at.localeCompare(a.created_at))}
// Every edit starts from the immutable AI base. Zero leaves every byte unchanged.
export function retone(pixels,mask,shade,intensity){const strength=Math.max(0,Math.min(100,Number(intensity)))/100,target=shades[shade]?.rgb||shades.BL1.rgb;if(!strength)return 0;let count=0;
 for(let p=0;p<mask.length;p++){const i=p*4,y=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2],coverage=mask[p]/255,shadow=Math.max(0,Math.min(1,(y-65)/80));if(coverage<.015||!shadow)continue;
  // A luminance curve preserves tooth shadows and specular highlights instead of filling a flat color.
  const detail=Math.max(.35,Math.min(1,y/225)),amount=coverage*strength*shadow*.85;
  for(let c=0;c<3;c++){const desired=Math.min(255,target[c]*detail+(pixels[i+c]-y)*.28);pixels[i+c]=Math.round(Math.max(0,Math.min(255,pixels[i+c]+(desired-pixels[i+c])*amount)))}count++;
 }return count;
}

export const hasTreatment=value=>Object.hasOwn(treatments,value||'');
export const toggleTreatment=(current,value)=>hasTreatment(value)?current===value?null:value:current;

import {SHADE_TREATMENTS} from '../../magic-hour/prompts.mjs';
export const BATCH_SHADES=Object.freeze(['BL1','BL2','A1']);
export const promptFor=(procedure,shade)=>SHADE_TREATMENTS[procedure]?.[shade];
export const batchGroup=record=>/^batch:([0-9a-f-]{36}):(BL1|BL2|A1)$/.exec(record?.source_id||'')?.[1]||null;
export const batchSource=(id,shade)=>`batch:${id}:${shade}`;
export const variantReady=(state)=>!!(state.patient&&state.photoBlob&&promptFor(state.procedure,state.shade));
export function assertVariant(reply,row){const config=promptFor(row.procedure,row.base_shade);if(reply.procedure!==row.procedure||reply.shade!==row.base_shade||reply.prompt_id!==config?.id||reply.request_id!==row.id)throw Error('A resposta não corresponde ao serviço e à tonalidade desta imagem. Consulte novamente sem gerar outra imagem.')}
// A persisted submission marker makes ambiguous failures poll-only, never an automatic paid retry.
export async function runVariant({row,repo,image,call,convert,onUpdate,onComplete,isLive,wait=ms=>new Promise(r=>setTimeout(r,ms)),attempts=60}){
 const remember=next=>{row=next;onUpdate(row);return row};
 if(row.status==='complete')return row;
 if(!row.job_ticket){
  if(row.status!=='draft'||row.last_error==='submission-started')throw Error(`${row.base_shade}: envio sem confirmação. Confira a Magic Hour antes de gerar outro conjunto.`);
  remember(await repo.update(row,{status:'processing',last_error:'submission-started'}));
  const job=await(await call('/v1/smile',{method:'POST',body:JSON.stringify({image,procedure:row.procedure,shade:row.base_shade,prompt_id:promptFor(row.procedure,row.base_shade).id,request_id:row.id,consent:true})})).json();
  if(!job.ticket)throw Error('A API não retornou a identificação da geração.');
  // Retain the ticket in memory before validating or persisting it.
  remember({...row,job_ticket:job.ticket});assertVariant(job,row);
  try{remember(await repo.update(row,{job_ticket:job.ticket,status:'processing',last_error:null}))}catch{/* The issued ticket remains available for polling. */}
 }
 for(let n=0;n<attempts;n++){
  if(!isLive())return row;
  const job=await(await call('/v1/smile',{headers:{'X-Job-Ticket':row.job_ticket}})).json();assertVariant(job,row);
  if(['error','canceled'].includes(job.status)){remember(await repo.update(row,{status:'error',last_error:job.error||'Falha na geração',job_ticket:null}));throw Error(`${row.base_shade}: ${job.error||'A geração falhou. Nenhum novo pedido foi enviado.'}`)}
  if(job.status==='complete'){
   const result=await(await call('/v1/smile/result',{headers:{'X-Job-Ticket':row.job_ticket}})).blob();if(result.size>8*1024*1024)throw Error('A imagem gerada ultrapassa 8 MB.');
   const png=await convert(result),path=await repo.upload(row.id,'base',png);
   try{remember(await repo.update(row,{base_path:path,current_path:path,status:'complete',job_ticket:null,intensity:0,mouth:null,last_error:null}))}catch(error){await repo.remove([path]);throw error}
   if(isLive())await onComplete(row,png);return row;
  }
  await wait(5000);
 }
 return row;
}

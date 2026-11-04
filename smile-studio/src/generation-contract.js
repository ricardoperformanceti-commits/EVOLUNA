export const PROMPT_IDS=Object.freeze({clareamento:'clareamento-bl1-v1',lentes:'lentes-bl1-v1'});
export function captureGeneration(state,context){
 const promptId=PROMPT_IDS[state.procedure];
 if(!promptId||!state.patient||!state.photoBlob)throw Error('Selecione um tratamento e adicione a foto antes de gerar.');
 return Object.freeze({...context,patient:state.patient,procedure:state.procedure,promptId,shade:'BL1',photoBlob:state.photoBlob});
}
export function matchesConfirmation(snapshot,state,context){
 return !!snapshot&&snapshot.user===context.user&&snapshot.epoch===context.epoch&&snapshot.patient===state.patient&&snapshot.photoBlob===state.photoBlob&&snapshot.procedure===state.procedure&&snapshot.promptId===PROMPT_IDS[state.procedure];
}
export function assertGenerationBinding(reply,snapshot,requestId,required=false){
 const hasBinding=reply.procedure!=null||reply.prompt_id!=null||reply.request_id!=null;
 // Historical tickets may lack binding metadata. Their owner is still checked by the server.
 if(!required&&!hasBinding)return;
 if(reply.procedure!==snapshot.procedure||reply.prompt_id!==snapshot.promptId||(required||reply.request_id!=null)&&reply.request_id!==requestId)throw Error('A resposta não corresponde ao tratamento confirmado. A geração não será associada a outro tratamento. Consulte novamente, sem gerar outra imagem.');
}

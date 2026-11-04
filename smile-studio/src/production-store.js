import {TrialStore} from './store.js';
const image=value=>/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value||'');
export class ProductionStore extends TrialStore{
 constructor(client,user,host){super(client,user,{bucket:'evoluna-smile',table:'evoluna_smile_generations'});this.host=host;this.legacy=new Map()}
 async patients(){return this.host.patients()}
 async list(patient){const saved=await super.list(patient),imported=new Set(saved.filter(r=>r.status==='complete').map(r=>r.source_id).filter(Boolean)),old=[];this.legacy.clear();
  for(const record of this.host.legacy(patient)){
   if(imported.has(record.id)||!image(record.photo))continue;
   const current=image(record.current)?record.current:record.photo,base=image(record.base)?record.base:current,id='legacy-'+record.id;
   const row={id,source_id:record.id,user_id:this.user,patient_id:patient,procedure:record.procedure==='clareamento'?'clareamento':'lentes',shade:['BL1','BL2','A1'].includes(record.shade)?record.shade:'BL1',base_shade:record.baseShade||record.shade||'BL1',intensity:record.intensity||0,status:'complete',original_path:id+':original',base_path:id+':base',current_path:id+':current',created_at:record.createdAt||record.date+'T12:00:00.000Z',revision:0};
   this.legacy.set(id,{row,original:record.photo,base,current});old.push(row);
  }
  return [...saved,...old].sort((a,b)=>b.created_at.localeCompare(a.created_at));
 }
 async blob(path){if(!path.startsWith('legacy-'))return super.blob(path);const split=path.lastIndexOf(':'),item=this.legacy.get(path.slice(0,split)),data=item?.[path.slice(split+1)];if(!image(data))throw Error('Imagem antiga indisponível.');const [header,encoded]=data.split(','),bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));return new Blob([bytes],{type:header.match(/data:([^;]+)/)[1]})}
 async signed(path,expires){if(path.startsWith('legacy-')){const split=path.lastIndexOf(':'),item=this.legacy.get(path.slice(0,split));return item?.[path.slice(split+1)]||''}return super.signed(path,expires)}
 async prepare(record){if(!record.id.startsWith('legacy-'))return record;
  const {data:existing,error}=await this.client.from(this.table).select('*').eq('source_id',record.source_id).maybeSingle();if(error)throw error;if(existing?.status==='complete')return existing;
  const id=existing?.id||crypto.randomUUID(),paths=[];let inserted=!!existing;
  try{const original=existing?.original_path||await this.upload(id,'original',await this.blob(record.original_path));if(!existing)paths.push(original);let row=existing||await this.insert({id,source_id:record.source_id,patient_id:record.patient_id,procedure:record.procedure,shade:record.shade,base_shade:record.base_shade,intensity:record.intensity,original_path:original,status:'draft'});inserted=true;
   const base=await this.upload(id,'base',await this.blob(record.base_path));paths.push(base);const current=await this.upload(id,'ajuste',await this.blob(record.current_path));paths.push(current);
   row=await this.update(row,{base_path:base,current_path:current,status:'complete'});return row;
  }catch(error){if(!inserted)await this.remove(paths);throw error}
 }
 async syncDocument(record){return this.host.syncDocument(record,this.user)}
 async share(record,channel){if(record.id.startsWith('legacy-'))return this.host.shareLegacy(record.source_id,channel);return this.host.share(record,channel)}
}

export const BUCKET='evoluna-smile-trial';
export const TABLE='evoluna_smile_trial_generations';
export class TrialStore{
 constructor(client,user,options={}){this.client=client;this.user=user;this.bucket=options.bucket||BUCKET;this.table=options.table||TABLE}
 async patients(){const {data,error}=await this.client.from('evoluna_patients').select('id,name,phone').order('name').limit(5000);if(error)throw error;return data||[]}
 async list(patient){const {data,error}=await this.client.from(this.table).select('*').eq('patient_id',patient).order('created_at',{ascending:false});if(error)throw error;return data||[]}
 async insert(record){const {data,error}=await this.client.from(this.table).insert({...record,user_id:this.user}).select().single();if(error)throw error;return data}
 async update(record,patch){const {data,error}=await this.client.from(this.table).update(patch).eq('id',record.id).eq('revision',record.revision).select().maybeSingle();if(error)throw error;if(!data)throw Error('Esta prévia foi alterada em outra aba. Abra-a novamente antes de salvar.');return data}
 async upload(id,kind,blob){if(blob.size>8*1024*1024)throw Error('A imagem ultrapassa 8 MB.');const ext=blob.type==='image/jpeg'?'jpg':'png',path=this.user+'/'+id+'/'+kind+'-'+crypto.randomUUID()+'.'+ext;const {error}=await this.client.storage.from(this.bucket).upload(path,blob,{upsert:false,contentType:blob.type,cacheControl:'0'});if(error)throw error;return path}
 async remove(paths){if(!paths.length)return;const {error}=await this.client.storage.from(this.bucket).remove(paths);if(error)console.warn('Não foi possível remover um arquivo temporário.')}
 async blob(path){const {data,error}=await this.client.storage.from(this.bucket).download(path);if(error)throw error;return data}
 async signed(path,expires=900){const {data,error}=await this.client.storage.from(this.bucket).createSignedUrl(path,expires);if(error)throw error;return data.signedUrl}
}

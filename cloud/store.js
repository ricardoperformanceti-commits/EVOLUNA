// The server derives ownership from the authenticated session, never a client user ID.
// Reads assemble relational records; compact saves remain one atomic transaction.
import {workspacePatch} from './patch.js';
export class WorkspaceStore{
 constructor(client,userId){this.client=client;this.userId=userId;this.baseline=null;this.revision=null;this.busy=false;this.conflict=false}
 async load(){const {data,error}=await this.client.rpc('evoluna_load_workspace');if(error)throw error;this.revision=data?.revision??null;this.conflict=false;this.baseline=data?.state?structuredClone(data.state):null;return data?.state??null}
 async create(state){const {data,error}=await this.client.rpc('evoluna_create_workspace',{p_state:JSON.parse(JSON.stringify(state))});if(error)throw error;if(!data)throw Error('Não foi possível criar seu espaço de dados.');this.revision=data.revision;this.conflict=false;this.baseline=structuredClone(data.state);return data.state}
 async save(state){if(this.busy)throw Error('Aguarde o salvamento em andamento.');if(this.conflict)throw Error('Carregue a versão salva antes de continuar.');if(this.revision===null)throw Error('Entre novamente para carregar seus dados.');this.busy=true;try{const snapshot=JSON.parse(JSON.stringify(state));const patch=this.baseline?workspacePatch(this.baseline,snapshot):null;const {data,error}=await this.client.rpc(patch?'evoluna_patch_workspace':'evoluna_save_workspace',patch?{p_patch:patch,p_expected_revision:this.revision}:{p_state:snapshot,p_expected_revision:this.revision});if(error)throw error;if(!data){this.conflict=true;throw Error('Outra aba ou dispositivo atualizou os dados. Sua alteração não foi enviada.')}this.revision=data.revision;this.baseline=snapshot;return true}finally{this.busy=false}}
}

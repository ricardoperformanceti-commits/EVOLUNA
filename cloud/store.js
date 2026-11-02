// The server derives ownership from the authenticated session, never a client user ID.
// Reads assemble the relational tables; saves update every module in one transaction.
export class WorkspaceStore{
 constructor(client,userId){this.client=client;this.userId=userId;this.revision=null;this.busy=false;this.conflict=false}
 async load(){const {data,error}=await this.client.rpc('evoluna_load_workspace');if(error)throw error;this.revision=data?.revision??null;this.conflict=false;return data?.state??null}
 async create(state){const {data,error}=await this.client.rpc('evoluna_create_workspace',{p_state:JSON.parse(JSON.stringify(state))});if(error)throw error;if(!data)throw Error('Não foi possível criar seu espaço de dados.');this.revision=data.revision;this.conflict=false;return data.state}
 async save(state){if(this.busy)throw Error('Aguarde o salvamento em andamento.');if(this.conflict)throw Error('Carregue a versão salva antes de continuar.');if(this.revision===null)throw Error('Entre novamente para carregar seus dados.');this.busy=true;try{const snapshot=JSON.parse(JSON.stringify(state));const {data,error}=await this.client.rpc('evoluna_save_workspace',{p_state:snapshot,p_expected_revision:this.revision});if(error)throw error;if(!data){this.conflict=true;throw Error('Outra aba ou dispositivo atualizou os dados. Sua alteração não foi enviada.')}this.revision=data.revision;return true}finally{this.busy=false}}
}

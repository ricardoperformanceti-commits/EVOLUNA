// Adapt a private command-edit document to the existing comparison and adjustment UI.
export function freeEditRow(edit){
 if(edit.state!=='complete'||!edit.current_path)return null;
 return {id:edit.id,user_id:edit.user_id,patient_id:edit.patient_id,procedure:edit.procedure,shade:edit.shade,base_shade:edit.base_shade||edit.shade,intensity:edit.intensity||0,mouth:edit.mouth||null,status:'complete',original_path:edit.original_path,base_path:edit.base_path||edit.current_path,current_path:edit.current_path,created_at:edit.created_at,revision:0,free_edit:true,free_edit_record:{...edit}};
}

-- Cache each collection and its IDs before deletion. Do not rescan image-bearing
-- JSON arrays once per saved row. Preserve the installed chat-compatible version.
do $migration$
declare definition text; original text;
begin
 select pg_get_functiondef('evoluna_internal.sync_modules(uuid,jsonb)'::regprocedure) into definition;
 if position('collection_state jsonb' in definition)=0 then
  original := definition;
  definition := replace(definition,'clinical jsonb;','clinical jsonb; collection_state jsonb; item_ids text[];');
  definition := replace(definition, E'  if p_state ? collection and jsonb_typeof(p_state->collection)', E'  collection_state := coalesce(p_state->collection,''[]''::jsonb);\n  if p_state ? collection and jsonb_typeof(p_state->collection)');
  definition := replace(definition,'coalesce(p_state->collection,''[]'')','collection_state');
  definition := replace(definition, E'  execute format(''delete from public.%I t where t.user_id=$1 and not exists(select 1 from jsonb_array_elements(coalesce($2,''''[]''''::jsonb)) v where v->>''''id''''=t.id)'',target) using p_user,p_state->collection;', E'  select coalesce(array_agg(v->>''id''),''{}''::text[]) into item_ids from jsonb_array_elements(collection_state) v;\n  execute format(''delete from public.%I t where t.user_id=$1 and t.id<>all($2)'',target) using p_user,item_ids;');
  definition := replace(definition,'using p_user,p_state->collection;','using p_user,collection_state;');
  if definition=original or position('into item_ids' in definition)=0 or position('collection_state := ' in definition)=0 then
   raise exception 'A sincronização instalada não corresponde à versão esperada. Nenhuma alteração aplicada.';
  end if;
  execute definition;
 end if;
end;$migration$;
-- Bounded exception for these authenticated write RPCs, not a global timeout.
-- Ownership, RLS, expected revisions and the 16 MiB limit remain in force.
alter function public.evoluna_save_workspace(jsonb,bigint) set statement_timeout='30s';
alter function public.evoluna_create_workspace(jsonb) set statement_timeout='30s';
notify pgrst, 'reload schema';

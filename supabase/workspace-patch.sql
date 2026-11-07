CREATE OR REPLACE FUNCTION evoluna_internal.sync_modules_delta(p_user uuid, p_state jsonb, p_previous jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare collection text; target text; item jsonb; n bigint; clinical jsonb; collection_state jsonb; item_ids text[];
begin
 if (auth.uid() is not null and auth.uid()<>p_user)
    or (auth.uid() is null and coalesce(current_setting('role',true),'') in ('anon','authenticated'))
    or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Acesso negado' using errcode='42501';
 end if;
 for collection,target in select * from (values
 ('patients','evoluna_patients'),('appointments','evoluna_appointments'),
 ('documents','evoluna_documents'),('transactions','evoluna_financial_entries'),
 ('simulations','evoluna_smile_simulations'),('sessions','evoluna_consultation_sessions')) as m(k,t)
 loop
  if p_previous is not null and (p_state->collection) is not distinct from (p_previous->collection) then continue; end if;
  collection_state := coalesce(p_state->collection,'[]'::jsonb);
  if p_state ? collection and jsonb_typeof(p_state->collection)<>'array' then
   raise exception 'Coleção inválida: %',collection using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(collection_state) v
     where jsonb_typeof(v)<>'object' or jsonb_typeof(v->'id') is distinct from 'string' or length(v->>'id') not between 1 and 160) then
   raise exception 'Registro inválido: %',collection using errcode='22023';
  end if;
  if (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(collection_state) v) then
   raise exception 'Identificador duplicado: %',collection using errcode='22023';
  end if;
  if collection='patients' then
   insert into public.evoluna_patients(user_id,id,position,data)
   select p_user,v->>'id',(ord-1)::integer,v-array['history','treatments','carePlans','anamnesis','teeth','toothDetails']
   from jsonb_array_elements(coalesce(p_state->'patients','[]')) with ordinality a(v,ord)
   on conflict(user_id,id) do update set position=excluded.position,data=excluded.data,updated_at=now()
   where (evoluna_patients.position,evoluna_patients.data) is distinct from (excluded.position,excluded.data);
  elsif collection='sessions' then
   insert into public.evoluna_consultation_sessions(user_id,id,position,data,collection_keys)
   select p_user,v->>'id',(ord-1)::integer,v-array['entries','draft'],array(select k from jsonb_object_keys(v) k where k in ('entries','draft') order by k)
   from jsonb_array_elements(coalesce(p_state->'sessions','[]')) with ordinality a(v,ord)
   on conflict(user_id,id) do update set position=excluded.position,data=excluded.data,collection_keys=excluded.collection_keys,updated_at=now()
   where (evoluna_consultation_sessions.position,evoluna_consultation_sessions.data,evoluna_consultation_sessions.collection_keys)
    is distinct from (excluded.position,excluded.data,excluded.collection_keys);
  else
   execute format('insert into public.%I(user_id,id,position,data) select $1,v->>''id'',(ord-1)::integer,v from jsonb_array_elements(coalesce($2,''[]''::jsonb)) with ordinality a(v,ord) on conflict(user_id,id) do update set position=excluded.position,data=excluded.data,updated_at=now() where (%I.position,%I.data) is distinct from (excluded.position,excluded.data)',target,target,target)
    using p_user,collection_state;
  end if;
  select coalesce(array_agg(v->>'id'),'{}'::text[]) into item_ids from jsonb_array_elements(collection_state) v;
  execute format('delete from public.%I t where t.user_id=$1 and t.id<>all($2)',target) using p_user,item_ids;
 end loop;
 for item in select v from jsonb_array_elements(p_state->'patients') v loop
  if p_previous is not null and exists(select 1 from jsonb_array_elements(p_previous->'patients') old_item where old_item->>'id'=item->>'id' and old_item=item) then continue;end if;
  clinical := coalesce((select jsonb_object_agg(k,v) from jsonb_each(item) a(k,v) where k in ('anamnesis','teeth','toothDetails')),'{}');
  insert into public.evoluna_patient_records(user_id,patient_id,data,collection_keys)
  values(p_user,item->>'id',clinical,array(select k from jsonb_object_keys(item) k where k in ('history','treatments','carePlans') order by k))
  on conflict(user_id,patient_id) do update set data=excluded.data,collection_keys=excluded.collection_keys,updated_at=now()
  where (evoluna_patient_records.data,evoluna_patient_records.collection_keys) is distinct from (excluded.data,excluded.collection_keys);
  for collection,target in select * from (values ('history','evoluna_clinical_entries'),('treatments','evoluna_treatments'),('carePlans','evoluna_care_plans')) m(k,t) loop
   if item ? collection and jsonb_typeof(item->collection)<>'array' then raise exception 'Lista clínica inválida: %',collection using errcode='22023';end if;
   execute format('insert into public.%I(user_id,patient_id,position,data) select $1,$2,(ord-1)::integer,v from jsonb_array_elements(coalesce($3,''[]''::jsonb)) with ordinality a(v,ord) on conflict(user_id,patient_id,position) do update set data=excluded.data,updated_at=now() where %I.data is distinct from excluded.data',target,target) using p_user,item->>'id',item->collection;
   execute format('delete from public.%I where user_id=$1 and patient_id=$2 and position>=jsonb_array_length(coalesce($3,''[]''::jsonb))',target) using p_user,item->>'id',item->collection;
  end loop;
 end loop;
 for item in select v from jsonb_array_elements(coalesce(p_state->'sessions','[]')) v loop
  if p_previous is not null and exists(select 1 from jsonb_array_elements(p_previous->'sessions') old_item where old_item->>'id'=item->>'id' and old_item=item) then continue;end if;
  if item ? 'entries' and jsonb_typeof(item->'entries')<>'array' then raise exception 'Anotações inválidas' using errcode='22023';end if;
  insert into public.evoluna_session_entries(user_id,session_id,position,data)
  select p_user,item->>'id',(ord-1)::integer,v from jsonb_array_elements(coalesce(item->'entries','[]')) with ordinality a(v,ord)
  on conflict(user_id,session_id,position) do update set data=excluded.data,updated_at=now() where evoluna_session_entries.data is distinct from excluded.data;
  delete from public.evoluna_session_entries where user_id=p_user and session_id=item->>'id' and position>=jsonb_array_length(coalesce(item->'entries','[]'));
  if item ? 'draft' then
   insert into public.evoluna_session_drafts(user_id,session_id,data) values(p_user,item->>'id',item->'draft')
   on conflict(user_id,session_id) do update set data=excluded.data,updated_at=now() where evoluna_session_drafts.data is distinct from excluded.data;
  else delete from public.evoluna_session_drafts where user_id=p_user and session_id=item->>'id';end if;
 end loop;
 if p_state ? 'activity' and jsonb_typeof(p_state->'activity')<>'array' then raise exception 'Atividades inválidas' using errcode='22023';end if;
 insert into public.evoluna_activity_log(user_id,position,data)
 select p_user,(ord-1)::integer,v from jsonb_array_elements(coalesce(p_state->'activity','[]')) with ordinality a(v,ord)
 on conflict(user_id,position) do update set data=excluded.data,updated_at=now() where evoluna_activity_log.data is distinct from excluded.data;
 delete from public.evoluna_activity_log where user_id=p_user and position>=jsonb_array_length(coalesce(p_state->'activity','[]'));
 insert into public.evoluna_clinic_settings(user_id,data) values(p_user,p_state->'settings')
 on conflict(user_id) do update set data=excluded.data,updated_at=now() where evoluna_clinic_settings.data is distinct from excluded.data;
 insert into public.evoluna_workspace_metadata(user_id,data,collection_keys)
 values(p_user,p_state-array['patients','appointments','documents','transactions','simulations','sessions','activity','settings'],array(select k from jsonb_object_keys(p_state) k where k in ('patients','appointments','documents','transactions','simulations','sessions','activity') order by k))
 on conflict(user_id) do update set data=excluded.data,collection_keys=excluded.collection_keys,updated_at=now()
 where (evoluna_workspace_metadata.data,evoluna_workspace_metadata.collection_keys) is distinct from (excluded.data,excluded.collection_keys);
end;$function$;
revoke all on function evoluna_internal.sync_modules_delta(uuid,jsonb,jsonb) from public,anon,authenticated;

create or replace function evoluna_internal.workspace_modules_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
  perform evoluna_internal.sync_modules_delta(new.user_id,new.state,old.state);
 else
  perform evoluna_internal.sync_modules(new.user_id,new.state);
 end if;
 return new;
end;$$;

-- Compact writes retain RLS, atomicity and expected revisions. No owner argument.
create or replace function public.evoluna_patch_workspace(p_patch jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' set statement_timeout='30s' as $$
declare current_state jsonb; change jsonb; path text[]; parent jsonb; kind text; saved_revision bigint;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Entre na sua conta' using errcode='42501';
 end if;
 if jsonb_typeof(p_patch) is distinct from 'array' or jsonb_array_length(p_patch)>10000 then
  raise exception 'Alterações inválidas' using errcode='22023';
 end if;
 select state into current_state from public.evoluna_workspaces
 where user_id=(select auth.uid()) and revision=p_expected_revision for update;
 if not found then return null;end if;
 for change in select value from jsonb_array_elements(p_patch) loop
  if jsonb_typeof(change->'path') is distinct from 'array'
   or jsonb_array_length(change->'path') not between 1 and 64
   or exists(select 1 from jsonb_array_elements(change->'path') v where jsonb_typeof(v)<>'string') then
   raise exception 'Caminho inválido' using errcode='22023';
  end if;
  select array_agg(v order by ord) into path from jsonb_array_elements_text(change->'path') with ordinality a(v,ord);
  parent:=current_state #> path[1:cardinality(path)-1];
  kind:=jsonb_typeof(parent);
  if kind is null or kind not in ('object','array') then raise exception 'Caminho inexistente' using errcode='22023';end if;
  if kind='array' then
   if path[cardinality(path)]!~'^(0|[1-9][0-9]{0,8})$' then raise exception 'Índice inválido' using errcode='22023';end if;
   if path[cardinality(path)]::integer>jsonb_array_length(parent)
    or (change->>'op'<>'insert' and path[cardinality(path)]::integer>=jsonb_array_length(parent)) then
    raise exception 'Índice inexistente' using errcode='22023';
   end if;
  end if;
  case change->>'op'
  when 'set' then
   if not change ? 'value' then raise exception 'Valor ausente' using errcode='22023';end if;
   current_state:=jsonb_set(current_state,path,change->'value',true);
  when 'remove' then
   if current_state #> path is null then raise exception 'Registro inexistente' using errcode='22023';end if;
   current_state:=current_state #- path;
  when 'insert' then
   if kind<>'array' or not change ? 'value' then raise exception 'Inserção inválida' using errcode='22023';end if;
   current_state:=jsonb_insert(current_state,path,change->'value',false);
  else raise exception 'Operação inválida' using errcode='22023';
  end case;
 end loop;
 update public.evoluna_workspaces set state=current_state
 where user_id=(select auth.uid()) and revision=p_expected_revision returning revision into saved_revision;
 if not found then return null;end if;
 return jsonb_build_object('revision',saved_revision);
end;$$;
revoke all on function public.evoluna_patch_workspace(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.evoluna_patch_workspace(jsonb,bigint) to authenticated;
notify pgrst,'reload schema';

-- Private history for the consultation chat. No public guest access to the database.
lock table public.evoluna_workspaces in share row exclusive mode;
create table public.evoluna_session_messages (
 user_id uuid not null,session_id text not null,id text not null check(length(id) between 1 and 100),
 position integer not null check(position>=0),data jsonb not null check(jsonb_typeof(data)='object'),
 sender text generated always as (data->>'from') stored,
 channel text generated always as (data->>'channel') stored,
 body text generated always as (data->>'text') stored,
 sent_at text generated always as (data->>'createdAt') stored,
 delivery_state text generated always as (data->>'status') stored,
 updated_at timestamptz not null default now(),primary key(user_id,session_id,id),
 foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) on delete cascade
);
alter table public.evoluna_session_messages enable row level security;
revoke all on public.evoluna_session_messages from public,anon,authenticated;
grant select on public.evoluna_session_messages to authenticated;
create policy evoluna_session_messages_read_own on public.evoluna_session_messages for select to authenticated
 using(user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
create or replace function evoluna_internal.sync_modules(p_user uuid,p_state jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare collection text; target text; item jsonb; n bigint; clinical jsonb;
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
  if p_state ? collection and jsonb_typeof(p_state->collection)<>'array' then
   raise exception 'Coleção inválida: %',collection using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_state->collection,'[]')) v
     where jsonb_typeof(v)<>'object' or jsonb_typeof(v->'id') is distinct from 'string' or length(v->>'id') not between 1 and 160) then
   raise exception 'Registro inválido: %',collection using errcode='22023';
  end if;
  if (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(coalesce(p_state->collection,'[]')) v) then
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
   select p_user,v->>'id',(ord-1)::integer,v-array['entries','draft','messages'],array(select k from jsonb_object_keys(v) k where k in ('entries','draft','messages') order by k)
   from jsonb_array_elements(coalesce(p_state->'sessions','[]')) with ordinality a(v,ord)
   on conflict(user_id,id) do update set position=excluded.position,data=excluded.data,collection_keys=excluded.collection_keys,updated_at=now()
   where (evoluna_consultation_sessions.position,evoluna_consultation_sessions.data,evoluna_consultation_sessions.collection_keys)
    is distinct from (excluded.position,excluded.data,excluded.collection_keys);
  else
   execute format('insert into public.%I(user_id,id,position,data) select $1,v->>''id'',(ord-1)::integer,v from jsonb_array_elements(coalesce($2,''[]''::jsonb)) with ordinality a(v,ord) on conflict(user_id,id) do update set position=excluded.position,data=excluded.data,updated_at=now() where (%I.position,%I.data) is distinct from (excluded.position,excluded.data)',target,target,target)
    using p_user,p_state->collection;
  end if;
  execute format('delete from public.%I t where t.user_id=$1 and not exists(select 1 from jsonb_array_elements(coalesce($2,''[]''::jsonb)) v where v->>''id''=t.id)',target) using p_user,p_state->collection;
 end loop;
 for item in select v from jsonb_array_elements(p_state->'patients') v loop
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
  if item ? 'entries' and jsonb_typeof(item->'entries')<>'array' then raise exception 'Anotações inválidas' using errcode='22023';end if;
  insert into public.evoluna_session_entries(user_id,session_id,position,data)
  select p_user,item->>'id',(ord-1)::integer,v from jsonb_array_elements(coalesce(item->'entries','[]')) with ordinality a(v,ord)
  on conflict(user_id,session_id,position) do update set data=excluded.data,updated_at=now() where evoluna_session_entries.data is distinct from excluded.data;
  delete from public.evoluna_session_entries where user_id=p_user and session_id=item->>'id' and position>=jsonb_array_length(coalesce(item->'entries','[]'));
  if item ? 'draft' then
   insert into public.evoluna_session_drafts(user_id,session_id,data) values(p_user,item->>'id',item->'draft')
   on conflict(user_id,session_id) do update set data=excluded.data,updated_at=now() where evoluna_session_drafts.data is distinct from excluded.data;
  else delete from public.evoluna_session_drafts where user_id=p_user and session_id=item->>'id';end if;
  if item ? 'messages' and jsonb_typeof(item->'messages')<>'array' then raise exception 'Mensagens inválidas' using errcode='22023';end if;
  if exists(select 1 from jsonb_array_elements(coalesce(item->'messages','[]')) v where jsonb_typeof(v)<>'object' or jsonb_typeof(v->'id') is distinct from 'string' or length(v->>'id') not between 1 and 100)
   or (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(coalesce(item->'messages','[]')) v) then raise exception 'Identificador de mensagem inválido ou duplicado' using errcode='22023';end if;
  insert into public.evoluna_session_messages(user_id,session_id,id,position,data)
  select p_user,item->>'id',v->>'id',(ord-1)::integer,v from jsonb_array_elements(coalesce(item->'messages','[]')) with ordinality a(v,ord)
  on conflict(user_id,session_id,id) do update set position=excluded.position,data=excluded.data,updated_at=now()
  where (evoluna_session_messages.position,evoluna_session_messages.data) is distinct from (excluded.position,excluded.data);
  delete from public.evoluna_session_messages m where m.user_id=p_user and m.session_id=item->>'id'
   and not exists(select 1 from jsonb_array_elements(coalesce(item->'messages','[]')) v where v->>'id'=m.id);
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
end;$$;
revoke all on function evoluna_internal.sync_modules(uuid,jsonb) from public,anon,authenticated;
create or replace function public.evoluna_load_workspace() returns jsonb
language sql stable security invoker set search_path='' as $$
select jsonb_build_object('revision',w.revision,'state',m.data || jsonb_build_object('settings',c.data) ||
 coalesce((select jsonb_object_agg(k,v) from (values ('patients',coalesce((select jsonb_agg(p.data || r.data || coalesce((select jsonb_object_agg(k,v) from (values ('history',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_clinical_entries c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb)),('treatments',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_treatments c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb)),('carePlans',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_care_plans c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb))) collections(k,v) where k=any(r.collection_keys)),'{}'::jsonb) order by p.position)
from public.evoluna_patients p join public.evoluna_patient_records r on r.user_id=p.user_id and r.patient_id=p.id where p.user_id=w.user_id),'[]'::jsonb)),('appointments',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_appointments t where t.user_id=w.user_id),'[]'::jsonb)),('documents',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_documents t where t.user_id=w.user_id),'[]'::jsonb)),('transactions',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_financial_entries t where t.user_id=w.user_id),'[]'::jsonb)),('simulations',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_smile_simulations t where t.user_id=w.user_id),'[]'::jsonb)),('sessions',coalesce((select jsonb_agg(s.data
 || case when 'entries'=any(s.collection_keys) then jsonb_build_object('entries',coalesce((select jsonb_agg(e.data order by e.position) from public.evoluna_session_entries e where e.user_id=s.user_id and e.session_id=s.id),'[]'::jsonb)) else '{}'::jsonb end
 || case when 'draft'=any(s.collection_keys) then jsonb_build_object('draft',d.data) else '{}'::jsonb end
 || case when 'messages'=any(s.collection_keys) then jsonb_build_object('messages',coalesce((select jsonb_agg(msg.data order by msg.position) from public.evoluna_session_messages msg where msg.user_id=s.user_id and msg.session_id=s.id),'[]'::jsonb)) else '{}'::jsonb end order by s.position)
from public.evoluna_consultation_sessions s left join public.evoluna_session_drafts d on d.user_id=s.user_id and d.session_id=s.id where s.user_id=w.user_id),'[]'::jsonb)),('activity',coalesce((select jsonb_agg(a.data order by a.position) from public.evoluna_activity_log a where a.user_id=w.user_id),'[]'::jsonb))) collections(k,v) where k=any(m.collection_keys)),'{}'::jsonb))
from public.evoluna_workspaces w
join public.evoluna_workspace_metadata m on m.user_id=w.user_id
join public.evoluna_clinic_settings c on c.user_id=w.user_id
where w.user_id=(select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true';
$$;

select evoluna_internal.sync_modules(user_id,state) from public.evoluna_workspaces;
notify pgrst,'reload schema';

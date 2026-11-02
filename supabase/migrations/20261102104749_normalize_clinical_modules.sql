-- Additive migration. The legacy snapshot is retained for rollback and old clients.
-- All new reads use relational records; every save synchronizes records atomically.
create schema if not exists evoluna_internal;
revoke all on schema evoluna_internal from public, anon, authenticated;
lock table public.evoluna_workspaces in share row exclusive mode;
create table public.evoluna_patients (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 name text generated always as (data->>'name') stored,
 cpf text generated always as (data->>'cpf') stored,
 email text generated always as (data->>'email') stored,
 phone text generated always as (data->>'phone') stored,
 birth_date text generated always as (data->>'birth') stored,
 status text generated always as (data->>'status') stored
);
create table public.evoluna_appointments (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 patient_id text generated always as (nullif(data->>'patient','')) stored,
 status text generated always as (data->>'status') stored,
 record_date text generated always as (data->>'date') stored,
 start_time text generated always as (data->>'time') stored,
 professional text generated always as (data->>'professional') stored
);
alter table public.evoluna_appointments add constraint evoluna_appointments_patient_fkey foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) deferrable initially deferred;
create index evoluna_appointments_patient_idx on public.evoluna_appointments(user_id,patient_id);
create index evoluna_appointments_date_idx on public.evoluna_appointments(user_id,record_date);
create table public.evoluna_documents (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 patient_id text generated always as (nullif(data->>'patient','')) stored,
 status text generated always as (data->>'status') stored,
 record_date text generated always as (data->>'date') stored
);
alter table public.evoluna_documents add constraint evoluna_documents_patient_fkey foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) deferrable initially deferred;
create index evoluna_documents_patient_idx on public.evoluna_documents(user_id,patient_id);
create index evoluna_documents_date_idx on public.evoluna_documents(user_id,record_date);
create table public.evoluna_financial_entries (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 patient_id text generated always as (nullif(data->>'patient','')) stored,
 status text generated always as (data->>'status') stored,
 record_date text generated always as (data->>'date') stored,
 amount numeric generated always as (case when jsonb_typeof(data->'value')='number' then (data->>'value')::numeric end) stored,
 kind text generated always as (data->>'kind') stored
);
alter table public.evoluna_financial_entries add constraint evoluna_financial_entries_patient_fkey foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) deferrable initially deferred;
create index evoluna_financial_entries_patient_idx on public.evoluna_financial_entries(user_id,patient_id);
create index evoluna_financial_entries_date_idx on public.evoluna_financial_entries(user_id,record_date);
create table public.evoluna_smile_simulations (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 patient_id text generated always as (nullif(data->>'patient','')) stored,
 status text generated always as (data->>'status') stored,
 record_date text generated always as (data->>'date') stored
);
alter table public.evoluna_smile_simulations add constraint evoluna_smile_simulations_patient_fkey foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) deferrable initially deferred;
create index evoluna_smile_simulations_patient_idx on public.evoluna_smile_simulations(user_id,patient_id);
create index evoluna_smile_simulations_date_idx on public.evoluna_smile_simulations(user_id,record_date);
create table public.evoluna_consultation_sessions (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 id text not null check (length(id) between 1 and 160),
 position integer not null check (position >= 0),
 data jsonb not null check (jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(),
 primary key(user_id,id),
 patient_id text generated always as (nullif(data->>'patient','')) stored,
 status text generated always as (data->>'status') stored,
 record_date text generated always as (data->>'date') stored,
 collection_keys text[] not null default '{}',
 appointment_id text generated always as (nullif(data->>'appointment','')) stored
);
alter table public.evoluna_consultation_sessions add constraint evoluna_consultation_sessions_patient_fkey foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) deferrable initially deferred;
create index evoluna_consultation_sessions_patient_idx on public.evoluna_consultation_sessions(user_id,patient_id);
alter table public.evoluna_consultation_sessions add constraint evoluna_sessions_appointment_fkey foreign key(user_id,appointment_id) references public.evoluna_appointments(user_id,id) deferrable initially deferred;
create index evoluna_sessions_appointment_idx on public.evoluna_consultation_sessions(user_id,appointment_id);
create table public.evoluna_patient_records (
 user_id uuid not null, patient_id text not null,
 data jsonb not null check(jsonb_typeof(data)='object'), collection_keys text[] not null,
 updated_at timestamptz not null default now(), primary key(user_id,patient_id),
 foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) on delete cascade
);
create table public.evoluna_clinical_entries (
 user_id uuid not null, patient_id text not null, position integer not null check(position>=0),
 data jsonb not null check(jsonb_typeof(data)='object'),
 record_id text generated always as (data->>'id') stored,
 updated_at timestamptz not null default now(), primary key(user_id,patient_id,position),
 foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) on delete cascade
);
create table public.evoluna_treatments (
 user_id uuid not null, patient_id text not null, position integer not null check(position>=0),
 data jsonb not null check(jsonb_typeof(data)='object'),
 record_id text generated always as (data->>'id') stored,
 updated_at timestamptz not null default now(), primary key(user_id,patient_id,position),
 foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) on delete cascade
);
create table public.evoluna_care_plans (
 user_id uuid not null, patient_id text not null, position integer not null check(position>=0),
 data jsonb not null check(jsonb_typeof(data)='object'),
 record_id text generated always as (data->>'id') stored,
 updated_at timestamptz not null default now(), primary key(user_id,patient_id,position),
 foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) on delete cascade
);
create table public.evoluna_session_entries (
 user_id uuid not null, session_id text not null, position integer not null check(position>=0),
 data jsonb not null check(jsonb_typeof(data)='object'),
 record_id text generated always as (data->>'recordId') stored,
 updated_at timestamptz not null default now(), primary key(user_id,session_id,position),
 foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) on delete cascade
);
create table public.evoluna_session_drafts (
 user_id uuid not null, session_id text not null, data jsonb not null,
 updated_at timestamptz not null default now(), primary key(user_id,session_id),
 foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) on delete cascade
);
create table public.evoluna_clinic_settings (
 user_id uuid primary key references public.evoluna_workspaces(user_id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object'), updated_at timestamptz not null default now()
);
create table public.evoluna_activity_log (
 user_id uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 position integer not null check(position>=0), data jsonb not null check(jsonb_typeof(data)='object'),
 updated_at timestamptz not null default now(), primary key(user_id,position)
);
create table public.evoluna_workspace_metadata (
 user_id uuid primary key references public.evoluna_workspaces(user_id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object'), collection_keys text[] not null,
 updated_at timestamptz not null default now()
);
alter table public.evoluna_patients enable row level security;
revoke all on public.evoluna_patients from public, anon, authenticated;
grant select on public.evoluna_patients to authenticated;
create policy evoluna_patients_read_own on public.evoluna_patients for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_appointments enable row level security;
revoke all on public.evoluna_appointments from public, anon, authenticated;
grant select on public.evoluna_appointments to authenticated;
create policy evoluna_appointments_read_own on public.evoluna_appointments for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_documents enable row level security;
revoke all on public.evoluna_documents from public, anon, authenticated;
grant select on public.evoluna_documents to authenticated;
create policy evoluna_documents_read_own on public.evoluna_documents for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_financial_entries enable row level security;
revoke all on public.evoluna_financial_entries from public, anon, authenticated;
grant select on public.evoluna_financial_entries to authenticated;
create policy evoluna_financial_entries_read_own on public.evoluna_financial_entries for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_smile_simulations enable row level security;
revoke all on public.evoluna_smile_simulations from public, anon, authenticated;
grant select on public.evoluna_smile_simulations to authenticated;
create policy evoluna_smile_simulations_read_own on public.evoluna_smile_simulations for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_consultation_sessions enable row level security;
revoke all on public.evoluna_consultation_sessions from public, anon, authenticated;
grant select on public.evoluna_consultation_sessions to authenticated;
create policy evoluna_consultation_sessions_read_own on public.evoluna_consultation_sessions for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_clinical_entries enable row level security;
revoke all on public.evoluna_clinical_entries from public, anon, authenticated;
grant select on public.evoluna_clinical_entries to authenticated;
create policy evoluna_clinical_entries_read_own on public.evoluna_clinical_entries for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_treatments enable row level security;
revoke all on public.evoluna_treatments from public, anon, authenticated;
grant select on public.evoluna_treatments to authenticated;
create policy evoluna_treatments_read_own on public.evoluna_treatments for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_care_plans enable row level security;
revoke all on public.evoluna_care_plans from public, anon, authenticated;
grant select on public.evoluna_care_plans to authenticated;
create policy evoluna_care_plans_read_own on public.evoluna_care_plans for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_patient_records enable row level security;
revoke all on public.evoluna_patient_records from public, anon, authenticated;
grant select on public.evoluna_patient_records to authenticated;
create policy evoluna_patient_records_read_own on public.evoluna_patient_records for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_session_entries enable row level security;
revoke all on public.evoluna_session_entries from public, anon, authenticated;
grant select on public.evoluna_session_entries to authenticated;
create policy evoluna_session_entries_read_own on public.evoluna_session_entries for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_session_drafts enable row level security;
revoke all on public.evoluna_session_drafts from public, anon, authenticated;
grant select on public.evoluna_session_drafts to authenticated;
create policy evoluna_session_drafts_read_own on public.evoluna_session_drafts for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_clinic_settings enable row level security;
revoke all on public.evoluna_clinic_settings from public, anon, authenticated;
grant select on public.evoluna_clinic_settings to authenticated;
create policy evoluna_clinic_settings_read_own on public.evoluna_clinic_settings for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_activity_log enable row level security;
revoke all on public.evoluna_activity_log from public, anon, authenticated;
grant select on public.evoluna_activity_log to authenticated;
create policy evoluna_activity_log_read_own on public.evoluna_activity_log for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_workspace_metadata enable row level security;
revoke all on public.evoluna_workspace_metadata from public, anon, authenticated;
grant select on public.evoluna_workspace_metadata to authenticated;
create policy evoluna_workspace_metadata_read_own on public.evoluna_workspace_metadata for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
alter table public.evoluna_documents add column session_id text generated always as (nullif(data->>'sessionId','')) stored;
alter table public.evoluna_documents add column appointment_id text generated always as (nullif(data->>'appointmentId','')) stored;
alter table public.evoluna_documents add constraint evoluna_documents_session_fkey foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) deferrable initially deferred;
alter table public.evoluna_documents add constraint evoluna_documents_appointment_fkey foreign key(user_id,appointment_id) references public.evoluna_appointments(user_id,id) deferrable initially deferred;
create index evoluna_documents_session_idx on public.evoluna_documents(user_id,session_id);
create index evoluna_documents_appointment_idx on public.evoluna_documents(user_id,appointment_id);
alter table public.evoluna_clinical_entries add column session_id text generated always as (nullif(data->>'sessionId','')) stored;
alter table public.evoluna_clinical_entries add column appointment_id text generated always as (nullif(data->>'appointmentId','')) stored;
alter table public.evoluna_clinical_entries add constraint evoluna_clinical_entries_session_fkey foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) deferrable initially deferred;
alter table public.evoluna_clinical_entries add constraint evoluna_clinical_entries_appointment_fkey foreign key(user_id,appointment_id) references public.evoluna_appointments(user_id,id) deferrable initially deferred;
create index evoluna_clinical_entries_session_idx on public.evoluna_clinical_entries(user_id,session_id);
create index evoluna_clinical_entries_appointment_idx on public.evoluna_clinical_entries(user_id,appointment_id);
alter table public.evoluna_care_plans add column session_id text generated always as (nullif(data->>'sessionId','')) stored;
alter table public.evoluna_care_plans add column appointment_id text generated always as (nullif(data->>'appointmentId','')) stored;
alter table public.evoluna_care_plans add constraint evoluna_care_plans_session_fkey foreign key(user_id,session_id) references public.evoluna_consultation_sessions(user_id,id) deferrable initially deferred;
alter table public.evoluna_care_plans add constraint evoluna_care_plans_appointment_fkey foreign key(user_id,appointment_id) references public.evoluna_appointments(user_id,id) deferrable initially deferred;
create index evoluna_care_plans_session_idx on public.evoluna_care_plans(user_id,session_id);
create index evoluna_care_plans_appointment_idx on public.evoluna_care_plans(user_id,appointment_id);
-- This internal definer is only called by the workspace trigger or database owner.
-- Direct writes to projection tables are deliberately unavailable to API roles.
create function evoluna_internal.sync_modules(p_user uuid,p_state jsonb) returns void
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
   select p_user,v->>'id',(ord-1)::integer,v-array['entries','draft'],array(select k from jsonb_object_keys(v) k where k in ('entries','draft') order by k)
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
create function evoluna_internal.workspace_modules_trigger() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform evoluna_internal.sync_modules(new.user_id,new.state);
 return new;
end;$$;
revoke all on function evoluna_internal.workspace_modules_trigger() from public,anon,authenticated;
create trigger evoluna_sync_modules after insert or update of state on public.evoluna_workspaces
for each row execute function evoluna_internal.workspace_modules_trigger();
-- Backfill while the workspace table is locked. No patient identifiers are hardcoded.
select evoluna_internal.sync_modules(user_id,state) from public.evoluna_workspaces;
create function public.evoluna_load_workspace() returns jsonb
language sql stable security invoker set search_path='' as $$
select jsonb_build_object('revision',w.revision,'state',m.data || jsonb_build_object('settings',c.data) ||
 coalesce((select jsonb_object_agg(k,v) from (values ('patients',coalesce((select jsonb_agg(p.data || r.data || coalesce((select jsonb_object_agg(k,v) from (values ('history',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_clinical_entries c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb)),('treatments',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_treatments c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb)),('carePlans',coalesce((select jsonb_agg(c.data order by c.position) from public.evoluna_care_plans c where c.user_id=p.user_id and c.patient_id=p.id),'[]'::jsonb))) collections(k,v) where k=any(r.collection_keys)),'{}'::jsonb) order by p.position)
from public.evoluna_patients p join public.evoluna_patient_records r on r.user_id=p.user_id and r.patient_id=p.id where p.user_id=w.user_id),'[]'::jsonb)),('appointments',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_appointments t where t.user_id=w.user_id),'[]'::jsonb)),('documents',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_documents t where t.user_id=w.user_id),'[]'::jsonb)),('transactions',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_financial_entries t where t.user_id=w.user_id),'[]'::jsonb)),('simulations',coalesce((select jsonb_agg(t.data order by t.position) from public.evoluna_smile_simulations t where t.user_id=w.user_id),'[]'::jsonb)),('sessions',coalesce((select jsonb_agg(s.data
 || case when 'entries'=any(s.collection_keys) then jsonb_build_object('entries',coalesce((select jsonb_agg(e.data order by e.position) from public.evoluna_session_entries e where e.user_id=s.user_id and e.session_id=s.id),'[]'::jsonb)) else '{}'::jsonb end
 || case when 'draft'=any(s.collection_keys) then jsonb_build_object('draft',d.data) else '{}'::jsonb end order by s.position)
from public.evoluna_consultation_sessions s left join public.evoluna_session_drafts d on d.user_id=s.user_id and d.session_id=s.id where s.user_id=w.user_id),'[]'::jsonb)),('activity',coalesce((select jsonb_agg(a.data order by a.position) from public.evoluna_activity_log a where a.user_id=w.user_id),'[]'::jsonb))) collections(k,v) where k=any(m.collection_keys)),'{}'::jsonb))
from public.evoluna_workspaces w
join public.evoluna_workspace_metadata m on m.user_id=w.user_id
join public.evoluna_clinic_settings c on c.user_id=w.user_id
where w.user_id=(select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true';
$$;
create function public.evoluna_create_workspace(p_state jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta' using errcode='42501';end if;
 insert into public.evoluna_workspaces(user_id,state) values(auth.uid(),p_state) on conflict(user_id) do nothing;
 return public.evoluna_load_workspace();
end;$$;
create function public.evoluna_save_workspace(p_state jsonb,p_expected_revision bigint) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare saved_revision bigint;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta' using errcode='42501';end if;
 update public.evoluna_workspaces set state=p_state where user_id=auth.uid() and revision=p_expected_revision returning revision into saved_revision;
 if not found then return null;end if;
 return jsonb_build_object('revision',saved_revision);
end;$$;
revoke all on function public.evoluna_load_workspace() from public,anon,authenticated;
revoke all on function public.evoluna_create_workspace(jsonb) from public,anon,authenticated;
revoke all on function public.evoluna_save_workspace(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.evoluna_load_workspace() to authenticated;
grant execute on function public.evoluna_create_workspace(jsonb) to authenticated;
grant execute on function public.evoluna_save_workspace(jsonb,bigint) to authenticated;
notify pgrst,'reload schema';

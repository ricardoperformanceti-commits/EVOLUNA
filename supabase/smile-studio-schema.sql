-- Private production smile generations. Original files and the AI base are immutable.
create table public.evoluna_smile_generations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 patient_id text not null,
 source_id text,
 procedure text not null check(procedure in ('clareamento','lentes')),
 shade text not null check(shade in ('BL1','BL2','A1')),
 base_shade text not null check(base_shade in ('BL1','BL2','A1')),
 intensity integer not null default 0 check(intensity between 0 and 100),
 status text not null default 'draft' check(status in ('draft','processing','complete','error')),
 original_path text not null,
 base_path text,
 current_path text,
 mouth jsonb check(mouth is null or jsonb_typeof(mouth)='array'),
 job_ticket text check(length(job_ticket)<4096),
 last_error text check(length(last_error)<2000),
 revision integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(user_id,patient_id) references public.evoluna_patients(user_id,id) on delete cascade,
 check(original_path like user_id::text||'/'||id::text||'/%'),
 check(base_path is null or base_path like user_id::text||'/'||id::text||'/%'),
 check(current_path is null or current_path like user_id::text||'/'||id::text||'/%'),
 check(status<>'complete' or (base_path is not null and current_path is not null))
);
create index evoluna_smile_patient on public.evoluna_smile_generations(user_id,patient_id,created_at desc);
alter table public.evoluna_smile_generations enable row level security;
revoke all on public.evoluna_smile_generations from public,anon,authenticated;
grant select,insert,update on public.evoluna_smile_generations to authenticated;
create policy smile_generations_select on public.evoluna_smile_generations for select to authenticated using(user_id=(select auth.uid()));
create policy smile_generations_insert on public.evoluna_smile_generations for insert to authenticated with check(user_id=(select auth.uid()) and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false) and status='draft');
create policy smile_generations_update on public.evoluna_smile_generations for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false));
create function public.evoluna_smile_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.user_id<>old.user_id or new.id<>old.id or new.patient_id<>old.patient_id or new.source_id is distinct from old.source_id or new.original_path<>old.original_path or new.procedure<>old.procedure or new.base_shade<>old.base_shade or new.created_at<>old.created_at then
  raise exception 'A identidade da geração não pode ser alterada.';
 end if;
 if old.status='complete' and (new.base_path is distinct from old.base_path or new.status<>'complete') then
  raise exception 'A imagem base da IA deve ser preservada.';
 end if;
 new.revision=old.revision+1;new.updated_at=now();return new;
end $$;
revoke all on function public.evoluna_smile_guard() from public,anon;
create trigger evoluna_smile_guard before update on public.evoluna_smile_generations for each row execute function public.evoluna_smile_guard();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evoluna-smile','evoluna-smile',false,8388608,array['image/jpeg','image/png']);
create policy smile_images_select on storage.objects for select to authenticated using(bucket_id='evoluna-smile' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy smile_images_insert on storage.objects for insert to authenticated with check(bucket_id='evoluna-smile' and (storage.foldername(name))[1]=(select auth.uid())::text and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false));
-- Files are immutable; revisions get fresh random names, then a CAS update switches the reference.
create policy smile_images_delete on storage.objects for delete to authenticated using(bucket_id='evoluna-smile' and (storage.foldername(name))[1]=(select auth.uid())::text);

create unique index evoluna_smile_source_id on public.evoluna_smile_generations(user_id,source_id) where source_id is not null;

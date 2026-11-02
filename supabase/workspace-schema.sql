-- Private per-account workspace. Existing browser state remains compatible.
-- No anonymous access; snapshots are saved atomically using expected revision.
create table public.evoluna_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint evoluna_valid_state check (
  jsonb_typeof(state)='object' and state ?& array['version','patients','appointments','documents','transactions','settings'] and state->>'version'='3'
  and jsonb_typeof(state->'patients')='array'
  and jsonb_typeof(state->'appointments')='array'
  and jsonb_typeof(state->'documents')='array'
  and jsonb_typeof(state->'transactions')='array'
  and jsonb_typeof(state->'settings')='object'
  and octet_length(state::text)<=16777216
 )
);
alter table public.evoluna_workspaces enable row level security;
revoke all on public.evoluna_workspaces from anon;
revoke all on public.evoluna_workspaces from authenticated;
grant select, insert, update on public.evoluna_workspaces to authenticated;
create policy evoluna_select_own on public.evoluna_workspaces for select to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
create policy evoluna_insert_own on public.evoluna_workspaces for insert to authenticated
 with check (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
create policy evoluna_update_own on public.evoluna_workspaces for update to authenticated
 using (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true')
 with check (user_id=(select auth.uid()) and ((select auth.jwt())->>'is_anonymous') is distinct from 'true');
create function public.evoluna_workspace_revision() returns trigger
 language plpgsql security invoker set search_path='' as $$
begin
 new.user_id=old.user_id;
 new.created_at=old.created_at;
 new.revision=old.revision+1;
 new.updated_at=now();
 return new;
end;
$$;
revoke execute on function public.evoluna_workspace_revision() from public,anon,authenticated;
create trigger evoluna_workspace_revision before update on public.evoluna_workspaces
 for each row execute function public.evoluna_workspace_revision();

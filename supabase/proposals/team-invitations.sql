-- PROPOSTA NÃO APLICADA. Revisão automática bloqueou o compartilhamento.
-- Aguardar autorização explícita do alcance descrito em docs/PROPOSTA-ACESSO-EQUIPE.md.
-- Additive clinic sharing. Existing owner workspaces and state stay intact.
create schema if not exists evoluna_private;
revoke all on schema evoluna_private from public,anon;
grant usage on schema evoluna_private to authenticated;
create function evoluna_private.verified_email() returns text
language sql stable security definer set search_path='' as $$
 select lower(email) from auth.users where id=(select auth.uid()) and email_confirmed_at is not null;
$$;
revoke all on function evoluna_private.verified_email() from public,anon;
grant execute on function evoluna_private.verified_email() to authenticated;
alter table public.evoluna_workspaces add column clinic_name text generated always as (coalesce(state#>>'{settings,clinic}','Minha clínica')) stored;
create table public.evoluna_members (
 workspace_owner uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 member_id uuid not null references auth.users(id) on delete cascade,
 member_email text not null,
 role text not null check(role in ('editor','viewer')),
 created_at timestamptz not null default now(),
 primary key(workspace_owner,member_id),
 check(workspace_owner<>member_id)
);
create index evoluna_members_member_idx on public.evoluna_members(member_id,workspace_owner);
create table public.evoluna_invites (
 id uuid primary key default gen_random_uuid(),
 workspace_owner uuid not null references public.evoluna_workspaces(user_id) on delete cascade,
 email text not null check(email=lower(email) and length(email)<=254),
 role text not null check(role in ('editor','viewer')),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null default now()+interval '7 days',
 accepted_at timestamptz,
 created_at timestamptz not null default now(),
 check(expires_at<=created_at+interval '7 days')
);
create index evoluna_invites_owner_idx on public.evoluna_invites(workspace_owner);
create index evoluna_invites_email_idx on public.evoluna_invites(email);
alter table public.evoluna_members enable row level security;
alter table public.evoluna_invites enable row level security;
revoke all on public.evoluna_members,public.evoluna_invites from anon,authenticated;
grant select,insert,update,delete on public.evoluna_members to authenticated;
grant select,insert,delete on public.evoluna_invites to authenticated;
grant update(accepted_at) on public.evoluna_invites to authenticated;
create policy evoluna_member_read on public.evoluna_members for select to authenticated
 using(workspace_owner=(select auth.uid()) or member_id=(select auth.uid()));
create policy evoluna_invite_read on public.evoluna_invites for select to authenticated
 using(workspace_owner=(select auth.uid()) or (email=(select evoluna_private.verified_email()) and expires_at>now() and accepted_at is null));
create policy evoluna_invite_create on public.evoluna_invites for insert to authenticated
 with check(workspace_owner=(select auth.uid()) and accepted_at is null and expires_at>now());
create policy evoluna_invite_remove on public.evoluna_invites for delete to authenticated
 using(workspace_owner=(select auth.uid()));
create policy evoluna_invite_accept on public.evoluna_invites for update to authenticated
 using(email=(select evoluna_private.verified_email()) and expires_at>now() and accepted_at is null)
 with check(email=(select evoluna_private.verified_email()) and accepted_at is not null);
create policy evoluna_member_add on public.evoluna_members for insert to authenticated
 with check(workspace_owner=(select auth.uid()) or
  (member_id=(select auth.uid()) and member_email=(select evoluna_private.verified_email()) and exists
   (select 1 from public.evoluna_invites i where i.workspace_owner=evoluna_members.workspace_owner
    and i.email=(select evoluna_private.verified_email()) and i.role=evoluna_members.role
    and i.accepted_at is null and i.expires_at>now())));
create policy evoluna_member_change on public.evoluna_members for update to authenticated
 using(workspace_owner=(select auth.uid())) with check(workspace_owner=(select auth.uid()));
create policy evoluna_member_remove on public.evoluna_members for delete to authenticated
 using(workspace_owner=(select auth.uid()) or member_id=(select auth.uid()));
alter policy evoluna_select_own on public.evoluna_workspaces using
 (((select auth.jwt())->>'is_anonymous') is distinct from 'true' and
  (user_id=(select auth.uid()) or exists(select 1 from public.evoluna_members m where m.workspace_owner=evoluna_workspaces.user_id and m.member_id=(select auth.uid()))));
alter policy evoluna_update_own on public.evoluna_workspaces using
 (((select auth.jwt())->>'is_anonymous') is distinct from 'true' and
  (user_id=(select auth.uid()) or exists(select 1 from public.evoluna_members m where m.workspace_owner=evoluna_workspaces.user_id and m.member_id=(select auth.uid()) and m.role='editor')))
 with check(((select auth.jwt())->>'is_anonymous') is distinct from 'true' and
  (user_id=(select auth.uid()) or exists(select 1 from public.evoluna_members m where m.workspace_owner=evoluna_workspaces.user_id and m.member_id=(select auth.uid()) and m.role='editor')));
create function public.evoluna_accept_invite(p_token text) returns uuid
language plpgsql security invoker set search_path='' as $$
declare invitation public.evoluna_invites; uid uuid:=(select auth.uid()); mail text:=(select evoluna_private.verified_email());
begin
 if uid is null or mail is null or length(p_token)<>64 then raise exception 'Entre com o e-mail confirmado que recebeu o convite.' using errcode='22023'; end if;
 select * into invitation from public.evoluna_invites where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and email=mail and accepted_at is null and expires_at>now() for update;
 if not found then raise exception 'Convite inválido, expirado ou destinado a outro e-mail.' using errcode='22023'; end if;
 insert into public.evoluna_members(workspace_owner,member_id,member_email,role) values(invitation.workspace_owner,uid,mail,invitation.role) on conflict(workspace_owner,member_id) do nothing;
 update public.evoluna_invites set accepted_at=now() where id=invitation.id;
 return invitation.workspace_owner;
end;
$$;
revoke all on function public.evoluna_accept_invite(text) from public,anon;
grant execute on function public.evoluna_accept_invite(text) to authenticated;

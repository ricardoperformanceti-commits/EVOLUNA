-- Keep the workspace row as a small revision anchor. The canonical modules
-- already live in their normalized private tables and are assembled on load.
create or replace function evoluna_internal.compact_workspace_state(p_state jsonb)
returns jsonb language sql immutable security invoker set search_path='' as $$
 select jsonb_build_object(
  'version',coalesce(p_state->'version','"3"'::jsonb),
  'patients','[]'::jsonb,'appointments','[]'::jsonb,'documents','[]'::jsonb,
  'transactions','[]'::jsonb,'simulations','[]'::jsonb,'sessions','[]'::jsonb,
  'activity','[]'::jsonb,'settings','{}'::jsonb
 );
$$;
revoke all on function evoluna_internal.compact_workspace_state(jsonb) from public,anon,authenticated;

-- RPC writes synchronize the normalized modules explicitly. Their final
-- revision-only update must not run the compatibility trigger a second time.
create or replace function evoluna_internal.workspace_modules_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('evoluna.skip_workspace_sync',true)='on' then return new;end if;
 if tg_op='UPDATE' then
  perform evoluna_internal.sync_modules_delta(new.user_id,new.state,old.state);
 else
  perform evoluna_internal.sync_modules(new.user_id,new.state);
 end if;
 return new;
end;$$;

create or replace function public.evoluna_patch_workspace(p_patch jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='30s' as $$
declare previous_state jsonb; current_state jsonb; change jsonb; path text[]; parent jsonb; kind text; saved_revision bigint;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Entre na sua conta' using errcode='42501';
 end if;
 if jsonb_typeof(p_patch) is distinct from 'array' or jsonb_array_length(p_patch)>10000 then
  raise exception 'Alterações inválidas' using errcode='22023';
 end if;
 if not exists(select 1 from public.evoluna_workspaces where user_id=(select auth.uid()) and revision=p_expected_revision for update) then return null;end if;
 previous_state:=public.evoluna_load_workspace()->'state';
 current_state:=previous_state;
 for change in select value from jsonb_array_elements(p_patch) loop
  if jsonb_typeof(change->'path') is distinct from 'array'
   or jsonb_array_length(change->'path') not between 1 and 64
   or exists(select 1 from jsonb_array_elements(change->'path') v where jsonb_typeof(v)<>'string') then
   raise exception 'Caminho inválido' using errcode='22023';
  end if;
  select array_agg(v order by ord) into path from jsonb_array_elements_text(change->'path') with ordinality a(v,ord);
  parent:=current_state #> path[1:cardinality(path)-1];kind:=jsonb_typeof(parent);
  if kind is null or kind not in ('object','array') then raise exception 'Caminho inexistente' using errcode='22023';end if;
  if kind='array' then
   if path[cardinality(path)]!~'^(0|[1-9][0-9]{0,8})$' then raise exception 'Índice inválido' using errcode='22023';end if;
   if path[cardinality(path)]::integer>jsonb_array_length(parent)
    or (change->>'op'<>'insert' and path[cardinality(path)]::integer>=jsonb_array_length(parent)) then raise exception 'Índice inexistente' using errcode='22023';end if;
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
 perform evoluna_internal.sync_modules_delta((select auth.uid()),current_state,previous_state);
 perform set_config('evoluna.skip_workspace_sync','on',true);
 update public.evoluna_workspaces set state=evoluna_internal.compact_workspace_state(current_state)
 where user_id=(select auth.uid()) and revision=p_expected_revision returning revision into saved_revision;
 if not found then return null;end if;
 return jsonb_build_object('revision',saved_revision);
end;$$;

create or replace function public.evoluna_save_workspace(p_state jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security definer set search_path='' set statement_timeout='30s' as $$
declare previous_state jsonb; saved_revision bigint;
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta' using errcode='42501';end if;
 if not exists(select 1 from public.evoluna_workspaces where user_id=(select auth.uid()) and revision=p_expected_revision for update) then return null;end if;
 previous_state:=public.evoluna_load_workspace()->'state';
 perform evoluna_internal.sync_modules_delta((select auth.uid()),p_state,previous_state);
 perform set_config('evoluna.skip_workspace_sync','on',true);
 update public.evoluna_workspaces set state=evoluna_internal.compact_workspace_state(p_state)
 where user_id=(select auth.uid()) and revision=p_expected_revision returning revision into saved_revision;
 if not found then return null;end if;
 return jsonb_build_object('revision',saved_revision);
end;$$;

-- Existing normalized rows already contain the canonical data. Remove only
-- their obsolete duplicate snapshots; no patient record or image is deleted.
do $$begin
 perform set_config('evoluna.skip_workspace_sync','on',true);
 alter table public.evoluna_workspaces disable trigger evoluna_workspace_revision;
 update public.evoluna_workspaces set state=evoluna_internal.compact_workspace_state(state)
 where pg_column_size(state)>32768;
 alter table public.evoluna_workspaces enable trigger evoluna_workspace_revision;
end$$;

revoke all on function public.evoluna_patch_workspace(jsonb,bigint) from public,anon,authenticated;
revoke all on function public.evoluna_save_workspace(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.evoluna_patch_workspace(jsonb,bigint) to authenticated;
grant execute on function public.evoluna_save_workspace(jsonb,bigint) to authenticated;
notify pgrst,'reload schema';

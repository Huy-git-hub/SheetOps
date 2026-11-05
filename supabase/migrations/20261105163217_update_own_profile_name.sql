-- Additive self-service name change. Keep access/email changes Admin-only.
create function private.update_own_profile_name(full_name_input text)
returns text language plpgsql security definer set search_path='' as $$
declare
  cleaned text := btrim(full_name_input);
  previous_name text;
  active boolean;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  if cleaned is null or length(cleaned) not between 1 and 200 then
    raise check_violation using message='Display name must contain 1 to 200 characters';
  end if;
  select full_name,is_active into previous_name,active
    from public.profiles where id=auth.uid() for update;
  if not found or not active then raise insufficient_privilege; end if;
  if previous_name is distinct from cleaned then
    update public.profiles set full_name=cleaned,updated_at=now() where id=auth.uid();
  end if;
  -- Existing profiles_audit captures this update and trusted auth.uid() in the same transaction.
  return cleaned;
end $$;
revoke all on function private.update_own_profile_name(text) from public,anon;
grant execute on function private.update_own_profile_name(text) to authenticated;

create function public.update_own_profile_name(full_name_input text)
returns text language sql security invoker set search_path='' as $$
  select private.update_own_profile_name(full_name_input)
$$;
revoke all on function public.update_own_profile_name(text) from public,anon;
grant execute on function public.update_own_profile_name(text) to authenticated;

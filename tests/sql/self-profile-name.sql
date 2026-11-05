-- Disposable local fixtures only. Run after installation harness bootstrap.
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.manage_profile('00000000-0000-4000-8000-000000000002','Synthetic viewer','viewer@example.invalid','viewer',true);
select public.manage_profile('00000000-0000-4000-8000-000000000003','Disabled viewer','disabled@example.invalid','viewer',false);
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
select public.update_own_profile_name('  Renamed viewer  ');
do $$begin
 if (select full_name||':'||role||':'||is_active from public.profiles where id=auth.uid()) <> 'Renamed viewer:viewer:true' then
  raise exception 'Self-service name/access mismatch';
 end if;
 begin
  perform public.update_own_profile_name(' ');
  raise exception 'Blank name accepted';
 exception when check_violation then null; end;
 begin
  perform public.update_own_profile_name(repeat('x',201));
  raise exception 'Oversized name accepted';
 exception when check_violation then null; end;
 begin
  update public.profiles set role='admin' where id=auth.uid();
  raise exception 'Direct privilege escalation accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$begin
 if not exists(select 1 from public.audit_logs where actor_id='00000000-0000-4000-8000-000000000002' and resource_type='profiles'
  and action='updated' and before_data->>'full_name'='Synthetic viewer' and after_data->>'full_name'='Renamed viewer' and actor_role='viewer') then
  raise exception 'Missing transactional self-rename audit';
 end if;
 if has_function_privilege('anon','public.update_own_profile_name(text)','EXECUTE') then
  raise exception 'Anonymous name RPC access';
 end if;
 if (select full_name from public.profiles where id='00000000-0000-4000-8000-000000000001') <> 'Synthetic owner' then
  raise exception 'Another profile changed';
 end if;
end $$;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
do $$begin
 begin
  perform public.update_own_profile_name('Blocked');
  raise exception 'Disabled profile renamed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;

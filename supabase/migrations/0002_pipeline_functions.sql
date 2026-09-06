create or replace function public.enqueue_observation(
  p_storage_path text,
  p_alliance_id uuid default null,
  p_captured_at timestamptz default null,
  p_source text default 'upload',
  p_width integer default null,
  p_height integer default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_observation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_alliance_id is not null and not public.is_alliance_member(p_alliance_id) then
    raise exception 'not an alliance member';
  end if;

  insert into public.observations (
    alliance_id, created_by, storage_path, captured_at, source, width, height
  ) values (
    p_alliance_id, auth.uid(), p_storage_path, p_captured_at, p_source, p_width, p_height
  ) returning id into v_observation_id;

  insert into public.scan_jobs (observation_id) values (v_observation_id);

  return v_observation_id;
end;
$$;

create or replace function public.claim_target(
  p_target_id uuid,
  p_ttl_seconds integer default 300
)
returns public.target_claims
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_target public.targets;
  v_claim public.target_claims;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_target from public.targets where id = p_target_id;
  if not found then raise exception 'target not found'; end if;
  if v_target.alliance_id is null or not public.is_alliance_member(v_target.alliance_id) then
    raise exception 'target not claimable by user';
  end if;

  delete from public.target_claims
  where target_id = p_target_id and expires_at <= now();

  insert into public.target_claims(target_id, alliance_id, claimed_by, expires_at)
  values (
    p_target_id,
    v_target.alliance_id,
    auth.uid(),
    now() + make_interval(secs => greatest(30, least(p_ttl_seconds, 3600)))
  )
  on conflict (target_id) do nothing
  returning * into v_claim;

  if v_claim.target_id is null then
    raise exception 'target already claimed';
  end if;

  update public.targets set status = 'claimed' where id = p_target_id;
  return v_claim;
end;
$$;

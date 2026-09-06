create extension if not exists pgcrypto;

create type public.scan_status as enum ('queued','processing','completed','failed');
create type public.target_status as enum ('active','claimed','dead','stale');
create type public.alliance_role as enum ('owner','officer','member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.alliance_members (
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.alliance_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (alliance_id, user_id)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references public.alliances(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  storage_path text not null,
  captured_at timestamptz,
  source text not null default 'upload',
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null unique references public.observations(id) on delete cascade,
  status public.scan_status not null default 'queued',
  attempts integer not null default 0,
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.detections (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  monster_name text,
  monster_level integer,
  map_x integer,
  map_y integer,
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  bbox jsonb,
  raw_text text,
  created_at timestamptz not null default now()
);

create table public.targets (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid references public.alliances(id) on delete cascade,
  monster_name text not null,
  monster_level integer,
  map_x integer not null,
  map_y integer not null,
  status public.target_status not null default 'active',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  confidence numeric(5,4) not null default 0,
  score numeric(12,4),
  score_explanation jsonb,
  unique nulls not distinct (alliance_id, monster_name, monster_level, map_x, map_y)
);

create table public.target_observations (
  target_id uuid not null references public.targets(id) on delete cascade,
  detection_id uuid not null references public.detections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (target_id, detection_id)
);

create table public.target_claims (
  target_id uuid primary key references public.targets(id) on delete cascade,
  alliance_id uuid not null references public.alliances(id) on delete cascade,
  claimed_by uuid not null references public.profiles(id),
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user','alliance')),
  owner_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_key text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user','alliance')),
  owner_id uuid not null,
  key text not null,
  value jsonb not null default 'true'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_type, owner_id, key)
);

create table public.domain_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index observations_alliance_created_idx on public.observations(alliance_id, created_at desc);
create index detections_coords_idx on public.detections(map_x, map_y);
create index targets_alliance_status_seen_idx on public.targets(alliance_id, status, last_seen_at desc);
create index targets_monster_level_idx on public.targets(monster_name, monster_level);
create index scan_jobs_status_created_idx on public.scan_jobs(status, created_at);
create index entitlements_owner_idx on public.entitlements(owner_type, owner_id);

create or replace function public.is_alliance_member(target_alliance_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.alliance_members m
    where m.alliance_id = target_alliance_id
      and m.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.alliances enable row level security;
alter table public.alliance_members enable row level security;
alter table public.observations enable row level security;
alter table public.scan_jobs enable row level security;
alter table public.detections enable row level security;
alter table public.targets enable row level security;
alter table public.target_observations enable row level security;
alter table public.target_claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.domain_events enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid());

create policy "alliances members read" on public.alliances for select using (public.is_alliance_member(id));
create policy "alliances creator insert" on public.alliances for insert with check (created_by = auth.uid());

create policy "alliance members read peers" on public.alliance_members for select using (public.is_alliance_member(alliance_id));

create policy "observations owner or alliance read" on public.observations for select using (
  created_by = auth.uid() or (alliance_id is not null and public.is_alliance_member(alliance_id))
);
create policy "observations self insert" on public.observations for insert with check (
  created_by = auth.uid() and (alliance_id is null or public.is_alliance_member(alliance_id))
);

create policy "targets alliance read" on public.targets for select using (
  alliance_id is null or public.is_alliance_member(alliance_id)
);

create policy "claims alliance read" on public.target_claims for select using (public.is_alliance_member(alliance_id));
create policy "claims alliance insert" on public.target_claims for insert with check (
  claimed_by = auth.uid() and public.is_alliance_member(alliance_id)
);
create policy "claims owner delete" on public.target_claims for delete using (claimed_by = auth.uid());

-- scan_jobs, detections, target_observations, subscriptions, entitlements and domain_events
-- are intentionally service-managed in the MVP. They have RLS enabled and no direct client policies.

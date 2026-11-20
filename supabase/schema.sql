-- ============================================================
-- DeadlineRadar (Work-from-Cafe Radar) — Supabase SQL Schema
-- Bật PostGIS để hỗ trợ truy vấn "quán gần tôi nhất"
-- ============================================================

create extension if not exists postgis;

-- 1. Bảng lưu thông tin quán cafe (Structured Data)
create table if not exists public.cafes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  district text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  location geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  open_hours text not null default '07:30 – 22:00',
  open_24h boolean not null default false,
  score numeric(3,1) not null default 8.0,
  power_outlets text not null check (power_outlets in ('all', 'scattered', 'rare')),
  wifi_download integer not null default 50,
  wifi_upload integer not null default 30,
  wifi_measured_at timestamptz not null default now(),
  noise_morning text not null check (noise_morning in ('quiet', 'moderate', 'busy')),
  noise_afternoon text not null check (noise_afternoon in ('quiet', 'moderate', 'busy')),
  noise_evening text not null check (noise_evening in ('quiet', 'moderate', 'busy')),
  quiet_for_calls boolean not null default false,
  ergonomic_desk boolean not null default false,
  stay_friendly boolean not null default true,
  price_range text not null default '45k–65k',
  staff_note text not null default '',
  featured boolean not null default false,
  voucher text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists cafes_location_gix on public.cafes using gist (location);
create index if not exists cafes_district_idx on public.cafes (district);

-- 2. Bảng Crowd-sourced Check-in (tự động hết hạn sau 6 tiếng)
create table if not exists public.live_checkins (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  status_type text not null check (
    status_type in (
      'wifi_lag',
      'noisy_construction',
      'crowded',
      'quiet_available',
      'great_vibes'
    )
  ),
  note text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '6 hours')
);

create index if not exists live_checkins_active_idx
  on public.live_checkins (cafe_id, expires_at desc);

-- 3. RLS Policies (Public read, authenticated/anon insert cho MVP)
alter table public.cafes enable row level security;
alter table public.live_checkins enable row level security;

create policy "Public read cafes"
  on public.cafes for select using (true);

create policy "Public read active checkins"
  on public.live_checkins for select using (expires_at > now());

create policy "Anyone can post a live checkin"
  on public.live_checkins for insert with check (true);

-- 4. RPC: Tìm quán gần tôi nhất trong bán kính (mét)
create or replace function public.get_nearby_cafes(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer default 5000
)
returns table (
  id uuid,
  name text,
  district text,
  address text,
  lat double precision,
  lng double precision,
  distance_meters double precision
)
language sql
stable
as $$
  select
    c.id,
    c.name,
    c.district,
    c.address,
    c.lat,
    c.lng,
    st_distance(
      c.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) as distance_meters
  from public.cafes c
  where st_dwithin(
    c.location,
    st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters asc;
$$;

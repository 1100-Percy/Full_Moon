create table if not exists pairs (
  id uuid primary key default gen_random_uuid(),
  user_a text not null,
  user_b text not null,
  start_at timestamptz not null,
  reunion_at timestamptz not null,
  last_seen_a_at timestamptz,
  last_seen_b_at timestamptz
);

alter table pairs add column if not exists last_seen_a_at timestamptz;
alter table pairs add column if not exists last_seen_b_at timestamptz;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  sender text not null check (sender in ('A', 'B')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now(),
  caught_at timestamptz
);

create table if not exists stars (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  star_index int not null,
  lit_on date not null,
  source text not null check (source in ('message', 'task', 'summary'))
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references pairs(id) on delete cascade,
  prompt text not null,
  photo_a_url text,
  photo_b_url text,
  status text not null default 'open' check (status in ('open', 'pending', 'passed', 'failed')),
  ai_reason text
);

alter table pairs disable row level security;
alter table messages disable row level security;
alter table stars disable row level security;
alter table tasks disable row level security;

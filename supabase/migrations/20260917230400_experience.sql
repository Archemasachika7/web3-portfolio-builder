-- New table: the public site has no work-experience section yet, but
-- the admin spec requires managing it, so this is added as a genuinely
-- new canonical table rather than overloading `achievements` or
-- `education`.

create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  role text not null,
  employment_type text, -- 'full-time' | 'internship' | 'contract' | 'freelance' | 'volunteer' | ...
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  short_description text,
  long_description text,
  website_url text,
  logo_path text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists experience_tags (
  experience_id uuid not null references experience(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (experience_id, tag_id)
);

create index if not exists idx_experience_tags_tag on experience_tags(tag_id);
create index if not exists idx_experience_published on experience(published);

drop trigger if exists set_updated_at on experience;
create trigger set_updated_at before update on experience
  for each row execute function set_updated_at();

alter table experience enable row level security;
alter table experience_tags enable row level security;

drop policy if exists "public read published experience" on experience;
create policy "public read published experience" on experience
  for select using (published = true);

drop policy if exists "public read experience_tags" on experience_tags;
create policy "public read experience_tags" on experience_tags
  for select using (true);

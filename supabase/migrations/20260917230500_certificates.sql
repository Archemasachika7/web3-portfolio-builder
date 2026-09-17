-- New table: /certificates on the public site currently renders a
-- hard-coded 2-item array in app/certificates/page.jsx. This table
-- replaces that with real CMS-driven content. Migrating the public page
-- to read from here is a follow-up change in the 3dportfolio repo, not
-- part of this admin build.

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text not null,
  credential_name text,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  certificate_file_path text, -- PDF, in Storage
  thumbnail_path text, -- image, in Storage
  description text,
  published boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists certificate_tags (
  certificate_id uuid not null references certificates(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (certificate_id, tag_id)
);

create index if not exists idx_certificate_tags_tag on certificate_tags(tag_id);
create index if not exists idx_certificates_published on certificates(published);

drop trigger if exists set_updated_at on certificates;
create trigger set_updated_at before update on certificates
  for each row execute function set_updated_at();

alter table certificates enable row level security;
alter table certificate_tags enable row level security;

drop policy if exists "public read published certificates" on certificates;
create policy "public read published certificates" on certificates
  for select using (published = true);

drop policy if exists "public read certificate_tags" on certificate_tags;
create policy "public read certificate_tags" on certificate_tags
  for select using (true);

-- New table: single-row site-wide settings (same pattern as `profiles`
-- being effectively single-row). No `published` gate — this is
-- site-wide config, always readable by the public site.

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  site_title text,
  site_description text,
  favicon_path text,
  default_og_image_path text,
  contact_email text,
  footer_text text,
  copyright_text text,
  availability_text text,
  primary_location text,
  maintenance_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on site_settings;
create trigger set_updated_at before update on site_settings
  for each row execute function set_updated_at();

alter table site_settings enable row level security;

drop policy if exists "public read site_settings" on site_settings;
create policy "public read site_settings" on site_settings
  for select using (true);

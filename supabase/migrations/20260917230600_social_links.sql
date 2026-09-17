-- New table: social links currently hard-coded in the public repo's
-- SiteFooter.jsx and data/career.js (closingLinks). This table replaces
-- that with CMS-driven content; wiring the public site to read from it
-- is a follow-up change in the 3dportfolio repo.

create table if not exists social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null, -- 'github' | 'linkedin' | 'email' | 'portfolio' | ...
  label text not null,
  url text not null,
  icon_key text,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on social_links;
create trigger set_updated_at before update on social_links
  for each row execute function set_updated_at();

alter table social_links enable row level security;

drop policy if exists "public read enabled social_links" on social_links;
create policy "public read enabled social_links" on social_links
  for select using (enabled = true);

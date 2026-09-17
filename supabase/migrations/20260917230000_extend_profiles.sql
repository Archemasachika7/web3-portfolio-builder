-- Additive columns for the admin Profile editor. Nothing here renames or
-- removes an existing column — the public site's `getProfile()` selects
-- `*`, so new nullable columns are safe to add without touching it.

alter table profiles add column if not exists display_name text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists show_phone boolean not null default false;
alter table profiles add column if not exists website_url text;
alter table profiles add column if not exists github_url text;
alter table profiles add column if not exists linkedin_url text;
alter table profiles add column if not exists instagram_url text;
alter table profiles add column if not exists other_links jsonb not null default '[]'::jsonb;
alter table profiles add column if not exists availability_status text;
alter table profiles add column if not exists current_role text;
alter table profiles add column if not exists current_company text;
alter table profiles add column if not exists primary_domain text;
alter table profiles add column if not exists secondary_domains text[] not null default '{}'::text[];
alter table profiles add column if not exists resume_id uuid references resumes(id) on delete set null;
alter table profiles add column if not exists featured_profile boolean not null default true;

comment on column profiles.other_links is 'Array of {label, url} objects for links beyond the dedicated github/linkedin/instagram/website columns.';

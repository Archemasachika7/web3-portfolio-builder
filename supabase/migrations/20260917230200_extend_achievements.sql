-- Additive columns for the admin Achievements editor.

alter table achievements add column if not exists organization text;
alter table achievements add column if not exists category text;
alter table achievements add column if not exists credential_url text;
alter table achievements add column if not exists certificate_id text;
alter table achievements add column if not exists image_path text;

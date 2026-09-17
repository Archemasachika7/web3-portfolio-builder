-- Additive columns for the admin Education editor. Deliberately does NOT
-- rename start_year/end_year/field/cgpa to the admin spec's start_date/
-- field_of_study/etc — the public site's EducationSection already reads
-- those exact names, and the migration-handoff rule across this project
-- has always been "extend, don't rename". The admin form is built
-- against the real column names.

alter table education add column if not exists program text;
alter table education add column if not exists location text;
alter table education add column if not exists is_current boolean not null default false;
alter table education add column if not exists grade text;
alter table education add column if not exists score text;
alter table education add column if not exists rank text;
alter table education add column if not exists logo_path text;
alter table education add column if not exists website_url text;

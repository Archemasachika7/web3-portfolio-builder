-- New table: lightweight activity log for the admin dashboard. Kept
-- deliberately minimal per the spec's own "do not over-engineer this if
-- the current project does not have an audit schema" guidance — no
-- diffing/versioning, just what/who/when. RLS is enabled with NO
-- policies at all: this is never read by the public site, only by the
-- admin app's server-side code via the service-role key, which bypasses
-- RLS entirely.

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'project' | 'profile' | 'resume' | 'certificate' | ...
  entity_id uuid,
  action text not null, -- 'created' | 'updated' | 'published' | 'unpublished' | 'deleted' | 'uploaded'
  actor text, -- admin user's email/id at time of action
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_log_created on activity_log(created_at desc);
create index if not exists idx_activity_log_entity on activity_log(entity_type, entity_id);

alter table activity_log enable row level security;
-- Intentionally no policies: service-role access only.

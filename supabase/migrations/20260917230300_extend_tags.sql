-- Additive columns for admin tag management (enable/disable, reorder).
-- "category" from the admin spec maps to the existing `type` column —
-- not duplicated here.

alter table tags add column if not exists published boolean not null default true;
alter table tags add column if not exists sort_order integer not null default 0;

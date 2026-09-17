# Admin schema migrations

This repo now owns schema migrations going forward. The first 11
migrations (everything the public `3dportfolio` repo needed) already
exist and are applied on the live project — this directory only adds
what the admin app needs on top of that canonical schema.

**I cannot run these myself** — same blockers as documented in the
public repo: the Supabase MCP available in this session is bound to an
unrelated account, and this sandbox has no network egress to
`*.supabase.co`. Run these in the Supabase SQL Editor, in filename
order, after the public repo's own migrations.

## What's in each file

| File | Contents |
| --- | --- |
| `20260917230000_extend_profiles.sql` | Adds display_name, location, phone, website/github/linkedin/instagram URLs, other_links, availability_status, current_role/company, primary/secondary_domains, resume_id, featured_profile |
| `20260917230100_extend_education.sql` | Adds program, location, current, grade, score, rank, logo_path, website_url — keeps existing start_year/end_year/field/cgpa names |
| `20260917230200_extend_achievements.sql` | Adds organization, category, credential_url, certificate_id, image_path |
| `20260917230300_extend_tags.sql` | Adds published, sort_order (category reuses the existing `type` column) |
| `20260917230400_experience.sql` | New `experience` + `experience_tags` tables — no work-experience section existed before |
| `20260917230500_certificates.sql` | New `certificates` + `certificate_tags` tables — replaces the public site's hard-coded certificates array (public-side wiring is a follow-up, not done here) |
| `20260917230600_social_links.sql` | New `social_links` table — replaces hard-coded links in `SiteFooter.jsx`/`data/career.js` (public-side wiring is a follow-up) |
| `20260917230700_site_settings.sql` | New single-row `site_settings` table |
| `20260917230800_activity_log.sql` | New lightweight `activity_log` table, RLS locked to service-role only |

## Why no new write RLS policies

Same model as the public repo: every table's RLS only grants
`anon`/public `SELECT` on published/enabled rows. All admin writes go
through this app's Server Actions using `SUPABASE_SERVICE_ROLE_KEY`
server-side, which bypasses RLS entirely. `SUPABASE_SERVICE_ROLE_KEY`
must never be exposed to the browser — Supabase Auth here is only for
gating access to `/admin` itself, not for row-level write permissions.

## Manual setup still required after running these

1. Create the admin's Supabase Auth user yourself (Authentication →
   Users → Add user, email + password) — this app doesn't do open
   sign-up, so no code path can create it for you.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in this app's server-side environment
   variables only (never `NEXT_PUBLIC_*`).

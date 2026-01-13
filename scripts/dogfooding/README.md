# Dogfooding Scripts

These helper scripts are for local dogfooding and diagnostics. They require a Supabase
service role key and should only be run in trusted environments.

## Common environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Per-script environment variables

- `assign_consultant.js`: `CONSULTANT_ID`, `PROJECT_ID`
- `debug_consultant.js`: `CONSULTANT_ID` or `CONSULTANT_EMAIL`, `FOUNDER_ID` or `FOUNDER_EMAIL`
- `fix_user_roles.js`: `FOUNDER_EMAIL`, `CONSULTANT_EMAIL` (optional `FOUNDER_ID`, `CONSULTANT_ID`)
- `link_founder_to_consultant.js`: `FOUNDER_EMAIL`/`FOUNDER_ID`, `CONSULTANT_EMAIL`/`CONSULTANT_ID`
- `setup_dogfooding.js`: `FOUNDER_EMAIL`, `CONSULTANT_EMAIL` (optional `PROJECT_NAME`, `PROJECT_DESCRIPTION`)
- `test_consultant_dashboard.js`: `CONSULTANT_EMAIL`, `CONSULTANT_PASSWORD` (optional `CONSULTANT_ID`)
- `test_founder_dashboard.js`: `FOUNDER_EMAIL`, `FOUNDER_PASSWORD` (optional `FOUNDER_ID`)
- `update_evidence_summary.js`: optional `TASK_ID`
- `verify_test_setup.js`: `FOUNDER_EMAIL`, `CONSULTANT_EMAIL` (optional `FOUNDER_PASSWORD`, `CONSULTANT_PASSWORD`)

## Example

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
FOUNDER_EMAIL=founder@example.com CONSULTANT_EMAIL=consultant@example.com \
node scripts/dogfooding/setup_dogfooding.js
```

# Migrations

- Use Prisma Migrate for schema changes.
- Safe rollout: create-forward, verify, then drop old columns in a later release.
- Rollback: maintain backward-compatible migrations; document in release notes.

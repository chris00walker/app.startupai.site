# Data Retention and PII

- Retention: Default 180 days for raw logs; 30 days for detailed traces; configurable per client.
- PII: Encrypt at rest (AES-256), limit access via IAM, redact from logs, field-level encryption where necessary.
- Backups: Daily snapshots; tested restores; RPO 24h, RTO 4h targets.

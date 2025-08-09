# Security Posture

- Containers: Non-root user, read-only filesystem, `cap_drop: [ALL]`, minimal `cap_add` where required.
- Network: HTTPS enforced; Cloud Run with ingress controls; VPC connectors as needed.
- Secrets: Managed in GCP Secret Manager; injected via environment at runtime; never committed.
- SBOM: Image SBOM generated and stored; dependency scans on CI.
- Data: AES-256 at rest; KMS-managed keys; per-field encryption for PII where applicable.
- AuthN/Z: Service-to-service via IAM; user endpoints via JWT/OIDC; scoped tokens.
- Audit: Structured audit logs; tamper-evident storage for critical events.

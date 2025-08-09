# Deployment

- Containers: Non-root, read-only FS, dropped capabilities; health checks.
- Config: All secrets via GCP Secret Manager; environment-driven configuration.
- Rollout: Gradual; observe SLOs; rollback on budget breach or error spikes.

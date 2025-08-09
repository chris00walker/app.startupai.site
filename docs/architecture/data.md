# Data Architecture

- Cloud SQL Postgres + pgvector (entities, embeddings, lineage)
- Encryption at rest for PII; column-level for personal data
- Feature store/telemetry for learning loop
- Retention policies and data minimization

## Canvas Artifacts

- Storage: `gs://.../canvases/{canvas_id}/` with JSON source of record
- Derivatives: `/renders/{canvas_id}.{svg|pdf|png}` produced by export service
- Lineage: `events` + `router_decisions` correlate artifacts to decisions and inputs
- Access: client portal with signed URLs; PII guarded per policy

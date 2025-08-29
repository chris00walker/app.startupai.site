# Minimal Data Model Additions (Postgres)

Tables to support orchestration, evaluations, and learning loops.

## events

- `id`, `workflow_id`, `agent`, `type`, `payload_jsonb`, `created_at`
- Immutable event log

## feedback

- `id`, `artefact_id`, `signal`, `edit_distance`, `time_to_accept`, `user_id`, `created_at`

## evaluations

- `id`, `artefact_id`, `quality`, `safety`, `completeness`, `latency_ms`, `cost_usd`, `created_at`

## router_decisions

- `id`, `request_id`, `features_jsonb`, `choice`, `reward`, `created_at`

Related:

- Data Architecture: `docs/architecture/data.md`

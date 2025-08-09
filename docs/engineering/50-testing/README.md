# Testing Strategy

- Unit: Focus on pure logic (policy routing, evaluators, renderer steps).
- Integration: Service-to-service via test containers; seeded Postgres.
- E2E: Thin-slice user journey; golden tasks and quality thresholds.
- Non-functional: Load tests to assert SLOs; chaos tests for resilience.

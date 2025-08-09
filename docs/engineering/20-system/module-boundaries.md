# Module Boundaries

- Orchestrator: Coordinates multi-agent flows; policy-driven routing; retries/timeouts.
- Policy Router: Evaluates policy DSL and routes to providers (OpenAI/Vertex AI); guards cost/latency.
- Renderer: Deterministic rendering pipeline with retries and idempotency.
- Evaluators: Task-specific quality evaluators with rubrics; feedback loops to improve prompts/policies.
- Shared: Telemetry, config, validation, client SDKs.

Interactions are defined via the OpenAPI Gateway (`../../architecture/20-contracts/openapi-gateway.yaml`).

# Error Handling and Retries

- Retries: Exponential backoff with jitter; bounded attempts; circuit breaker for downstreams.
- Timeouts: Reasonable per dependency; no unbounded waits.
- Idempotency: Idempotency keys on mutating endpoints; duplicate suppression.
- Dead Letter: Failed async tasks routed to DLQ with alerting and replay procedure.

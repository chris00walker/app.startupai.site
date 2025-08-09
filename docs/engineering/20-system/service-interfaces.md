# Service Interfaces

- External API: As per `docs/architecture/20-contracts/openapi-gateway.yaml`.
- Internal Contracts: gRPC/HTTP between services with explicit schemas; correlation IDs required.
- Error Model: Standard problem+json with error codes; retriable vs non-retriable classification.

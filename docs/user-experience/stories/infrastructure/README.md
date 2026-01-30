---
purpose: "Index for infrastructure user stories"
status: "active"
last_reviewed: "2026-01-30"
last_updated: "2026-01-30"
---

# Infrastructure User Stories

Stories for backend systems, tools, and integrations that enable platform functionality.

## Design Philosophy

Infrastructure stories track technical implementation work that:
1. **Enables other features** - OAuth, rate limiting, email
2. **Implements agent tools** - MCP tools, templates
3. **Connects external systems** - Provider APIs

These stories ensure architectural work is visible in the traceability system alongside user-facing features.

---

## Story ID Allocation

| Prefix | Category | Count | File |
|--------|----------|-------|------|
| `US-MT` | MCP Tools | 35 | [mcp-tools.md](./mcp-tools.md) |
| `US-AT` | Asset Templates | 12 | [asset-templates.md](./asset-templates.md) |
| `US-PA` | Provider APIs | 10 | [provider-apis.md](./provider-apis.md) |
| `US-INF` | Core Infrastructure | 10 | [core-infrastructure.md](./core-infrastructure.md) |
| `US-AP` | Ad Platforms | 8 | [ad-platforms.md](./ad-platforms.md) |
| `US-DA` | Design Assets | 2 | [design-assets.md](./design-assets.md) |
| **Total** | | **77** | |

---

## Story Files

| File | Stories | Purpose |
|------|---------|---------|
| [mcp-tools.md](./mcp-tools.md) | US-MT01-MT35 | All 35 MCP tools (EXISTS, Custom, External, LLM-Based) |
| [asset-templates.md](./asset-templates.md) | US-AT01-AT12 | Blueprint Pattern for landing pages (full pipeline) |
| [provider-apis.md](./provider-apis.md) | US-PA01-PA10 | API clients for 10 integration providers |
| [core-infrastructure.md](./core-infrastructure.md) | US-INF01-INF10 | OAuth fixes, token refresh, email, MCP server |
| [ad-platforms.md](./ad-platforms.md) | US-AP01-AP08 | Meta/Google/LinkedIn ad integration with HITL |
| [design-assets.md](./design-assets.md) | US-DA01-DA02 | Design asset storage, generation logging, Figma integration |

---

## Dependency Diagram

```
                    ┌─────────────────────────────────┐
                    │     US-INF01-INF05              │
                    │  (OAuth, Token Refresh,         │
                    │   Rate Limiting)                │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴─────────────────┐
                    │                                 │
            ┌───────▼───────┐               ┌────────▼────────┐
            │  US-PA01-PA10 │               │  US-BI01-BI05   │
            │ Provider APIs │◄──────────────│ Import/Sync     │
            └───────────────┘               └─────────────────┘

                    ┌─────────────────────────────────┐
                    │     US-INF09-INF10              │
                    │  (MCP Server Deployment)        │
                    └───────────────┬─────────────────┘
                                    │
            ┌───────────────────────┴─────────────────────────┐
            │                       │                         │
    ┌───────▼───────┐       ┌───────▼───────┐       ┌────────▼────────┐
    │  US-MT14-MT23 │       │  US-MT01-MT13 │       │  US-MT24-MT27   │
    │ MCP Custom    │       │  EXISTS Tools │       │  MCP External   │
    └───────────────┘       └───────────────┘       └─────────────────┘
            │
            │
    ┌───────▼───────┐
    │  US-AT01-AT10 │
    │  Templates    │
    └───────────────┘

                    ┌─────────────────────────────────┐
                    │     US-INF06-INF08              │
                    │  (Email Infrastructure)         │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴─────────────────┐
                    │                                 │
            ┌───────▼───────┐               ┌────────▼────────┐
            │   US-AA03     │               │   US-N01-N05    │
            │ Escalation    │               │  Notifications  │
            └───────────────┘               └─────────────────┘
```

---

## Implementation Priority

### Phase 0: Critical Blockers (12h)
| Story | Description | Blocks |
|-------|-------------|--------|
| US-INF01 | Google Drive scope fix | US-PA02, US-BI01 |
| US-INF02 | Airtable PKCE implementation | US-PA03, US-BI01 |
| US-INF03 | Token refresh service | All US-PA* |
| US-INF04-05 | Rate limiting framework | All US-PA* |

### Phase 1: Email & Notifications (5h)
| Story | Description | Blocks |
|-------|-------------|--------|
| US-INF06 | Resend email provider | US-AA03 |
| US-INF07 | Email template system | US-AA03, US-N* |
| US-INF08 | pg_cron scheduled jobs | US-AA03, US-BI02 |

### Phase 2: MCP Tools - EXISTS (4h)
| Story | Description | Used By |
|-------|-------------|---------|
| US-MT01-MT13 | Import crewai_tools | All discovery agents |

### Phase 3: MCP Custom Tools (20h)
| Story | Description | Used By |
|-------|-------------|---------|
| US-INF09 | FastMCP server deployment | All custom tools |
| US-INF10 | MCP-CrewAI integration | Agent tool access |
| US-MT14-MT23 | Custom tool implementations | Various agents |

### Phase 4: Asset Templates (12h)
| Story | Description | Used By |
|-------|-------------|---------|
| US-AT01-AT05 | Landing page blueprints | US-MT20 |
| US-AT06-AT08 | Ad creative templates | US-MT21 |
| US-AT09-AT10 | Image resolution system | US-MT20, US-MT21 |

### Phase 5: Provider APIs (29h)
| Story | Description | Used By |
|-------|-------------|---------|
| US-PA01-PA03 | Document providers (P0) | US-BI01 |
| US-PA07-PA08 | Communication/CRM (P1) | US-BI02 |
| US-PA04-PA06, PA09-PA10 | Others (P2-P3) | US-BI01, US-BI02 |

### Phase 6: LLM-Based Tools (8h)
| Story | Description | Used By |
|-------|-------------|---------|
| US-MT28-MT35 | Structured output tools | Synthesis, scoring agents |

**Total Estimated: ~90 hours**

---

## Master Architecture References

| Document | Relationship |
|----------|--------------|
| [tool-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-specifications.md) | Authoritative tool specs |
| [tool-mapping.md](../../../../../startupai-crew/docs/master-architecture/reference/tool-mapping.md) | Agent-to-tool matrix |
| [agent-specifications.md](../../../../../startupai-crew/docs/master-architecture/reference/agent-specifications.md) | All 43 agent configs |
| [approval-workflows.md](../../../../../startupai-crew/docs/master-architecture/reference/approval-workflows.md) | HITL checkpoint patterns |
| [state-schemas.md](../../../../../startupai-crew/docs/master-architecture/reference/state-schemas.md) | Pydantic state models |

---

## Test File Mapping (Planned)

| Story Prefix | E2E Test File | Unit Test Location |
|--------------|---------------|-------------------|
| `US-MT` | `37-mcp-tools.spec.ts` | `startupai-crew/tests/tools/` |
| `US-AT` | `38-asset-templates.spec.ts` | `startupai-crew/tests/templates/` |
| `US-PA` | `39-provider-apis.spec.ts` | `frontend/tests/integrations/` |
| `US-INF` | `40-infrastructure.spec.ts` | Various |
| `US-AP` | `41-ad-platforms.spec.ts` | `startupai-crew/tests/ads/` |

---

**Last Updated**: 2026-01-30

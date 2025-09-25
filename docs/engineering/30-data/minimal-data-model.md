# CWC Agentic Platform Data Models (Supabase)

Platform-specific tables for cwc-agentic-platform functionality. 

**Note:** Core user authentication and profiles are managed in shared Supabase instance.
**Reference:** [Shared Database Schema](../../../startupai.site/docs/technical/two-site-implementation-plan.md#database-schema)

## Platform-Specific Tables

### projects
- `id`, `user_id`, `name`, `description`, `customer_segment`, `status`, `created_at`, `updated_at`
- User projects and business validation initiatives

### hypotheses
- `id`, `project_id`, `statement`, `category` (desirability/feasibility/viability), `confidence_score`, `status`, `created_at`
- Business assumptions and hypotheses to validate

### evidence
- `id`, `project_id`, `hypothesis_id`, `type`, `source_url`, `content`, `confidence_score`, `created_at`
- Evidence collected to support or refute hypotheses

### experiments
- `id`, `project_id`, `hypothesis_id`, `name`, `description`, `status`, `results`, `created_at`
- Validation experiments and their outcomes

### ai_workflows
- `id`, `project_id`, `workflow_type`, `input_data`, `output_data`, `status`, `crew_run_id`, `created_at`
- CrewAI workflow executions and results

### reports
- `id`, `project_id`, `type`, `content`, `generated_at`, `shared_token`
- AI-generated reports and business model canvases

## Cross-Site Integration Tables

### handoff_tokens
- `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`
- Track authentication handoff tokens from startupai.site

### analytics_events
- `id`, `user_id`, `event_type`, `site`, `properties`, `created_at`
- Cross-site user behavior tracking

## Related Documentation

- **Shared Authentication Schema:** [Implementation Plan - Phase 1](../../../startupai.site/docs/technical/two-site-implementation-plan.md#21-supabase-setup--configuration)
- **Cross-Site Integration:** [MVP Spec - Integration Requirements](../../../startupai.site/docs/product/mvp-specification.md#03-cross-site-integration-requirements)

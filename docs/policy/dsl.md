# Policy Router & DSL

## Design Overview

- Agent-level Mixture-of-Experts routed by task type, domain, PII sensitivity, SLOs, historical evaluations, and budget.
- v1: rule-based thresholds and provider preferences.
- v2: contextual bandits; reward = quality − cost − latency penalties; features/logs in Vertex AI Feature Store; versions tracked in Vertex Experiments/Registry.

## Policy DSL (Example)

```yaml
version: 1
routes:
  - match:
      task: "render"
      pii: "low"
      budget_tier: "standard"
    choose:
      provider_order: ["LocalAdapter", "OpenAIAdapter"]
      model: "gpt-4o-mini"
      max_cost_usd: 0.05
      latency_p95_ms: 8000
  - match:
      task: "analysis"
      pii: "high"
    choose:
      provider_order: ["VertexAIAdapter"]
      model: "gemini-1.5-pro-safe"
      context_policy: "minimal"
```

## eCommerce Presets (DSL)

```yaml
version: 1
presets:
  ecommerce:
    starter:
      budget_usd: 250
      channels: [meta_ads]
      experiments: [smoke_page, price_probe, fake_door]
      evaluator_targets:
        ctr_min: 0.8%
        cvr_intent_min: 2.0%
        price_elasticity_delta_min: 10%
    standard:
      budget_usd: 650
      channels: [meta_ads, tiktok_ads]
      experiments: [smoke_page, creative_audience_matrix, checkout_emu]
      evaluator_targets:
        ctr_min: 1.0%
        cvr_intent_min: 2.5%
    premium:
      budget_usd: 1500
      channels: [meta_ads, tiktok_ads, search]
      experiments: [smoke_page, matrix, checkout_emu, price_ladder, waitlist_followup]
      evaluator_targets:
        ctr_min: 1.2%
        cvr_intent_min: 3.0%
```

## Budget Guardrails & Downgrade Rules

- Enforce per-tier spend caps; reduce matrix size or switch to lower-cost channels when nearing caps.
- Prefer evidence convergence over absolute thresholds when signal is scarce (solopreneurs/idea-stage).

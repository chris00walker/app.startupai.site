---
purpose: "Documentation for onboarding stage progression system"
status: "active"
last_reviewed: "2026-01-18"
---

# Stage Progression System

## Overview

The onboarding journey consists of 7 stages. Users progress through stages as they cover required topics in conversation with Alex (the AI guide). Progression is determined by topic coverage, not tool calls.

> **Architecture**: See [ADR-004: Two-Pass Onboarding](../../startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md)

## Key Change (Jan 2026)

The previous tool-based progression (`assessQuality`, `advanceStage`, `completeOnboarding`) was replaced with Two-Pass Architecture:

| Old Approach | New Approach |
|--------------|--------------|
| LLM calls tools to advance | Backend assesses after each message |
| Tool schemas caused errors | Deterministic quality assessment |
| Unpredictable progression | Consistent topic-based progression |

## Configuration Source

**Single source of truth**: `frontend/src/lib/onboarding/founder-stages-config.ts`

This file defines:
- Stage numbers (1-7)
- Stage names and descriptions
- Key questions per stage
- Required data fields (`dataToCollect`)
- Data topics for progress tracking

## The 7 Stages

| Stage | Name | Topics | Progress Range |
|-------|------|--------|----------------|
| 1 | Welcome & Introduction | 4 | 0-14% |
| 2 | Customer Discovery | 4 | 14-28% |
| 3 | Problem Definition | 4 | 28-42% |
| 4 | Solution Validation | 4 | 42-56% |
| 5 | Competitive Analysis | 4 | 56-70% |
| 6 | Resources & Constraints | 5 | 70-85% |
| 7 | Goals & Next Steps | 4 | 85-100% |

### Stage 1: Welcome & Introduction

**Purpose**: Understand the founder and their business concept.

**Data to Collect**:
- `business_concept` - Core business idea
- `inspiration` - Why pursuing this idea
- `current_stage` - Where they are now
- `founder_background` - Relevant experience

**Key Questions**:
- What business are you building?
- What inspired this idea?
- How far along are you?

### Stage 2: Customer Discovery

**Purpose**: Identify target customers and their behaviors.

**Data to Collect**:
- `target_customers` - Who they're serving
- `customer_segments` - Market segments
- `current_solutions` - How customers solve problem today
- `customer_behaviors` - Buying patterns

### Stage 3: Problem Definition

**Purpose**: Deeply understand the problem being solved.

**Data to Collect**:
- `problem_description` - The core problem
- `pain_level` - Severity of the pain
- `frequency` - How often it occurs
- `problem_evidence` - Proof the problem exists

### Stage 4: Solution Validation

**Purpose**: Evaluate the proposed solution.

**Data to Collect**:
- `solution_description` - What they're building
- `solution_mechanism` - How it works
- `unique_value_prop` - Why it's different
- `differentiation` - Competitive advantage

### Stage 5: Competitive Analysis

**Purpose**: Understand the competitive landscape.

**Data to Collect**:
- `competitors` - Direct competitors
- `alternatives` - Indirect alternatives
- `switching_barriers` - What keeps customers elsewhere
- `competitive_advantages` - Defensible moats

### Stage 6: Resources & Constraints

**Purpose**: Assess available resources and limitations.

**Data to Collect**:
- `budget_range` - Available funding
- `available_resources` - Team, tools, networks
- `constraints` - Limitations to work within
- `team_capabilities` - Skills available
- `available_channels` - Go-to-market options

### Stage 7: Goals & Next Steps

**Purpose**: Define validation priorities and experiments.

**Data to Collect**:
- `short_term_goals` - 30-90 day objectives
- `success_metrics` - How to measure progress
- `priorities` - What to validate first
- `first_experiment` - Initial validation step

## Progression Logic

### How Stages Advance

```
User sends message
    ↓
Pass 1: /api/chat/stream
    → AI responds conversationally
    ↓
Pass 2: /api/chat/save
    → Backend runs quality assessment
    → Identifies topics covered
    → Updates stage_progress
    → If all topics covered → advance to next stage
```

### Progress Calculation

```typescript
// From founder-quality-assessment.ts
const topicsCovered = identifyTopicsCovered(conversation, currentStage);
const requiredTopics = stageConfig.dataToCollect.length;
const stageProgress = (topicsCovered.length / requiredTopics) * 100;

if (stageProgress >= 100) {
  // Advance to next stage
  newStage = currentStage + 1;
  stageProgress = 0;
}

// Overall progress
overallProgress = ((currentStage - 1) / 7 * 100) + (stageProgress / 7);
```

### Quality Signals

The assessment also calculates quality signals:

| Signal | Description | Range |
|--------|-------------|-------|
| `clarity` | How clear responses are | 0.0-1.0 |
| `completeness` | How thorough responses are | 0.0-1.0 |
| `detail` | Level of specific detail | 0.0-1.0 |

These signals are stored in `stage_data.quality_signals` but don't gate progression.

## Key Files

| File | Purpose |
|------|---------|
| `lib/onboarding/founder-stages-config.ts` | Stage definitions |
| `lib/onboarding/founder-quality-assessment.ts` | Assessment logic |
| `lib/onboarding/consultant-stages-config.ts` | Consultant variant |
| `lib/onboarding/consultant-quality-assessment.ts` | Consultant assessment |
| `app/api/chat/save/route.ts` | Orchestrates assessment |

## Database Fields

### `onboarding_sessions` Table

| Field | Purpose |
|-------|---------|
| `current_stage` | Current stage number (1-7) |
| `stage_progress` | Progress within current stage (0-100) |
| `overall_progress` | Overall completion (0-100) |
| `stage_data` | JSONB with extracted data per stage |
| `stage_data.brief` | Accumulated brief data |
| `stage_data.quality_signals` | Quality assessment results |

### Stage Data Structure

```jsonc
{
  "brief": {
    "business_concept": "AI validation platform",
    "target_customers": "Startup founders",
    // ... accumulated across all stages
  },
  "quality_signals": {
    "clarity": 0.85,
    "completeness": 0.72,
    "detail": 0.68
  },
  "stage_1": {
    "topics_covered": ["business_concept", "inspiration"],
    "completed_at": "2026-01-18T10:00:00Z"
  }
}
```

## Consultant vs Founder Stages

Consultants have a different stage configuration:

| Founder Stages | Consultant Stages |
|----------------|-------------------|
| Problem-focused | Practice-focused |
| 7 stages | 7 stages |
| Different data fields | Different data fields |

See `consultant-stages-config.ts` for consultant stage definitions.

## Testing

### Unit Tests

- `frontend/src/__tests__/lib/onboarding/founder-stages-config.test.ts`
- `frontend/src/__tests__/lib/onboarding/founder-quality-assessment.test.ts`
- `frontend/src/__tests__/lib/onboarding/consultant-stages-config.test.ts`

### Manual Testing

1. Start onboarding as founder
2. Provide information for each topic
3. Watch sidebar update stage number
4. Verify progress bar advances
5. Complete all 7 stages
6. Verify completion flow triggers

## Related Documentation

- **API Spec**: [specs/api-onboarding.md](../specs/api-onboarding.md)
- **Architecture**: [overview/architecture.md](../overview/architecture.md)
- **ADR-004**: `startupai-crew/docs/adr/004-two-pass-onboarding-architecture.md`

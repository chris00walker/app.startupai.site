# Documentation Consolidation Recommendation

**Status**: Proposal | **Author**: technical-writer | **Date**: 2026-02-01

---

## Executive Summary

The current documentation structure has **5 critical single-source-of-truth violations** and **3 orphaned/misplaced folders**. This document provides a complete audit, identifies specific problems, and proposes a consolidation plan.

**Recommended actions**:
1. Merge `docs/validation/` into `docs/work/` (assumptions already live in both places)
2. Archive `docs/status/` (linting artifacts, not status tracking)
3. Clarify the `specs/` vs `features/` boundary (currently overlapping)
4. Move `docs/design/` Figma work artifacts to `docs/work/` or archive
5. Relocate `docs/project-governance.md` to `docs/work/`

---

## Part 1: Audit Findings

### Current Structure

```
docs/
+-- README.md                    # Index (well-maintained)
+-- project-governance.md        # MISPLACED - governance doc at root
+-- archive/                     # Historical content (appropriate)
+-- design/                      # NEW - Figma integration artifacts
+-- features/                    # Feature specifications
+-- specs/                       # Technical specifications
+-- status/                      # MISPLACED - linting artifacts, not status
+-- testing/                     # Test documentation
+-- traceability/                # Story-code mapping (well-organized)
+-- user-experience/             # UX docs (well-organized)
+-- validation/                  # REDUNDANT - overlaps with work/
+-- work/                        # Work tracking (primary location)
```

### Folder-by-Folder Analysis

| Folder | Intended Purpose | Actual Content | Verdict |
|--------|------------------|----------------|---------|
| `work/` | Sprint tracking, backlog | PROJECT-PLAN.md, WORK.md, roadmap.md, done.md | **PRIMARY** - well-maintained |
| `validation/` | Assumption testing? | assumptions.md, evidence-tracker.md, roadmap.md, startupai-brief.md | **REDUNDANT** - duplicates work/ content |
| `specs/` | Technical specifications | API docs, schema, architecture | **KEEP** - clear purpose |
| `features/` | Feature specifications | Feature inventory, wiring matrix, UI entrypoints | **KEEP** - but clarify boundary |
| `testing/` | Test documentation | TDD workflow, strategy, matrices | **KEEP** - well-organized |
| `user-experience/` | UX documentation | Personas, journeys, stories | **KEEP** - comprehensive |
| `traceability/` | Story-code mapping | story-code-map.json, gap reports | **KEEP** - essential |
| `design/` | Design artifacts | Figma integration docs (13 files) | **NEEDS DECISION** - work artifacts or permanent? |
| `status/` | Project status? | linting-baseline.json, linting.md | **ARCHIVE** - misnamed, linting artifacts |
| `archive/` | Historical content | ADRs, audits, legacy | **KEEP** - appropriate |

---

## Part 2: Specific Problems Identified

### Problem 1: Assumptions Live in Multiple Places (CRITICAL)

**Violation**: Assumptions are documented in 3+ locations with different details.

| Location | Assumption Content | Last Updated |
|----------|-------------------|--------------|
| `work/PROJECT-PLAN.md` | Assumptions Registry with dependency map, status | 2026-02-01 |
| `work/WORK.md` | Assumption Reference table | 2026-01-31 |
| `validation/assumptions.md` | Full test cards with evidence thresholds | 2026-01-20 |
| `project-governance.md` | Methodology Governance with evidence thresholds | 2026-01-31 |

**Issue**: PROJECT-PLAN.md says A4 status is "Testing", validation/assumptions.md says "UNTESTED". Which is authoritative?

**Recommendation**:
- **Single source**: `work/PROJECT-PLAN.md` owns assumption STATUS (Testing/Validated/Invalidated)
- **Reference only**: WORK.md and project-governance.md LINK to PROJECT-PLAN.md, don't duplicate
- **Merge**: `validation/assumptions.md` test cards merge into PROJECT-PLAN.md
- **Delete**: `validation/` folder entirely after merge

---

### Problem 2: Project Status Lives in Multiple Places (CRITICAL)

**Violation**: Phase progress is tracked in multiple documents.

| Location | Status Content | Last Updated |
|----------|----------------|--------------|
| `work/roadmap.md` | Dogfooding journey phases (0-4), milestones | 2026-01-21 |
| `work/PROJECT-PLAN.md` | Two-track execution, phase engineering + dogfooding | 2026-02-01 |
| `validation/roadmap.md` | Phase progress, nearly identical to work/roadmap.md | 2026-01-20 |

**Issue**: `work/roadmap.md` references `validation/assumptions.md` for "full details". Two roadmap files exist with same name.

**Recommendation**:
- **Keep**: `work/PROJECT-PLAN.md` as master (most comprehensive, freshest)
- **Merge**: Content from both roadmap.md files into PROJECT-PLAN.md
- **Delete**: Both `work/roadmap.md` and `validation/roadmap.md`

---

### Problem 3: Evidence Tracking is Scattered (HIGH)

**Violation**: Evidence collection happens in multiple docs.

| Location | Evidence Content |
|----------|------------------|
| `validation/evidence-tracker.md` | Detailed evidence log per assumption |
| `work/PROJECT-PLAN.md` | Gate criteria and evidence requirements |
| `project-governance.md` | Evidence thresholds in Methodology Governance |

**Recommendation**:
- **Merge**: `validation/evidence-tracker.md` into PROJECT-PLAN.md Track 2 section
- **Keep**: Evidence thresholds in project-governance.md (operational reference)

---

### Problem 4: specs/ vs features/ Boundary is Unclear (MEDIUM)

**Current definitions**:
- `specs/README.md`: "describe **how things work**" (technical)
- `features/README.md`: "describe **what things do**" (product)

**Actual overlap**:
- `specs/phase-transitions.md` describes phase flows (could be a feature)
- `specs/hitl-approval-ui.md` describes UI (more feature than spec)
- `features/stage-progression.md` describes onboarding logic (could be a spec)

**Recommendation**:
- **Clarify boundary**: specs/ = APIs, schema, infrastructure. features/ = user-facing capabilities
- **Move**: `specs/hitl-approval-ui.md` to features/
- **Keep**: `specs/phase-transitions.md` (it's internal flow logic)
- **Document**: Add explicit criteria to both README files

---

### Problem 5: status/ Folder is Misnamed (LOW)

**Issue**: `docs/status/` contains linting artifacts, not project status.

```
docs/status/
  linting-baseline.json  (851KB)
  linting.md
```

**Recommendation**:
- **Move**: To `docs/archive/linting/` or delete if not needed
- **Delete**: The `status/` folder

---

### Problem 6: design/ Folder Contains Work Artifacts (NEEDS DECISION)

**Issue**: `docs/design/` has 13 files from recent Figma integration work. Some are:
- Assessment reports (work artifacts)
- Integration specs (should stay)
- Test results (work artifacts)
- Workflow guides (permanent reference)

**Recommendation**:
- **Keep in design/**: `figma-design-system-spec.md`, `figma-workflow-guide.md`, `figma-design-tokens.md`
- **Move to work/**: Assessment reports, test results (or archive when complete)
- **Create README.md**: Define what belongs in design/

---

### Problem 7: project-governance.md is Misplaced (LOW)

**Issue**: Root-level file should be in a folder.

**Recommendation**:
- **Move**: To `docs/work/project-governance.md` (it's operational, like RACI and sprints)

---

## Part 3: Consolidation Plan

### Phase 1: Eliminate validation/ Folder (CRITICAL)

**Action**: Merge 4 files, then delete folder.

| Source File | Action | Destination |
|-------------|--------|-------------|
| `validation/assumptions.md` | Merge test cards into | `work/PROJECT-PLAN.md` Assumptions section |
| `validation/evidence-tracker.md` | Merge evidence log into | `work/PROJECT-PLAN.md` Track 2 section |
| `validation/roadmap.md` | Delete (duplicate) | N/A |
| `validation/startupai-brief.md` | Archive or merge | `archive/business/startupai-brief.md` |

**Result**: All assumption and evidence tracking in PROJECT-PLAN.md.

---

### Phase 2: Eliminate Duplicate roadmap.md

**Action**: Merge and delete.

| Source File | Action |
|-------------|--------|
| `work/roadmap.md` | Content already in PROJECT-PLAN.md; delete |

**Result**: Single roadmap in PROJECT-PLAN.md.

---

### Phase 3: Clean Up Orphaned Folders

| Folder | Action |
|--------|--------|
| `status/` | Move to `archive/linting/` or delete |
| `project-governance.md` | Move to `work/project-governance.md` |

---

### Phase 4: Organize design/

**Action**: Separate permanent docs from work artifacts.

| File | Permanent? | Action |
|------|------------|--------|
| `figma-design-system-spec.md` | Yes | Keep |
| `figma-workflow-guide.md` | Yes | Keep |
| `figma-design-tokens.md` | Yes | Keep |
| `figma-*-assessment.md` | No | Move to work/ |
| `figma-*-test-*.md` | No | Move to work/ |
| `404-og-image-spec.md` | Yes | Keep |
| `brand-review-404-compass.md` | No | Move to work/ |

---

### Phase 5: Document Boundaries

**Action**: Update README files in each folder.

| Folder | Add to README |
|--------|---------------|
| `specs/` | "Technical how: APIs, schema, infrastructure. NOT UI specs." |
| `features/` | "Product what: user-facing capabilities, UI entrypoints. NOT API routes." |
| `work/` | "Operational: sprints, backlog, assumptions, project plan, governance." |
| `design/` | "Permanent design system docs. Work artifacts go to work/." |

---

## Part 4: Proposed Final Structure

```
docs/
+-- README.md                    # Index
+-- archive/                     # Historical content
|   +-- linting/                 # Moved from status/
|   +-- business/                # startupai-brief.md moved here
|   +-- ...
+-- design/                      # Permanent design system docs
|   +-- README.md                # NEW - defines what belongs
|   +-- figma-design-system-spec.md
|   +-- figma-workflow-guide.md
|   +-- figma-design-tokens.md
|   +-- component-specs/
|   +-- ux-specs/
+-- features/                    # Feature specifications (what)
+-- specs/                       # Technical specifications (how)
+-- testing/                     # Test documentation
+-- traceability/                # Story-code mapping
+-- user-experience/             # UX documentation
+-- work/                        # Operational (consolidated)
    +-- README.md
    +-- PROJECT-PLAN.md          # MASTER: critical path, assumptions, evidence
    +-- WORK.md                  # Sprint, backlog (references PROJECT-PLAN.md)
    +-- done.md                  # Completion history
    +-- project-governance.md    # Moved from root
    +-- cross-repo-blockers.md
    +-- figma-*.md               # Work artifacts moved here
```

---

## Part 5: Single Source of Truth Matrix

After consolidation, exactly ONE authoritative location for each concept:

| Concept | Authoritative Source | Other Docs May |
|---------|---------------------|----------------|
| **Assumptions (A1-A11)** | `work/PROJECT-PLAN.md` | Link only |
| **Assumption Status** | `work/PROJECT-PLAN.md` | Link only |
| **Test Cards** | `work/PROJECT-PLAN.md` | Reference by ID |
| **Evidence Log** | `work/PROJECT-PLAN.md` | Link only |
| **Phase Progress** | `work/PROJECT-PLAN.md` | Link only |
| **Sprint Items** | `work/WORK.md` | Link only |
| **RACI Matrix** | `work/project-governance.md` | Link only |
| **Governance Rules** | `work/project-governance.md` | Link only |
| **API Specs** | `specs/api-*.md` | Link only |
| **Database Schema** | `specs/data-schema.md` | Link only |
| **Feature Status** | `features/feature-inventory.md` | Link only |
| **User Stories** | `user-experience/stories/` | Link only |
| **Test Coverage** | `testing/journey-test-matrix.md` | Link only |
| **Story-Code Map** | `traceability/story-code-map.json` | Link only |
| **Design System** | `design/figma-design-system-spec.md` | Link only |

---

## Part 6: Migration Path

### Step 1: Backup (Day 1)
```bash
# Create backup before any changes
git checkout -b docs/consolidation-backup
git add -A && git commit -m "docs: backup before consolidation"
```

### Step 2: Merge validation/ into work/ (Day 1)
1. Copy test card content from `validation/assumptions.md` into PROJECT-PLAN.md
2. Copy evidence log from `validation/evidence-tracker.md` into PROJECT-PLAN.md
3. Move `validation/startupai-brief.md` to `archive/business/`
4. Delete `validation/` folder

### Step 3: Delete duplicate roadmap.md (Day 1)
1. Verify all content from `work/roadmap.md` exists in PROJECT-PLAN.md
2. Delete `work/roadmap.md`

### Step 4: Move status/ (Day 1)
1. Create `archive/linting/`
2. Move `status/*` to `archive/linting/`
3. Delete `status/`

### Step 5: Move project-governance.md (Day 1)
1. Move `docs/project-governance.md` to `docs/work/project-governance.md`
2. Update references in WORK.md and PROJECT-PLAN.md

### Step 6: Organize design/ (Day 2)
1. Create `design/README.md` with scope definition
2. Move work artifacts to `work/`

### Step 7: Update cross-references (Day 2)
1. Update all internal links in affected files
2. Update `docs/README.md` index
3. Run link checker

### Step 8: Update docs-registry.json (Day 2)
1. Remove deleted files from registry
2. Add new file locations
3. Regenerate knowledge index

---

## Approval Request

**Founder decision needed on**:

1. **Merge validation/ into work/?** (Recommended: Yes)
2. **Delete duplicate roadmap.md?** (Recommended: Yes)
3. **Archive status/ folder?** (Recommended: Yes)
4. **Move project-governance.md?** (Recommended: Yes)
5. **Organize design/ folder?** (Recommended: Yes, with defined scope)

Please review and provide approval or modifications.

---

**Last Updated**: 2026-02-01

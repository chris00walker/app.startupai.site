# Backlog

Prioritized by validation impact. Items testing assumptions rank higher.

## Priority Key

- **P1**: Tests a key assumption or unblocks validation
- **P2**: Improves user experience or platform quality
- **P3**: Future enhancement, nice to have

## P1: Validation-Critical

| Item | Assumption | Phase | Notes |
|------|------------|-------|-------|
| Landing page A/B test | A5 | 2 | VPD messaging resonance |
| IH community launch | A8 | 2 | Channel validation |
| Consultant marketing | A6 | 2-3 | Portfolio value proposition |
| Field-level edit tracking | A3 | 0-1 | Brief accuracy measurement |
| HITL Approval UI data source | A1 | 1 | Trust signal improvement |

## P2: Platform Quality

| Item | Effort | Notes |
|------|--------|-------|
| Documentation refresh | 8h | 71-day staleness gap |
| Journey-Driven Testing | 2 days | Derive tests from journey maps |
| PostHog Quick Start + HITL events | 4h | Add events for new Quick Start flow (48 types defined, 100+ calls exist) |
| VPC geometric shapes | 2-3h | Visual polish |
| HITL comment display | 2-4h | Show human_comment in UI |

## P3: Future Enhancements

| Item | Effort | Notes |
|------|--------|-------|
| PDF/PowerPoint export | 3-5 days | External sharing |
| Canvas versioning | 5-7 days | History tracking |
| Multi-segment VPC comparison | 3-5 days | Side-by-side analysis |
| Drag-and-drop VPC fit mapping | 8+h | Interactive UX |
| Internationalisation | TBD | Locale support |

## Completed (Move to done.md)

Items here have been delivered but not yet moved to done.md:

- ~~Quick Start Architecture~~ → Moved 2026-01-21
- ~~Two-Pass Architecture~~ → Moved 2026-01-21

## Triage Rules

1. **Does it test an assumption?** → P1
2. **Does it unblock a validation phase?** → P1
3. **Does it improve quality without testing assumptions?** → P2
4. **Is it a "nice to have" with no validation impact?** → P3

Review weekly. Promote to in-progress.md when starting work.

---

**Last Updated**: 2026-01-21

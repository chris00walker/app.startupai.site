**Audit Report: User Stories & Journey Map Quality**

### 0) Files Reviewed
| Path | Why it matters |
|---|---|
| `docs/user-experience/user-stories.md` | Primary backlog of user stories and acceptance criteria. |
| `docs/user-experience/user-personas.md` | Personas, lifecycle states, billing states, and behavioral context. |
| `docs/user-experience/founder-journey-map.md` | Founder end-to-end journey steps and touchpoints. |
| `docs/user-experience/consultant-journey-map.md` | Consultant journey steps and client workflow touchpoints. |
| `docs/user-experience/founder-trial-journey-map.md` | Founder trial flow and conversion touchpoints. |
| `docs/user-experience/consultant-trial-journey-map.md` | Consultant trial flow with mock clients. |
| `docs/user-experience/admin-journey-map.md` | Admin workflow journey and operational touchpoints. |
| `docs/user-experience/support-journey-map.md` | Support and GDPR flows that cut across roles. |
| `docs/user-experience/offboarding-journey-map.md` | Cancellation, retention, and win-back flows. |
| `docs/user-experience/billing-journey-map.md` | Billing lifecycle and compliance flows. |
| `docs/user-experience/notification-journey-map.md` | Notification and escalation flows. |
| `docs/user-experience/account-settings-journey-map.md` | Security/profile management flows. |

### 1) Executive Summary
- Major: US-O03 retention timeline ambiguity conflicts with journey policy and lifecycle states (`docs/user-experience/user-stories.md:1735`, `docs/user-experience/offboarding-journey-map.md:305`, `docs/user-experience/user-personas.md:635`).
- Major: US-B05 refund policy is underspecified vs the refund policy defined in the billing journey map (`docs/user-experience/user-stories.md:1906`, `docs/user-experience/billing-journey-map.md:658`).
- Major: US-N04 escalation timeline omits steps defined in the notification journey map (`docs/user-experience/user-stories.md:2135`, `docs/user-experience/notification-journey-map.md:432`).
- Overall quality: Medium; story coverage is broad with clear AC, but several policy inconsistencies and missing touchpoint coverage remain.
- TDD readiness: Medium; AC exist for most stories, but inconsistent policies and missing story coverage will cause test churn and ambiguous expected behavior.

### 2) Traceability Matrix (Journey ↔ Stories)
JM IDs assigned per journey file: Stage = phase/section order; Touchpoint = step order within stage.

**Founder Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/founder-journey-map.md` Step 1: Landing Page Discovery | Missing | Missing | Marketing moment of truth has no story. |
| JM-1.2 `docs/user-experience/founder-journey-map.md` Step 2: Pricing Page Evaluation | Missing | Missing | Plan selection not captured in stories. |
| JM-1.3 `docs/user-experience/founder-journey-map.md` Step 3: Signup Process | Missing | Missing | Signup not captured in stories. |
| JM-2.1 `docs/user-experience/founder-journey-map.md` Step 4: Login/OAuth | Missing | Missing | Auth journey not captured in stories. |
| JM-3.1 `docs/user-experience/founder-journey-map.md` Step 5: Quick Start Form | US-F01, US-F07 (`docs/user-experience/user-stories.md`) | Covered | Core onboarding. |
| JM-3.2 `docs/user-experience/founder-journey-map.md` Step 6: Workflow Trigger | US-F01, US-F08 (`docs/user-experience/user-stories.md`) | Covered | Progress story overlaps. |
| JM-3.3 `docs/user-experience/founder-journey-map.md` Step 7: AI Processing | US-F08 (`docs/user-experience/user-stories.md`) | Covered | Progress story is large. |
| JM-4.1 `docs/user-experience/founder-journey-map.md` Step 8: Results Presentation | US-F02, US-F06, US-F03 (`docs/user-experience/user-stories.md`) | Covered | HITL + results. |
| JM-4.2 `docs/user-experience/founder-journey-map.md` Step 9: Action Planning | Missing | Missing | No story for action planning. |
| JM-5.1 `docs/user-experience/founder-journey-map.md` Get Help | US-S01 to US-S05 (`docs/user-experience/user-stories.md`) | Covered | Cross-cutting help. |

**Consultant Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/consultant-journey-map.md` Step 1: Landing Page Discovery | Missing | Missing | No story for consultant acquisition. |
| JM-1.2 `docs/user-experience/consultant-journey-map.md` Step 2: Pricing Evaluation | Missing | Missing | Pricing decision not captured. |
| JM-1.3 `docs/user-experience/consultant-journey-map.md` Step 3: Signup Process | Missing | Missing | Signup not captured. |
| JM-1.4 `docs/user-experience/consultant-journey-map.md` Step 4: OAuth Authentication | Missing | Missing | Auth flow not captured. |
| JM-2.1 `docs/user-experience/consultant-journey-map.md` Step 5: Practice Profile Form | US-C01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/consultant-journey-map.md` Step 6: Form Fields | US-C01 (`docs/user-experience/user-stories.md`) | Partial | Field-level detail not in AC. |
| JM-2.3 `docs/user-experience/consultant-journey-map.md` Step 7: Setup Completion | US-C01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/consultant-journey-map.md` Step 8: Dashboard Intro | US-C03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.2 `docs/user-experience/consultant-journey-map.md` Step 9: Create Invite | US-C02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.3 `docs/user-experience/consultant-journey-map.md` Step 10: Client Signup | US-C02 (`docs/user-experience/user-stories.md`) | Partial | Client actor not represented. |
| JM-3.4 `docs/user-experience/consultant-journey-map.md` Step 11: Client Quick Start | US-C07 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/consultant-journey-map.md` Step 12: Portfolio View | US-C03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.2 `docs/user-experience/consultant-journey-map.md` Step 13: Metrics Review | US-C03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.1 `docs/user-experience/consultant-journey-map.md` Step 14: Client Detail | US-C04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.2 `docs/user-experience/consultant-journey-map.md` Step 15: HITL Monitoring | US-C04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-6.1 `docs/user-experience/consultant-journey-map.md` Step 16: Archive Client | US-C05 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-6.2 `docs/user-experience/consultant-journey-map.md` Step 17: Restore Client | US-C05 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-6.3 `docs/user-experience/consultant-journey-map.md` Step 18: Client Unlink | US-E06 (`docs/user-experience/user-stories.md`) | Covered | Edge-case story. |
| JM-7.1 `docs/user-experience/consultant-journey-map.md` Get Help | US-S01 to US-S05 (`docs/user-experience/user-stories.md`) | Covered |  |

**Founder Trial Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/founder-trial-journey-map.md` Step 1: Trial Signup | US-FT01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/founder-trial-journey-map.md` Step 2: Quick Start | US-FT01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.3 `docs/user-experience/founder-trial-journey-map.md` Step 3: Phase 1 Begins | US-F08 (`docs/user-experience/user-stories.md`) | Covered | Shared progress story. |
| JM-2.1 `docs/user-experience/founder-trial-journey-map.md` Step 4: Trial Dashboard | US-FT02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/founder-trial-journey-map.md` Step 5: Trial Limits | US-FT02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/founder-trial-journey-map.md` Step 6: HITL Review | US-F03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.2 `docs/user-experience/founder-trial-journey-map.md` Step 7: Core Features | US-F06 (`docs/user-experience/user-stories.md`) | Partial | Trial-specific expectations not explicit. |
| JM-3.3 `docs/user-experience/founder-trial-journey-map.md` Step 8: Conversion Triggers | US-FT03 (`docs/user-experience/user-stories.md`) | Partial | Trigger details not explicit. |
| JM-4.1 `docs/user-experience/founder-trial-journey-map.md` Step 9: Upgrade | US-FT03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.2 `docs/user-experience/founder-trial-journey-map.md` Step 10: Post-Upgrade | Missing | Missing | No post-upgrade story. |
| JM-5.1 `docs/user-experience/founder-trial-journey-map.md` Get Help | US-S01 to US-S05 (`docs/user-experience/user-stories.md`) | Covered |  |

**Consultant Trial Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/consultant-trial-journey-map.md` Step 1: Trial Signup | US-CT01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/consultant-trial-journey-map.md` Step 2: Practice Setup | US-CT01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.3 `docs/user-experience/consultant-trial-journey-map.md` Step 3: Mock Clients | US-CT01, US-CT02 (`docs/user-experience/user-stories.md`) | Partial | Mock client provisioning not explicit. |
| JM-2.1 `docs/user-experience/consultant-trial-journey-map.md` Step 4: Portfolio | US-CT02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/consultant-trial-journey-map.md` Step 5: Mock Client Detail | US-CT02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.3 `docs/user-experience/consultant-trial-journey-map.md` Step 6: Trial Status | US-CT04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/consultant-trial-journey-map.md` Step 7: Invite Attempt | US-CT03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/consultant-trial-journey-map.md` Step 8: Upgrade Modal | US-CT03 (`docs/user-experience/user-stories.md`) | Partial | Modal content not explicit. |
| JM-4.2 `docs/user-experience/consultant-trial-journey-map.md` Step 9: Complete Upgrade | US-CT05 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.3 `docs/user-experience/consultant-trial-journey-map.md` Step 10: Post-Upgrade | Missing | Missing | No post-upgrade story. |
| JM-5.1 `docs/user-experience/consultant-trial-journey-map.md` Get Help | US-S01 to US-S05 (`docs/user-experience/user-stories.md`) | Covered |  |

**Admin Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/admin-journey-map.md` Step 1: Admin Login | Missing | Missing | Admin access flow not captured. |
| JM-2.1 `docs/user-experience/admin-journey-map.md` Step 2: User Search | US-A01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/admin-journey-map.md` Step 3: View User Profile | US-A02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.3 `docs/user-experience/admin-journey-map.md` Step 4: Change User Role | US-A08 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/admin-journey-map.md` Step 5: Impersonate User | US-A03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/admin-journey-map.md` Step 6: View System Health | US-A05 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.2 `docs/user-experience/admin-journey-map.md` Step 7: Retry Failed Workflow | US-A04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.1 `docs/user-experience/admin-journey-map.md` Step 8: Manage Feature Flags | US-A06 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-6.1 `docs/user-experience/admin-journey-map.md` Step 9: View Audit Logs | US-A07 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-7.1 `docs/user-experience/admin-journey-map.md` Step 10: Export User Data | US-A09 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-7.2 `docs/user-experience/admin-journey-map.md` Step 11: Data Integrity Check | US-A10 (`docs/user-experience/user-stories.md`) | Covered |  |

**Support Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/support-journey-map.md` Step 1: Access Help Center | US-S02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/support-journey-map.md` Step 2: Browse Knowledge Base | US-S02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.3 `docs/user-experience/support-journey-map.md` Step 3: Search and Find | US-S02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.1 `docs/user-experience/support-journey-map.md` Step 4: Open Support Form | US-S01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/support-journey-map.md` Step 5: Submit Support Request | US-S01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/support-journey-map.md` Step 6: View Support Requests | US-S03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.2 `docs/user-experience/support-journey-map.md` Step 7: View Ticket Detail | US-S03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/support-journey-map.md` Step 8: Request Data Export | US-S04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.2 `docs/user-experience/support-journey-map.md` Step 9: Download Export | US-S04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.1 `docs/user-experience/support-journey-map.md` Step 10: Initiate Deletion | US-S05 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.2 `docs/user-experience/support-journey-map.md` Step 11: Confirm Deletion | US-S05 (`docs/user-experience/user-stories.md`) | Covered |  |

**Offboarding Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/offboarding-journey-map.md` Step 1: Access Cancellation | US-O01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/offboarding-journey-map.md` Step 2: Confirmation | US-O01 (`docs/user-experience/user-stories.md`) | Partial | Pause/downgrade not in story. |
| JM-1.3 `docs/user-experience/offboarding-journey-map.md` Step 3: Processed | US-O01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.1 `docs/user-experience/offboarding-journey-map.md` Step 4: Exit Survey | US-O02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/offboarding-journey-map.md` Step 5: Data Retention | US-O03 (`docs/user-experience/user-stories.md`) | Partial | Timeline mismatch. |
| JM-4.1 `docs/user-experience/offboarding-journey-map.md` Step 6: Reactivation | US-O04 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.1 `docs/user-experience/offboarding-journey-map.md` Step 7: Win-Back | US-O05 (`docs/user-experience/user-stories.md`) | Partial | Missing day 60/90 emails. |

**Billing Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/billing-journey-map.md` Step 1: Billing Dashboard | US-B01 (`docs/user-experience/user-stories.md`) | Partial | Dashboard summary not in AC. |
| JM-1.2 `docs/user-experience/billing-journey-map.md` Step 2: Billing History | US-B01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.3 `docs/user-experience/billing-journey-map.md` Step 3: Download Invoice | US-B02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.1 `docs/user-experience/billing-journey-map.md` Step 4: Update Payment Method | US-B03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/billing-journey-map.md` Step 5: Backup Method | US-B03 (`docs/user-experience/user-stories.md`) | Partial | Backup method not explicit. |
| JM-3.1 `docs/user-experience/billing-journey-map.md` Step 6: Payment Failure | US-B04 (`docs/user-experience/user-stories.md`) | Partial | Dunning timeline missing. |
| JM-3.2 `docs/user-experience/billing-journey-map.md` Step 7: Recovery | US-B10 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/billing-journey-map.md` Step 8: Change Plan | US-B06 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.2 `docs/user-experience/billing-journey-map.md` Step 9: Switch Billing Cycle | US-B09 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-5.1 `docs/user-experience/billing-journey-map.md` Step 10: Tax Invoice | US-B07 (`docs/user-experience/user-stories.md`) | Partial | Scope not defined. |
| JM-6.1 `docs/user-experience/billing-journey-map.md` Step 11: Refund | US-B05 (`docs/user-experience/user-stories.md`) | Partial | Policy mismatch. |
| JM-6.2 `docs/user-experience/billing-journey-map.md` Step 12: Promo Code | US-B08 (`docs/user-experience/user-stories.md`) | Covered |  |

**Notification Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/notification-journey-map.md` Step 1: In-App Notification | US-N01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/notification-journey-map.md` Step 2: Real-Time Updates | US-N01 (`docs/user-experience/user-stories.md`) | Partial | Real-time behavior not explicit. |
| JM-2.1 `docs/user-experience/notification-journey-map.md` Step 3: Email Notification | US-N02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.1 `docs/user-experience/notification-journey-map.md` Step 4: Preferences | US-N03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/notification-journey-map.md` Step 5: Escalation | US-N04 (`docs/user-experience/user-stories.md`) | Partial | Timeline mismatch. |
| JM-5.1 `docs/user-experience/notification-journey-map.md` Step 6: Unsubscribe | US-N05 (`docs/user-experience/user-stories.md`) | Covered |  |

**Account Settings Journey Map**
| Journey Touchpoint ID + File Path | Supporting Story IDs + File Paths | Coverage | Notes |
|---|---|---|---|
| JM-1.1 `docs/user-experience/account-settings-journey-map.md` Step 1: View Profile | US-AS01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-1.2 `docs/user-experience/account-settings-journey-map.md` Step 2: Update Profile | US-AS01 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.1 `docs/user-experience/account-settings-journey-map.md` Step 3: Change Password | US-AS02 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-2.2 `docs/user-experience/account-settings-journey-map.md` Step 4: Forgot Password | US-AS02 (`docs/user-experience/user-stories.md`) | Partial | Full flow detail missing. |
| JM-3.1 `docs/user-experience/account-settings-journey-map.md` Step 5: Enable 2FA | US-AS03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-3.2 `docs/user-experience/account-settings-journey-map.md` Step 6: Disable 2FA | US-AS03 (`docs/user-experience/user-stories.md`) | Covered |  |
| JM-4.1 `docs/user-experience/account-settings-journey-map.md` Step 7: Login History | US-AS04 (`docs/user-experience/user-stories.md`) | Partial | Suspicious criteria not explicit. |
| JM-5.1 `docs/user-experience/account-settings-journey-map.md` Step 8: Connected Devices | US-AS05 (`docs/user-experience/user-stories.md`) | Covered |  |

### 3) Detailed Findings by User Story
Story: US-H03 — Missing HITL checkpoint story
Source: `docs/user-experience/user-stories.md:958` (coverage summary claims US-H01-H09) and absence between US-H02 and US-H04 (`docs/user-experience/user-stories.md:1049`, `docs/user-experience/user-stories.md:1079`)
Mapped Journey Touchpoints: Unmapped (no journey touchpoint defined)

Issues Identified:
- Inconsistency: Story count claims 9 HITL stories but only 8 are defined.
- Insufficiency: Missing definition blocks traceability and confirmation criteria.

Severity: Major
Confidence: High
Why it matters (risk): A missing checkpoint story breaks auditability of approvals and makes tests ambiguous or incomplete.

Recommendation (actionable):
- Rewrite: Add US-H03 (or update numbering to remove it) with clear persona and value statement.
- Split: If US-H03 is obsolete, update counts and references to avoid ghost requirements.
- Acceptance Criteria: Define trigger, decision options, and downstream effects for the missing checkpoint.
- Open Questions: Which HITL checkpoint is intended between US-H02 and US-H04, and is it still required?

Story: US-O03 — View Data Retention Notice
Source: `docs/user-experience/user-stories.md:1735`
Mapped Journey Touchpoints: JM-3.1 `docs/user-experience/offboarding-journey-map.md` Step 5

Issues Identified:
- Inconsistency: AC says "30-day grace, 90-day retention" which can imply 120 days total, while the journey map defines day 0-30 grace, day 31-90 retention (`docs/user-experience/offboarding-journey-map.md:307`) and lifecycle states show retention as 60 days (`docs/user-experience/user-personas.md:635`).
- Ambiguity: "data retention period is ending" does not specify the exact day.

Severity: Major
Confidence: High
Why it matters (risk): Conflicting timelines create legal and UX exposure (incorrect promises about data deletion).

Recommendation (actionable):
- Rewrite: "As a cancelled user, I want a clear timeline for grace (days 0-30), retention (days 31-90), and purge (after day 90), so that I can decide whether to reactivate."
- Acceptance Criteria: Specify the exact day ranges, access level by range, and the reminder trigger (e.g., 7 days before day 90).
- Open Questions: Is retention 90 total days since cancellation or 90 days after grace?

Story: US-O05 — Win-Back Email Response
Source: `docs/user-experience/user-stories.md:1785`
Mapped Journey Touchpoints: JM-5.1 `docs/user-experience/offboarding-journey-map.md` Step 7

Issues Identified:
- Inconsistency: Story includes day 7 and day 30 emails, but the journey map defines a 7/30/60/90 day sequence with offers (`docs/user-experience/offboarding-journey-map.md:463`).
- Insufficiency: No acceptance criteria for the day 60 and day 90 notifications.

Severity: Major
Confidence: High
Why it matters (risk): Win-back workflows will be implemented differently depending on which artifact is used.

Recommendation (actionable):
- Rewrite: Include the full 7/30/60/90 sequence and clarify the offer and CTA for each email.
- Acceptance Criteria: Add G/W/T for day 60 and day 90 messages and the reactivation link behavior.
- Open Questions: Are the discount offers (10% and 30%) fixed or experimental?

Story: US-B04 — Handle Payment Failure
Source: `docs/user-experience/user-stories.md:1881`
Mapped Journey Touchpoints: JM-3.1 `docs/user-experience/billing-journey-map.md` Step 6

Issues Identified:
- Insufficiency: Story omits the dunning timeline and access changes defined in the billing journey map (`docs/user-experience/billing-journey-map.md:332`) and the lifecycle dunning schedule in personas (`docs/user-experience/user-personas.md:699`).
- Complexity: Bundles UI, email, and state restoration in a single story without defined triggers.

Severity: Major
Confidence: High
Why it matters (risk): Without a clear timeline, engineering cannot implement or test the correct access and notification behavior.

Recommendation (actionable):
- Split: US-B04a "Notify and guide payment recovery" and US-B04b "Dunning schedule and access state transitions".
- Acceptance Criteria: Add specific timing for retries, email cadence, and access changes aligned to the dunning schedule.
- Open Questions: Should access downgrade at day 14 or day 30, and does this vary by plan?

Story: US-B05 — Request Refund
Source: `docs/user-experience/user-stories.md:1906`
Mapped Journey Touchpoints: JM-6.1 `docs/user-experience/billing-journey-map.md` Step 11

Issues Identified:
- Inconsistency: Story only covers <=14 days auto approval and >14 days review, while the journey map defines 14-30 day prorated refunds and annual subscription rules (`docs/user-experience/billing-journey-map.md:658`).
- Ambiguity: No processing timeline or eligibility exceptions in the story.

Severity: Major
Confidence: High
Why it matters (risk): Refund processing and legal compliance will diverge depending on which document is used.

Recommendation (actionable):
- Rewrite: Align AC with 0-14 auto refund, 14-30 prorated review, and annual subscription rules.
- Acceptance Criteria: Add processing time SLAs and exceptions (e.g., billing error, legal requirements).
- Open Questions: Do refunds apply to partially used annual plans, and what is the proration policy?

Story: US-B07 — View Tax Invoice (VAT/GST)
Source: `docs/user-experience/user-stories.md:1956`
Mapped Journey Touchpoints: JM-5.1 `docs/user-experience/billing-journey-map.md` Step 10

Issues Identified:
- Ambiguity: "validated against the relevant registry" is unspecified; the journey map lists EU VIES, HMRC, and ABN (`docs/user-experience/billing-journey-map.md:576`).
- Insufficiency: No explicit country/region scope or fallback for unsupported regions.

Severity: Major
Confidence: Medium
Why it matters (risk): Tax compliance behavior will be inconsistent across regions, risking invoices with incorrect tax treatment.

Recommendation (actionable):
- Rewrite: Specify which registries are in scope now vs planned, and define behavior when validation is unavailable.
- Acceptance Criteria: Add country-specific validation paths and expected invoice tax handling.
- Open Questions: Which countries are in scope for VAT/GST validation at launch?

Story: US-N04 — Escalation Alert (Approval Aging)
Source: `docs/user-experience/user-stories.md:2135`
Mapped Journey Touchpoints: JM-4.1 `docs/user-experience/notification-journey-map.md` Step 5

Issues Identified:
- Inconsistency: Story includes 24h/7d/30d triggers, but the journey map includes 15 min and 3 day stages plus consultant escalation (`docs/user-experience/notification-journey-map.md:432`).
- Insufficiency: No criteria for consultant notifications even though the map defines them.

Severity: Major
Confidence: High
Why it matters (risk): Escalation behavior will be implemented inconsistently, affecting approval SLAs and user trust.

Recommendation (actionable):
- Rewrite: Align AC with the full escalation timeline (immediate, 15 min, 24h, 3d, 7d, 30d).
- Acceptance Criteria: Include consultant escalation timing and messaging.
- Open Questions: Should "auto-paused" trigger at day 7 or day 30, and who can resume?

Story: US-AS04 — View Login History
Source: `docs/user-experience/user-stories.md:2272`
Mapped Journey Touchpoints: JM-4.1 `docs/user-experience/account-settings-journey-map.md` Step 7

Issues Identified:
- Ambiguity: "highlighted as suspicious" lacks criteria, while the journey map specifies unusual location and new device rules (`docs/user-experience/account-settings-journey-map.md:461`).
- Insufficiency: No mention of log retention (90 days) defined in the journey map.

Severity: Minor
Confidence: Medium
Why it matters (risk): Security UI will be subjective and hard to test without clear detection criteria.

Recommendation (actionable):
- Rewrite: Include explicit suspicious criteria (new device, unusual location, failed attempts).
- Acceptance Criteria: Add retention period and required fields for each login record.
- Open Questions: What threshold defines "unusual location" and can users whitelist devices?

Story: US-F08 — View Phase 1 Progress
Source: `docs/user-experience/user-stories.md:218`
Mapped Journey Touchpoints: JM-3.2 and JM-3.3 `docs/user-experience/founder-journey-map.md` Steps 6-7

Issues Identified:
- Complexity: Bundles progress UI, activity feed, error handling, and retry logic into a single story.
- Implementation bias: Prescribes specific UI components and animations (shimmer, pulse, countdown).

Severity: Minor
Confidence: Medium
Why it matters (risk): Story is large and prescriptive, which reduces negotiability and increases test scope.

Recommendation (actionable):
- Split: US-F08a Progress indicators, US-F08b Activity feed, US-F08c Error and retry behavior.
- Acceptance Criteria: Keep UI behavior measurable but decouple specific animation details from the story.
- Open Questions: Which progress signals are mandatory vs optional for Phase 1?

### 4) Anti-Patterns & Smells Summary
- Faceless user: US-S01, US-N01, US-AS01 in `docs/user-experience/user-stories.md` use "User" instead of personas; align with founder/consultant/trial/admin segments.
- Implementation bias: US-F08 and US-N01 in `docs/user-experience/user-stories.md` encode UI details better suited for UI specs.
- Large/bundled stories: US-B04 and US-B06 in `docs/user-experience/user-stories.md` combine multiple flows (UI, email, billing state).
- Assumptions as facts: Success metrics targets in `docs/user-experience/support-journey-map.md`, `docs/user-experience/offboarding-journey-map.md`, and `docs/user-experience/notification-journey-map.md` are stated without evidence or baseline.

### 5) Journey Map Findings
- Missing moment of truth: JM-1.2 and JM-1.3 in `docs/user-experience/founder-journey-map.md` define plan selection and signup but have no matching stories.
- Missing moment of truth: JM-1.1 in `docs/user-experience/admin-journey-map.md` (Admin Login) lacks a user story, blocking TDD coverage.
- Missing story coverage: JM-2.2 in `docs/user-experience/billing-journey-map.md` (Backup Payment Method) is not explicitly covered by US-B03.
- Missing story coverage: JM-4.2 in `docs/user-experience/founder-trial-journey-map.md` and JM-4.3 in `docs/user-experience/consultant-trial-journey-map.md` (Post-Upgrade Experience) have no stories.
- Inconsistency: JM-5.1 in `docs/user-experience/support-journey-map.md` states "No refund for partial month" for deletion, but US-B05 in `docs/user-experience/user-stories.md:1906` allows refunds; policy needs reconciliation.
- Emotional friction not covered: JM-1.1 in `docs/user-experience/founder-journey-map.md` lists skepticism about AI and trust concerns, but there is no explicit story addressing trust signals or guarantees.

### 6) INVEST Scoring (Per Story)
**Founder Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-F01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on auth + AI workflow. |
| US-F02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on analysis output. |
| US-F03 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on HITL pipeline. |
| US-F04 | 2 | 1 | 2 | 2 | 2 | 2 | 11 | Small, clear. |
| US-F05 | 2 | 1 | 2 | 2 | 2 | 2 | 11 | Small, clear. |
| US-F06 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on analysis output. |
| US-F07 | 2 | 1 | 1 | 2 | 2 | 2 | 10 | Optional enhancement. |
| US-F08 | 1 | 0 | 2 | 1 | 0 | 1 | 5 | Large and prescriptive. |

**Consultant Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-C01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on profile save. |
| US-C02 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Client action dependency. |
| US-C03 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Portfolio depends on data. |
| US-C04 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | HITL monitoring dependent. |
| US-C05 | 2 | 1 | 2 | 2 | 2 | 2 | 11 | Small, clear. |
| US-C06 | 2 | 1 | 1 | 2 | 2 | 2 | 10 | Rate limit noted. |
| US-C07 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on client context. |

**Trial Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-FT01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on auth/onboarding. |
| US-FT02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on counters. |
| US-FT03 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Depends on billing. |
| US-CT01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Onboarding + mock setup. |
| US-CT02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Mock data dependency. |
| US-CT03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Upgrade prompt dependency. |
| US-CT04 | 1 | 1 | 2 | 2 | 2 | 2 | 10 | Clear and bounded. |
| US-CT05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Depends on billing. |

**Admin Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-A01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Search depends on data. |
| US-A02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Profile data dependency. |
| US-A03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Read-only enforcement unclear. |
| US-A04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Workflow state dependency. |
| US-A05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Health metrics dependency. |
| US-A06 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Feature flag infra dependency. |
| US-A07 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Clear audit surface. |
| US-A08 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Role transitions defined. |
| US-A09 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Export infra dependency. |
| US-A10 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Large and complex. |

**HITL + Pivot Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-H01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Cross-crew dependency. |
| US-H02 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Large approval surface. |
| US-H03 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Missing in source. |
| US-H04 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Creative review complexity. |
| US-H05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Budget control. |
| US-H06 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Gate decision. |
| US-H07 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Gate decision. |
| US-H08 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Gate decision. |
| US-H09 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Final decision. |
| US-P01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Pivot decision. |
| US-P02 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Pivot decision. |
| US-P03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Pivot decision. |
| US-P04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Pivot decision. |

**Edge Case Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-E01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Recovery flow. |
| US-E02 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Concurrency handling. |
| US-E03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Validation handling. |
| US-E04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Timeout handling. |
| US-E05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Expiry handling. |
| US-E06 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Client unlink handling. |

**Support + Offboarding Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-S01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Support workflow dependency. |
| US-S02 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Knowledge base dependency. |
| US-S03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Ticketing dependency. |
| US-S04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Export infra dependency. |
| US-S05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Deletion workflow dependency. |
| US-O01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Billing dependency. |
| US-O02 | 2 | 1 | 1 | 2 | 2 | 2 | 10 | Small, optional. |
| US-O03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Policy dependent. |
| US-O04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Billing + restore dependency. |
| US-O05 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Email dependency. |

**Billing Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-B01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Needs billing data. |
| US-B02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Invoice data dependency. |
| US-B03 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | PCI/Stripe dependency. |
| US-B04 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Dunning complexity. |
| US-B05 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Policy complexity. |
| US-B06 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Plan/proration complexity. |
| US-B07 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Tax compliance scope. |
| US-B08 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Checkout dependency. |
| US-B09 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Proration rules. |
| US-B10 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Recovery dependency. |

**Notification + Account Settings Stories**
| Story ID | I | N | V | E | S | T | Total/12 | Notes |
|---|---|---|---|---|---|---|---|---|
| US-N01 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Event definition needed. |
| US-N02 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Trigger definition needed. |
| US-N03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Preference schema dependency. |
| US-N04 | 1 | 1 | 2 | 1 | 0 | 1 | 6 | Escalation complexity. |
| US-N05 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Clear transactional vs marketing. |
| US-AS01 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Profile data dependency. |
| US-AS02 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Security workflow dependency. |
| US-AS03 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | 2FA system dependency. |
| US-AS04 | 1 | 1 | 2 | 1 | 1 | 1 | 7 | Suspicious criteria missing. |
| US-AS05 | 1 | 1 | 2 | 1 | 1 | 2 | 8 | Session management dependency. |

### 7) Prioritized Recommendations (TDD-Oriented)
- P0: Align policy timelines and missing definitions for US-O03, US-B04, US-B05, US-B07, US-N04, and US-H03 in `docs/user-experience/user-stories.md` with their journey map sources to prevent contradictory tests and legal exposure.
- P1: Add stories for missing touchpoints: JM-1.2/JM-1.3 founder pricing+signup, JM-1.1 admin login, JM-2.2 billing backup payment, JM-4.2/JM-4.3 post-upgrade experiences; update `docs/user-experience/user-stories.md` accordingly.
- P2: Decompose large/prescriptive stories (US-F08, US-B06) and replace faceless user labels in support/notification/account settings with persona-aligned variants to improve testability.

If you want, I can draft the revised story text and AC for the P0 set next.

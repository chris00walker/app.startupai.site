# Technical Architecture Requirements

## Frontend

- React + TypeScript
- ShadCN UI components
- Responsive design; PWA capabilities

## State Management

- Zustand/Redux for complex state
- Real-time sync; offline with reconciliation
- Version control for artifacts

## Data Models (Core Entities)

- Projects/Workspaces; Business Models; Value Propositions; Assumptions; Hypotheses; Experiments; Learning Records; Users; Teams

## ShadCN UI Component Mapping

| Strategyzer Tool | Primary Components | Additional |
|---|---|---|
| Canvases | Card, Sheet, Dialog | Drag-and-drop, Grid |
| Assumption Maps | Card, Badge, Button | Priority matrix, Filtering |
| Test Cards | Card, Form, Input, Textarea | Wizard, Validation |
| Experiment Library | Table, Badge, Select | Search, Filter, Sort |
| Learning Cards | Card, Textarea, Button | Rich text, Templates |
| Progress Boards | Progress, Card, Chart | KPIs |
| Navigation | Tabs, Sidebar, Breadcrumb | Multi-level |
| Collaboration | Avatar, Comment, Notification | Real-time |

Related:

- Non-functionals: `docs/engineering/10-requirements/non-functionals.md`
- Security Posture: `docs/engineering/10-requirements/security-posture.md`

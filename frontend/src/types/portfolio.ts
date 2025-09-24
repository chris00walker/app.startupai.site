// Portfolio types for consultant dashboard transformation
export interface PortfolioProject {
  id: string
  clientName: string
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'
  gateStatus: 'Pending' | 'Passed' | 'Failed'
  riskBudget: { 
    planned: number
    actual: number
    delta: number
  }
  lastActivity: string
  assignedConsultant: string
  evidenceQuality: number // 0-1 score
  nextGateDate?: string
  hypothesesCount: number
  experimentsCount: number
  evidenceCount: number
}

export interface GatePolicy {
  gate: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY'
  criteria: {
    minExperiments: number
    strengthMix: { weak: number; medium: number; strong: number }
    thresholds: Record<string, number> // CTR, signup rate, etc.
    requiredEvidence: string[] // interview, analytics, etc.
  }
  overrideRoles: string[]
  approvalChain: string[]
}

export interface EvidenceMetrics {
  totalEvidence: number
  evidenceByType: Record<'interview' | 'desk' | 'analytics' | 'experiment', number>
  averageRecency: number // days since collection
  citationAccuracy: number // percentage of claims with valid citations
  contradictionRate: number // conflicting evidence percentage
}

export interface AuditEvent {
  id: string
  timestamp: string
  eventType: string
  actor: string
  projectId: string
  payload: any
  payloadHash: string // tamper-evident
  approver?: string // for overrides
}

export interface ConsultantPortfolio {
  consultantId: string
  projects: PortfolioProject[]
  policies: GatePolicy[]
  overrides: OverrideRequest[]
}

export interface OverrideRequest {
  id: string
  projectId: string
  gate: string
  requestedBy: string
  rationale: string
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: string
}

export interface PortfolioMetrics {
  activeProjectsByStage: Record<string, number>
  gatePassRate: number
  averageCycleTime: number
  evidenceCoverage: number
  overrideRate: number
}

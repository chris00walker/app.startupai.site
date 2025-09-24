import { PortfolioProject, PortfolioMetrics } from "@/types/portfolio"

// Mock portfolio data for consultant dashboard
export const mockPortfolioProjects: PortfolioProject[] = [
  {
    id: "proj_1",
    clientName: "TechStart Inc.",
    stage: "DESIRABILITY",
    gateStatus: "Pending",
    riskBudget: { planned: 5.0, actual: 4.2, delta: -0.16 },
    lastActivity: "2 hours ago",
    assignedConsultant: "Sarah Chen",
    evidenceQuality: 0.85,
    nextGateDate: "Dec 15",
    hypothesesCount: 12,
    experimentsCount: 8,
    evidenceCount: 24
  },
  {
    id: "proj_2",
    clientName: "CloudCorp",
    stage: "FEASIBILITY",
    gateStatus: "Passed",
    riskBudget: { planned: 8.0, actual: 9.2, delta: 0.15 },
    lastActivity: "1 day ago",
    assignedConsultant: "Mike Rodriguez",
    evidenceQuality: 0.92,
    nextGateDate: "Jan 8",
    hypothesesCount: 18,
    experimentsCount: 15,
    evidenceCount: 42
  },
  {
    id: "proj_3",
    clientName: "AppVenture",
    stage: "VIABILITY",
    gateStatus: "Failed",
    riskBudget: { planned: 6.5, actual: 8.9, delta: 0.37 },
    lastActivity: "3 hours ago",
    assignedConsultant: "Lisa Park",
    evidenceQuality: 0.58,
    nextGateDate: "Dec 22",
    hypothesesCount: 14,
    experimentsCount: 6,
    evidenceCount: 19
  },
  {
    id: "proj_4",
    clientName: "FinanceFlow",
    stage: "DESIRABILITY",
    gateStatus: "Passed",
    riskBudget: { planned: 4.5, actual: 4.1, delta: -0.09 },
    lastActivity: "5 hours ago",
    assignedConsultant: "David Kim",
    evidenceQuality: 0.78,
    nextGateDate: "Dec 18",
    hypothesesCount: 10,
    experimentsCount: 12,
    evidenceCount: 31
  },
  {
    id: "proj_5",
    clientName: "RetailRev",
    stage: "FEASIBILITY",
    gateStatus: "Pending",
    riskBudget: { planned: 7.2, actual: 6.8, delta: -0.06 },
    lastActivity: "1 hour ago",
    assignedConsultant: "Emma Thompson",
    evidenceQuality: 0.71,
    nextGateDate: "Jan 12",
    hypothesesCount: 16,
    experimentsCount: 9,
    evidenceCount: 28
  },
  {
    id: "proj_6",
    clientName: "HealthTech Solutions",
    stage: "SCALE",
    gateStatus: "Passed",
    riskBudget: { planned: 12.0, actual: 11.5, delta: -0.04 },
    lastActivity: "6 hours ago",
    assignedConsultant: "Alex Johnson",
    evidenceQuality: 0.95,
    nextGateDate: "Completed",
    hypothesesCount: 22,
    experimentsCount: 28,
    evidenceCount: 67
  }
]

export const mockPortfolioMetrics: PortfolioMetrics = {
  activeProjectsByStage: {
    DESIRABILITY: 2,
    FEASIBILITY: 2,
    VIABILITY: 1,
    SCALE: 1
  },
  gatePassRate: 0.78,
  averageCycleTime: 24.5,
  evidenceCoverage: 0.82,
  overrideRate: 0.12
}

// Mock data for individual project details
export const mockProjectDetails = {
  "proj_1": {
    hypotheses: [
      { id: "hyp_1", text: "Small businesses need automated invoicing", risk: "High", stage: "Discovery" },
      { id: "hyp_2", text: "Users prefer mobile-first interface", risk: "Medium", stage: "Discovery" },
      { id: "hyp_3", text: "Integration with QuickBooks is essential", risk: "Low", stage: "Development" }
    ],
    experiments: [
      { id: "exp_1", name: "Landing page conversion test", strength: "Strong", status: "Complete", result: "Success" },
      { id: "exp_2", name: "User interview series", strength: "Medium", status: "Running", result: null },
      { id: "exp_3", name: "Competitor analysis", strength: "Weak", status: "Planned", result: null }
    ],
    evidence: [
      { id: "ev_1", type: "interview", title: "SMB owner interviews", quality: 0.9, date: "2 days ago" },
      { id: "ev_2", type: "analytics", title: "Landing page metrics", quality: 0.85, date: "1 day ago" },
      { id: "ev_3", type: "desk", title: "Market research report", quality: 0.75, date: "3 days ago" }
    ]
  }
}

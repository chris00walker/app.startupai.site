/**
 * Database Queries
 * 
 * Centralized database query functions using Drizzle ORM
 * Currently using MOCK DATA for UI development and testing
 */

// Mock data matching the StartupAI evidence-led strategy platform
const MOCK_PROJECTS = [
  {
    id: 'proj_001',
    name: 'FinTech SaaS Platform',
    description: 'B2B financial automation platform for small businesses',
    status: 'active',
    stage: 'DESIRABILITY',
    created_at: '2025-09-15T10:30:00Z',
    updated_at: '2025-10-01T14:22:00Z',
    user_id: '',
    hypotheses_count: 12,
    experiments_count: 8,
    evidence_count: 24,
    risk_budget: { planned: 5.0, actual: 4.2 }
  },
  {
    id: 'proj_002',
    name: 'AI-Powered Customer Service',
    description: 'Automated customer support using LLMs and sentiment analysis',
    status: 'active',
    stage: 'FEASIBILITY',
    created_at: '2025-08-22T09:15:00Z',
    updated_at: '2025-09-30T16:45:00Z',
    user_id: '',
    hypotheses_count: 18,
    experiments_count: 15,
    evidence_count: 42,
    risk_budget: { planned: 8.0, actual: 7.5 }
  },
  {
    id: 'proj_003',
    name: 'Sustainable Fashion Marketplace',
    description: 'E-commerce platform connecting eco-conscious brands with consumers',
    status: 'active',
    stage: 'VIABILITY',
    created_at: '2025-07-10T11:00:00Z',
    updated_at: '2025-09-28T13:20:00Z',
    user_id: '',
    hypotheses_count: 14,
    experiments_count: 11,
    evidence_count: 36,
    risk_budget: { planned: 6.5, actual: 6.8 }
  }
];

const MOCK_EVIDENCE = [
  {
    id: 'ev_001',
    project_id: 'proj_001',
    type: 'interview',
    title: 'SMB Owner Interviews - Invoice Pain Points',
    description: '15 interviews with small business owners about invoicing workflows',
    source: 'User Research',
    quality_score: 0.92,
    created_at: '2025-09-28T10:00:00Z'
  },
  {
    id: 'ev_002',
    project_id: 'proj_001',
    type: 'analytics',
    title: 'Landing Page Conversion Data',
    description: 'A/B test results showing 3.2% conversion rate on value prop',
    source: 'Google Analytics',
    quality_score: 0.88,
    created_at: '2025-09-27T14:30:00Z'
  },
  {
    id: 'ev_003',
    project_id: 'proj_001',
    type: 'desk_research',
    title: 'Market Size Analysis - SMB Finance Software',
    description: 'TAM/SAM/SOM analysis for US market',
    source: 'Gartner, CB Insights',
    quality_score: 0.85,
    created_at: '2025-09-25T09:15:00Z'
  }
];

/**
 * Get all projects for a user
 * MOCK: Returns sample projects for UI development
 */
export async function getUserProjects(userId: string) {
  console.log('🧪 MOCK: getUserProjects called for user:', userId);
  
  // Simulate slight delay for realistic feel
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return projects with user_id populated
  return MOCK_PROJECTS.map(p => ({ ...p, user_id: userId }));
}

/**
 * Get a single project by ID
 * MOCK: Returns sample project details
 */
export async function getProject(projectId: string) {
  console.log('🧪 MOCK: getProject called for project:', projectId);
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const project = MOCK_PROJECTS.find(p => p.id === projectId);
  return project || null;
}

/**
 * Get all evidence for a project
 * MOCK: Returns sample evidence items
 */
export async function getProjectEvidence(projectId: string) {
  console.log('🧪 MOCK: getProjectEvidence called for project:', projectId);
  
  await new Promise(resolve => setTimeout(resolve, 80));
  
  return MOCK_EVIDENCE.filter(e => e.project_id === projectId);
}

/**
 * Get project statistics
 * MOCK: Returns calculated stats from mock data
 */
export async function getProjectStats(projectId: string) {
  console.log('🧪 MOCK: getProjectStats called for project:', projectId);
  
  const project = MOCK_PROJECTS.find(p => p.id === projectId);
  if (!project) return null;
  
  return {
    hypotheses: project.hypotheses_count,
    experiments: project.experiments_count,
    evidence: project.evidence_count,
    stage: project.stage,
    risk_budget: project.risk_budget
  };
}

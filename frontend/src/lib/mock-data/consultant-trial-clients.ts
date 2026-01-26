/**
 * Mock Client Data for Consultant Trial
 *
 * Provides realistic sample data for the 2 mock clients that trial
 * consultants receive during onboarding.
 *
 * @story US-CT01, US-CT02
 */

import { v4 as uuidv4 } from 'uuid';
import type { VPCJobItem, VPCPainItem, VPCGainItem, VPCItem, VPCPainRelieverItem, VPCGainCreatorItem } from '@/db/schema/value-proposition-canvas';

// Helper to create timestamp strings
const now = () => new Date().toISOString();

// ============================================================================
// MOCK CLIENT 1: AI Meal Planning App
// Phase 2 (Desirability), D: Strong
// ============================================================================

export const MOCK_CLIENT_1 = {
  profile: {
    email: 'sarah.chen.mock@startupai.demo',
    fullName: 'Sarah Chen',
    company: 'NutriPlan AI',
  },
  project: {
    name: 'NutriPlan - AI Meal Planning',
    description: 'AI-powered meal planning app that creates personalized weekly meal plans based on dietary preferences, health goals, and budget constraints.',
    rawIdea: 'An AI-powered meal planning app that creates personalized weekly meal plans based on dietary preferences, health goals, and budget constraints. The app generates shopping lists, suggests recipes, and learns from user feedback to improve recommendations over time.',
    hints: {
      industry: 'Health & Wellness',
      target_user: 'Health-conscious professionals aged 25-45',
      geography: 'United States, Urban areas',
    },
    stage: 'DESIRABILITY' as const,
    status: 'active',
  },
  vpc: {
    segmentKey: 'health_conscious_professionals',
    segmentName: 'Health-Conscious Professionals',
    source: 'crewai' as const,
    resonanceScore: 0.78,
    jobs: [
      {
        id: uuidv4(),
        functional: 'Plan healthy meals for the week without spending hours researching recipes',
        emotional: 'Feel in control of my health and nutrition choices',
        social: 'Be seen as someone who takes care of themselves and their family',
        importance: 9,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        functional: 'Stay within grocery budget while eating healthy',
        emotional: 'Feel confident about financial decisions around food',
        social: 'Not feel judged for spending too much or too little on food',
        importance: 8,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCJobItem[],
    pains: [
      {
        id: uuidv4(),
        description: 'Spending 2+ hours weekly planning meals and creating shopping lists',
        intensity: 8,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        description: 'Food waste from buying ingredients for recipes that never get made',
        intensity: 7,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        description: 'Dietary restrictions make finding suitable recipes difficult',
        intensity: 9,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCPainItem[],
    gains: [
      {
        id: uuidv4(),
        description: 'More time for family and hobbies instead of meal planning',
        importance: 9,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        description: 'Achieve health goals through consistent nutrition',
        importance: 10,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        description: 'Reduce grocery spending by 15-20%',
        importance: 7,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCGainItem[],
    productsAndServices: [
      {
        id: uuidv4(),
        text: 'AI-generated weekly meal plans tailored to preferences',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        text: 'Smart shopping lists organized by store section',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        text: 'Recipe library with nutritional information',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCItem[],
    painRelievers: [
      {
        id: uuidv4(),
        painDescription: 'Time spent planning meals',
        relief: 'One-click meal plan generation in under 30 seconds',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        painDescription: 'Dietary restrictions',
        relief: 'Smart filtering for 20+ dietary preferences (keto, vegan, allergies)',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCPainRelieverItem[],
    gainCreators: [
      {
        id: uuidv4(),
        gainDescription: 'More free time',
        creator: 'Automated planning saves 2+ hours weekly',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        gainDescription: 'Health goal achievement',
        creator: 'Macro tracking and nutritional balance built into every plan',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCGainCreatorItem[],
  },
  evidence: [
    {
      category: 'desirability',
      summary: 'Landing page test showed 12% email signup conversion rate',
      strength: 'strong',
      fitType: 'problem',
    },
    {
      category: 'desirability',
      summary: '85% of survey respondents said they would pay for this solution',
      strength: 'strong',
      fitType: 'solution',
    },
    {
      category: 'desirability',
      summary: 'User interviews revealed meal planning takes average 2.5 hours/week',
      strength: 'moderate',
      fitType: 'problem',
    },
    {
      category: 'desirability',
      summary: '40 beta signups from organic social media post',
      strength: 'moderate',
      fitType: 'solution',
    },
    {
      category: 'feasibility',
      summary: 'GPT-4 API can generate quality meal plans at $0.02/request',
      strength: 'strong',
      fitType: 'technical',
    },
  ],
  experiments: [
    {
      name: 'Landing Page Smoke Test',
      hypothesis: 'Health-conscious professionals will sign up for meal planning waitlist',
      status: 'completed',
      result: 'validated',
      learnings: '12% conversion rate exceeds 5% threshold. Strong interest confirmed.',
    },
    {
      name: 'Pricing Survey',
      hypothesis: 'Users will pay $9.99/month for AI meal planning',
      status: 'completed',
      result: 'validated',
      learnings: '67% willing to pay $9.99, 42% willing to pay $14.99',
    },
  ],
};

// ============================================================================
// MOCK CLIENT 2: B2B Construction SaaS
// Phase 1 (Discovery), D: Moderate
// ============================================================================

export const MOCK_CLIENT_2 = {
  profile: {
    email: 'marcus.johnson.mock@startupai.demo',
    fullName: 'Marcus Johnson',
    company: 'BuildSync Pro',
  },
  project: {
    name: 'BuildSync - Construction Scheduling',
    description: 'B2B SaaS platform for construction project scheduling and resource management.',
    rawIdea: 'A B2B SaaS platform that helps small to mid-size construction companies manage project scheduling, crew assignments, and equipment allocation. The platform uses AI to optimize schedules and predict delays.',
    hints: {
      industry: 'Construction Technology',
      target_user: 'Construction project managers at companies with 10-100 employees',
      geography: 'United States, Canada',
    },
    stage: 'DESIRABILITY' as const,
    status: 'active',
  },
  vpc: {
    segmentKey: 'construction_project_managers',
    segmentName: 'Construction Project Managers',
    source: 'crewai' as const,
    resonanceScore: 0.52,
    jobs: [
      {
        id: uuidv4(),
        functional: 'Coordinate multiple crews across different job sites',
        emotional: 'Reduce stress from last-minute schedule changes',
        social: 'Be recognized as an efficient project manager',
        importance: 10,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCJobItem[],
    pains: [
      {
        id: uuidv4(),
        description: 'Crew scheduling conflicts cause project delays',
        intensity: 9,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: uuidv4(),
        description: 'Equipment double-booking wastes time and money',
        intensity: 8,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCPainItem[],
    gains: [
      {
        id: uuidv4(),
        description: 'Complete projects on time and within budget',
        importance: 10,
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCGainItem[],
    productsAndServices: [
      {
        id: uuidv4(),
        text: 'Real-time crew scheduling dashboard',
        source: 'crewai' as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ] as VPCItem[],
    painRelievers: [] as VPCPainRelieverItem[],
    gainCreators: [] as VPCGainCreatorItem[],
  },
  evidence: [
    {
      category: 'desirability',
      summary: '5 discovery interviews with construction PMs completed',
      strength: 'moderate',
      fitType: 'problem',
    },
    {
      category: 'desirability',
      summary: 'Industry report shows 60% of small contractors use spreadsheets',
      strength: 'weak',
      fitType: 'market',
    },
  ],
  experiments: [
    {
      name: 'Problem Discovery Interviews',
      hypothesis: 'Scheduling is a top 3 pain point for construction PMs',
      status: 'in_progress',
      result: 'pending',
      learnings: 'Early interviews confirm hypothesis. Need 5 more interviews.',
    },
  ],
};

// ============================================================================
// EXPORT ALL MOCK CLIENTS
// ============================================================================

export const MOCK_CLIENTS = [MOCK_CLIENT_1, MOCK_CLIENT_2];

export type MockClientData = typeof MOCK_CLIENT_1;

/**
 * AI Founders Mapping Utility
 *
 * Centralized definitions and mapping functions for the 6 AI Founders
 * in the StartupAI system. Maps crews, data types, and source strings
 * to their responsible founder.
 * @story US-F02
 */
import {
  Brain,
  Hammer,
  TrendingUp,
  Compass,
  Shield,
  Calculator,
  type LucideIcon,
} from 'lucide-react'

export type FounderId = 'sage' | 'forge' | 'pulse' | 'compass' | 'guardian' | 'ledger'
export type FounderStatus = 'idle' | 'running' | 'completed' | 'error'

export interface Founder {
  id: FounderId
  name: string
  title: string
  role: string
  crews: string[]
  icon: LucideIcon
  color: string
  bgColor: string
  textColor: string
  ringColor: string
}

/**
 * The 6 AI Founders with their metadata
 */
export const AI_FOUNDERS: Record<FounderId, Founder> = {
  sage: {
    id: 'sage',
    name: 'Sage',
    title: 'CSO',
    role: 'Strategy & Analysis',
    crews: ['service', 'analysis'],
    icon: Brain,
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'ring-blue-500',
  },
  forge: {
    id: 'forge',
    name: 'Forge',
    title: 'CTO',
    role: 'Technical Feasibility',
    crews: ['build'],
    icon: Hammer,
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    ringColor: 'ring-orange-500',
  },
  pulse: {
    id: 'pulse',
    name: 'Pulse',
    title: 'CGO',
    role: 'Growth & Testing',
    crews: ['growth'],
    icon: TrendingUp,
    color: 'pink',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    ringColor: 'ring-pink-500',
  },
  compass: {
    id: 'compass',
    name: 'Compass',
    title: 'CPO',
    role: 'Synthesis & Balance',
    crews: ['synthesis'],
    icon: Compass,
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    ringColor: 'ring-purple-500',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian',
    title: 'CCO',
    role: 'Governance & QA',
    crews: ['governance'],
    icon: Shield,
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    ringColor: 'ring-green-500',
  },
  ledger: {
    id: 'ledger',
    name: 'Ledger',
    title: 'CFO',
    role: 'Finance & Viability',
    crews: ['finance'],
    icon: Calculator,
    color: 'yellow',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    ringColor: 'ring-yellow-500',
  },
}

/**
 * Get all founders as an array
 */
export function getAllFounders(): Founder[] {
  return Object.values(AI_FOUNDERS)
}

/**
 * Get a founder by ID
 */
export function getFounderById(id: FounderId): Founder {
  return AI_FOUNDERS[id]
}

/**
 * Map a crew name to its responsible founder
 */
export function getFounderByCrew(crewName: string): Founder | null {
  if (!crewName) return null
  const normalized = crewName.toLowerCase()

  for (const founder of Object.values(AI_FOUNDERS)) {
    if (founder.crews.some((crew) => normalized.includes(crew))) {
      return founder
    }
  }
  return null
}

/**
 * Keywords that map to each founder (used for source string matching)
 */
const SOURCE_KEYWORDS: Record<FounderId, string[]> = {
  sage: ['service', 'analysis', 'segment', 'strategy', 'customer', 'value map', 'vpc'],
  forge: ['build', 'feasibility', 'technical', 'mvp', 'architecture'],
  pulse: ['growth', 'desirability', 'experiment', 'testing', 'ad', 'conversion'],
  compass: ['synthesis', 'pivot', 'balance', 'recommendation'],
  guardian: ['governance', 'qa', 'audit', 'compliance', 'quality'],
  ledger: ['finance', 'viability', 'economics', 'cac', 'ltv', 'unit economics'],
}

/**
 * Map a source string (e.g., "CrewAI Growth Crew") to its responsible founder
 */
export function getFounderBySource(source: string): Founder | null {
  if (!source) return null
  const normalized = source.toLowerCase()

  for (const [founderId, keywords] of Object.entries(SOURCE_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return AI_FOUNDERS[founderId as FounderId]
    }
  }
  return null
}

/**
 * Data types that can be attributed to founders
 */
export type AttributableDataType =
  | 'vpc'
  | 'bmc'
  | 'assumptions'
  | 'experiments'
  | 'desirability'
  | 'feasibility'
  | 'viability'
  | 'finance'
  | 'synthesis'
  | 'governance'
  | 'customer_profiles'
  | 'value_maps'

/**
 * Map data types to their responsible founder
 */
const DATA_TYPE_TO_FOUNDER: Record<AttributableDataType, FounderId> = {
  vpc: 'sage',
  bmc: 'sage',
  assumptions: 'sage',
  customer_profiles: 'sage',
  value_maps: 'sage',
  experiments: 'pulse',
  desirability: 'pulse',
  feasibility: 'forge',
  viability: 'ledger',
  finance: 'ledger',
  synthesis: 'compass',
  governance: 'guardian',
}

/**
 * Get the founder responsible for a specific data type
 */
export function getFounderByDataType(dataType: AttributableDataType): Founder {
  return AI_FOUNDERS[DATA_TYPE_TO_FOUNDER[dataType]]
}

/**
 * Check if a founder ID is valid
 */
export function isValidFounderId(id: string): id is FounderId {
  return id in AI_FOUNDERS
}

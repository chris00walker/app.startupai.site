/**
 * Business Model-Specific Viability Benchmarks
 *
 * Provides context-aware thresholds for unit economics based on business model type.
 * Used by ViabilityMetricsPanel to show "vs. typical SaaS B2B" comparisons.
 * @story US-CP08
 *
 * Source: Industry benchmarks from SaaS Capital, OpenView, a16z, and Testing Business Ideas.
 */

import type { BusinessModelType, ViabilitySignal } from '@/types/crewai'

export interface ViabilityBenchmark {
  // LTV/CAC thresholds
  healthy_ltv_cac: number      // >= this is "profitable"
  marginal_ltv_cac: number     // >= this is "marginal", below is "underwater"

  // Target metrics
  target_gross_margin: number  // Expected gross margin (0-1)
  typical_payback_months: number
  typical_churn_pct: number    // Monthly churn (0-1)

  // TAM threshold for zombie_market detection
  tam_threshold_usd: number

  // Display metadata
  label: string
  description: string
}

export const VIABILITY_BENCHMARKS: Record<BusinessModelType, ViabilityBenchmark> = {
  saas_b2b_smb: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.70,
    typical_payback_months: 12,
    typical_churn_pct: 0.05,
    tam_threshold_usd: 10_000_000,
    label: 'SaaS B2B SMB',
    description: 'Software-as-a-Service for small business customers'
  },
  saas_b2b_midmarket: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.75,
    typical_payback_months: 18,
    typical_churn_pct: 0.03,
    tam_threshold_usd: 50_000_000,
    label: 'SaaS B2B Mid-Market',
    description: 'Software-as-a-Service for mid-sized companies'
  },
  saas_b2b_enterprise: {
    healthy_ltv_cac: 4.0,
    marginal_ltv_cac: 1.5,
    target_gross_margin: 0.80,
    typical_payback_months: 24,
    typical_churn_pct: 0.01,
    tam_threshold_usd: 100_000_000,
    label: 'SaaS B2B Enterprise',
    description: 'Software-as-a-Service for large enterprises'
  },
  saas_b2c_freemium: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.70,
    typical_payback_months: 6,
    typical_churn_pct: 0.08,
    tam_threshold_usd: 100_000_000,
    label: 'SaaS B2C Freemium',
    description: 'Consumer software with free tier and paid upgrades'
  },
  saas_b2c_subscription: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.65,
    typical_payback_months: 3,
    typical_churn_pct: 0.06,
    tam_threshold_usd: 50_000_000,
    label: 'SaaS B2C Subscription',
    description: 'Consumer software with direct subscription model'
  },
  ecommerce_dtc: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.40,
    typical_payback_months: 6,
    typical_churn_pct: 0.08,
    tam_threshold_usd: 50_000_000,
    label: 'E-commerce DTC',
    description: 'Direct-to-consumer e-commerce brand'
  },
  ecommerce_marketplace: {
    healthy_ltv_cac: 2.5,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.25,
    typical_payback_months: 12,
    typical_churn_pct: 0.10,
    tam_threshold_usd: 100_000_000,
    label: 'E-commerce Marketplace',
    description: 'Multi-sided marketplace connecting buyers and sellers'
  },
  fintech_b2b: {
    healthy_ltv_cac: 4.0,
    marginal_ltv_cac: 1.5,
    target_gross_margin: 0.60,
    typical_payback_months: 18,
    typical_churn_pct: 0.02,
    tam_threshold_usd: 100_000_000,
    label: 'Fintech B2B',
    description: 'Financial technology for business customers'
  },
  fintech_b2c: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.50,
    typical_payback_months: 12,
    typical_churn_pct: 0.05,
    tam_threshold_usd: 100_000_000,
    label: 'Fintech B2C',
    description: 'Consumer financial services and applications'
  },
  consulting: {
    healthy_ltv_cac: 2.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.50,
    typical_payback_months: 3,
    typical_churn_pct: 0.15,
    tam_threshold_usd: 5_000_000,
    label: 'Consulting',
    description: 'Professional services and consulting engagements'
  },
  unknown: {
    healthy_ltv_cac: 3.0,
    marginal_ltv_cac: 1.0,
    target_gross_margin: 0.60,
    typical_payback_months: 12,
    typical_churn_pct: 0.05,
    tam_threshold_usd: 10_000_000,
    label: 'Unknown',
    description: 'Business model not yet determined'
  }
}

/**
 * Get the viability signal based on metrics and business model type
 */
export function getViabilitySignal(
  ltvCacRatio: number,
  tamUsd: number,
  businessModelType: BusinessModelType = 'unknown'
): ViabilitySignal {
  const benchmark = VIABILITY_BENCHMARKS[businessModelType]

  // Check for zombie market first (TAM too small)
  if (tamUsd < benchmark.tam_threshold_usd && ltvCacRatio >= benchmark.marginal_ltv_cac) {
    return 'zombie_market'
  }

  // Check LTV/CAC ratio
  if (ltvCacRatio >= benchmark.healthy_ltv_cac) {
    return 'profitable'
  }

  if (ltvCacRatio >= benchmark.marginal_ltv_cac) {
    return 'marginal'
  }

  return 'underwater'
}

/**
 * Compare a metric against its benchmark and return status
 */
export type MetricStatus = 'good' | 'warning' | 'bad' | 'neutral'

export function compareMetricToBenchmark(
  value: number,
  benchmark: number,
  higherIsBetter: boolean = true
): MetricStatus {
  const ratio = value / benchmark

  if (higherIsBetter) {
    if (ratio >= 1.0) return 'good'
    if (ratio >= 0.7) return 'warning'
    return 'bad'
  } else {
    // Lower is better (e.g., payback months, churn)
    if (ratio <= 1.0) return 'good'
    if (ratio <= 1.5) return 'warning'
    return 'bad'
  }
}

/**
 * Get a display-friendly comparison string
 */
export function getBenchmarkComparison(
  value: number,
  benchmark: number,
  unit: string = '',
  higherIsBetter: boolean = true
): string {
  const diff = value - benchmark
  const percentDiff = Math.abs((diff / benchmark) * 100).toFixed(0)
  const direction = higherIsBetter
    ? (diff >= 0 ? 'above' : 'below')
    : (diff <= 0 ? 'better than' : 'worse than')

  return `${percentDiff}% ${direction} typical (${benchmark}${unit})`
}

/**
 * Format business model type for display
 */
export function formatBusinessModelType(type: BusinessModelType): string {
  return VIABILITY_BENCHMARKS[type]?.label ?? type.replace(/_/g, ' ').toUpperCase()
}

/**
 * Get all CAC breakdown categories (for display consistency)
 */
export const CAC_BREAKDOWN_CATEGORIES = [
  { key: 'marketing', label: 'Marketing', color: 'bg-blue-500' },
  { key: 'sales', label: 'Sales', color: 'bg-green-500' },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-purple-500' },
  { key: 'other', label: 'Other', color: 'bg-gray-500' }
] as const

/**
 * Get all LTV breakdown categories (for display consistency)
 */
export const LTV_BREAKDOWN_CATEGORIES = [
  { key: 'subscription', label: 'Subscription', color: 'bg-emerald-500' },
  { key: 'expansion', label: 'Expansion', color: 'bg-teal-500' },
  { key: 'services', label: 'Services', color: 'bg-cyan-500' },
  { key: 'other', label: 'Other', color: 'bg-gray-500' }
] as const

/**
 * Calculate breakdown percentages from a record
 */
export function calculateBreakdownPercentages(
  breakdown: Record<string, number>
): Array<{ key: string; value: number; percentage: number }> {
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
  if (total === 0) return []

  return Object.entries(breakdown)
    .map(([key, value]) => ({
      key,
      value,
      percentage: (value / total) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

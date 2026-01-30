/**
 * Evidence data access with boundary validation.
 * @story US-F14
 */

import type { Evidence } from '@/db/schema/evidence'
import type { CrewAIValidationEvidenceState } from '@/types/evidence-explorer'
import { createClient } from '@/lib/supabase/client'
import {
  getEvidenceValidationPolicy,
  parseEvidenceSources,
  type EvidenceValidationPolicy,
} from '@/lib/evidence/boundary'

export interface EvidenceSourcePayload {
  userEvidence: Evidence[]
  aiStates: CrewAIValidationEvidenceState[]
}

interface FetchEvidenceOptions {
  supabase?: ReturnType<typeof createClient>
  policy?: Partial<EvidenceValidationPolicy>
}

export async function fetchEvidenceSources(
  projectId: string,
  options: FetchEvidenceOptions = {}
): Promise<EvidenceSourcePayload> {
  const supabase = options.supabase ?? createClient()
  const policy = getEvidenceValidationPolicy({
    source: 'useUnifiedEvidence',
    ...options.policy,
  })

  const [userResult, aiResult] = await Promise.all([
    supabase
      .from('evidence')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),

    supabase
      .from('crewai_validation_states')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false }),
  ])

  if (userResult.error) throw userResult.error
  if (aiResult.error) throw aiResult.error

  return parseEvidenceSources(userResult.data ?? [], aiResult.data ?? [], policy)
}

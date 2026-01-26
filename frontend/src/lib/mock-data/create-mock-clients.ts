/**
 * Create Mock Clients for Consultant Trial
 *
 * Creates 2 mock clients with realistic data for trial consultants.
 * Called during consultant trial onboarding.
 *
 * @story US-CT01, US-CT02
 */

import { createClient as createAdminClient } from '@/lib/supabase/admin';
import { MOCK_CLIENTS, type MockClientData } from './consultant-trial-clients';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create mock clients for a consultant trial user
 *
 * @param consultantId - The consultant's user ID
 * @returns Object with created mock client IDs
 */
export async function createMockClientsForTrial(consultantId: string): Promise<{
  success: boolean;
  mockClientIds: string[];
  error?: string;
}> {
  const supabase = createAdminClient();
  const mockClientIds: string[] = [];

  try {
    for (const mockData of MOCK_CLIENTS) {
      const result = await createSingleMockClient(supabase, consultantId, mockData);
      if (result.clientId) {
        mockClientIds.push(result.clientId);
      }
    }

    console.log(`[createMockClients] Created ${mockClientIds.length} mock clients for consultant ${consultantId}`);

    return {
      success: true,
      mockClientIds,
    };
  } catch (error) {
    console.error('[createMockClients] Failed to create mock clients:', error);
    return {
      success: false,
      mockClientIds,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a single mock client with all associated data
 */
async function createSingleMockClient(
  supabase: ReturnType<typeof createAdminClient>,
  consultantId: string,
  mockData: MockClientData
): Promise<{ clientId: string | null }> {
  // 1. Create mock user profile
  const mockUserId = uuidv4();
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: mockUserId,
      email: mockData.profile.email,
      full_name: mockData.profile.fullName,
      company: mockData.profile.company,
      role: 'founder', // Mock clients appear as founders
      is_mock: true,
      subscription_status: 'active', // Mock clients have "active" status for demo
      plan_status: 'active',
    });

  if (profileError) {
    console.error('[createMockClient] Failed to create mock user profile:', profileError);
    return { clientId: null };
  }

  // 2. Create consultant_clients relationship
  const inviteToken = `mock_${uuidv4().replace(/-/g, '')}`;
  const { error: relationError } = await supabase
    .from('consultant_clients')
    .insert({
      consultant_id: consultantId,
      client_id: mockUserId,
      invite_email: mockData.profile.email,
      invite_token: inviteToken,
      invite_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      client_name: mockData.profile.fullName,
      status: 'active', // Mock clients are already "active"
      linked_at: new Date().toISOString(),
      is_mock: true,
    });

  if (relationError) {
    console.error('[createMockClient] Failed to create consultant_clients relation:', relationError);
    return { clientId: null };
  }

  // 3. Create project for the mock client
  const projectId = uuidv4();
  const { error: projectError } = await supabase
    .from('projects')
    .insert({
      id: projectId,
      user_id: mockUserId,
      name: mockData.project.name,
      description: mockData.project.description,
      raw_idea: mockData.project.rawIdea,
      hints: mockData.project.hints,
      stage: mockData.project.stage,
      status: mockData.project.status,
      is_mock: true,
      hypotheses_count: mockData.experiments.length,
      experiments_count: mockData.experiments.length,
      evidence_count: mockData.evidence.length,
      evidence_quality: mockData.vpc.resonanceScore,
    });

  if (projectError) {
    console.error('[createMockClient] Failed to create project:', projectError);
    return { clientId: mockUserId };
  }

  // 4. Create VPC data
  const { error: vpcError } = await supabase
    .from('value_proposition_canvas')
    .insert({
      project_id: projectId,
      user_id: mockUserId,
      segment_key: mockData.vpc.segmentKey,
      segment_name: mockData.vpc.segmentName,
      source: mockData.vpc.source,
      resonance_score: mockData.vpc.resonanceScore,
      jobs: mockData.vpc.jobs,
      pains: mockData.vpc.pains,
      gains: mockData.vpc.gains,
      products_and_services: mockData.vpc.productsAndServices,
      pain_relievers: mockData.vpc.painRelievers,
      gain_creators: mockData.vpc.gainCreators,
    });

  if (vpcError) {
    console.error('[createMockClient] Failed to create VPC:', vpcError);
  }

  // 5. Create evidence items (identified as mock via project.is_mock)
  for (const evidenceItem of mockData.evidence) {
    await supabase.from('evidence').insert({
      project_id: projectId,
      category: evidenceItem.category,
      summary: evidenceItem.summary,
      content: evidenceItem.summary, // content is required
      strength: evidenceItem.strength,
      fit_type: evidenceItem.fitType,
      source: 'experiment',
    });
  }

  // 6. Create experiments (identified as mock via project.is_mock)
  for (const experiment of mockData.experiments) {
    await supabase.from('experiments').insert({
      project_id: projectId,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      status: experiment.status,
    });
  }

  console.log(`[createMockClient] Created mock client: ${mockData.profile.fullName} (${mockUserId})`);

  return { clientId: mockUserId };
}

/**
 * Archive/delete mock clients when consultant upgrades
 *
 * @param consultantId - The consultant's user ID
 * @param convertToSamples - If true, mark as samples instead of deleting
 */
export async function handleMockClientsOnUpgrade(
  consultantId: string,
  convertToSamples: boolean = true
): Promise<void> {
  const supabase = createAdminClient();

  if (convertToSamples) {
    // Mark mock clients as "samples" that can be archived
    await supabase
      .from('consultant_clients')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: 'system',
      })
      .eq('consultant_id', consultantId)
      .eq('is_mock', true);

    console.log(`[handleMockClientsOnUpgrade] Converted mock clients to archived samples for ${consultantId}`);
  }
}

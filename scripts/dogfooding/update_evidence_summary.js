const { createServiceClient, requireEnv } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/dogfooding/update_evidence_summary.js'
);

const client = createServiceClient();

async function main() {
  const taskId = process.env.TASK_ID || 'approve_vpc_completion';
  // Get the VPC approval request
  const { data, error } = await client
    .from('approval_requests')
    .select('id, title, task_id, task_output, evidence_summary')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('No VPC approval found');
    return;
  }

  const approval = data[0];
  console.log('Found approval:', approval.id);
  console.log('Task output:', JSON.stringify(approval.task_output, null, 2));
  console.log('Current evidence_summary:', JSON.stringify(approval.evidence_summary, null, 2));

  // Build evidence_summary from task_output
  const context = approval.task_output || {};
  const fitAssessment = context.fit_assessment || {};
  const customerProfile = context.customer_profile_summary || {};
  const valueMap = context.value_map_summary || {};

  const evidenceSummary = {
    summary: `VPC fit score: ${fitAssessment.fit_score || 0}/100. Customer: ${customerProfile.segment || 'Unknown'} (${customerProfile.jobs_count || 0} jobs, ${customerProfile.pains_count || 0} pains, ${customerProfile.gains_count || 0} gains). Value Map: ${valueMap.products_count || 0} product(s), ${valueMap.pain_relievers_count || 0} pain relievers, ${valueMap.gain_creators_count || 0} gain creators.`,
    key_learnings: fitAssessment.blockers || []
  };

  console.log('\nNew evidence_summary:', JSON.stringify(evidenceSummary, null, 2));

  // Update the record
  const { error: updateError } = await client
    .from('approval_requests')
    .update({ evidence_summary: evidenceSummary })
    .eq('id', approval.id);

  if (updateError) {
    console.error('Update error:', updateError.message);
    return;
  }

  console.log('\nUpdated successfully!');
}

main();

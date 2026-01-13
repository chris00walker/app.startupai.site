const { createServiceClient, requireEnv } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CONSULTANT_ID', 'PROJECT_ID'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CONSULTANT_ID=... PROJECT_ID=... node scripts/dogfooding/assign_consultant.js'
);

const client = createServiceClient();

async function main() {
  const consultantId = process.env.CONSULTANT_ID;
  const projectId = process.env.PROJECT_ID;

  console.log('Assigning consultant to StartupAI project...');

  const { data, error } = await client
    .from('projects')
    .update({ assigned_consultant: consultantId })
    .eq('id', projectId)
    .select();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Updated project:', JSON.stringify(data, null, 2));

  // Verify the update
  const { data: project, error: fetchError } = await client
    .from('projects')
    .select('id, name, user_id, assigned_consultant, status')
    .eq('id', projectId)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError.message);
    return;
  }

  console.log('\nProject Details:');
  console.log(`  Name: ${project.name}`);
  console.log(`  Owner (Founder): ${project.user_id}`);
  console.log(`  Assigned Consultant: ${project.assigned_consultant}`);
  console.log(`  Status: ${project.status}`);
  console.log('\nConsultant can now see this project in their dashboard!');
}

main();

const { createServiceClient, requireEnv, resolveUserIdByEmail } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CONSULTANT_ID=... FOUNDER_ID=... node scripts/dogfooding/debug_consultant.js'
);

const client = createServiceClient();

async function main() {
  console.log('=== Debug Consultant Project Visibility ===\n');

  const consultantId = process.env.CONSULTANT_ID
    || await resolveUserIdByEmail(client, process.env.CONSULTANT_EMAIL);
  const founderId = process.env.FOUNDER_ID
    || await resolveUserIdByEmail(client, process.env.FOUNDER_EMAIL);

  if (!consultantId || !founderId) {
    console.error('Missing consultant or founder identifiers.');
    console.error('Set CONSULTANT_ID/FOUNDER_ID or CONSULTANT_EMAIL/FOUNDER_EMAIL.');
    process.exit(1);
  }

  // Get clients
  const { data: clients } = await client
    .from('user_profiles')
    .select('id, email')
    .eq('consultant_id', consultantId);

  console.log('Clients:', clients);
  const clientIds = clients.map(c => c.id);
  console.log('Client IDs:', clientIds);

  // Check if founder is in the list
  console.log('\nFounder ID is in clients?', clientIds.includes(founderId));

  // Direct query for founder's projects
  console.log('\n--- Direct query for founder projects ---');
  const { data: founderProjects, error: fpError } = await client
    .from('projects')
    .select('id, name, user_id')
    .eq('user_id', founderId);

  console.log('Founder projects:', founderProjects);
  if (fpError) console.log('Error:', fpError.message);

  // Query using IN clause
  console.log('\n--- Query using IN clause ---');
  const { data: inProjects, error: inError } = await client
    .from('projects')
    .select('id, name, user_id')
    .in('user_id', clientIds);

  console.log('IN query results:', inProjects);
  if (inError) console.log('Error:', inError.message);

  // Check all projects
  console.log('\n--- All projects in database ---');
  const { data: allProjects } = await client
    .from('projects')
    .select('id, name, user_id')
    .limit(10);

  console.log('All projects:');
  allProjects?.forEach(p => {
    console.log(`  ${p.name}: user_id=${p.user_id}`);
    console.log(`    Matches founder? ${p.user_id === founderId}`);
    console.log(`    In clientIds? ${clientIds.includes(p.user_id)}`);
  });
}

main().catch(console.error);

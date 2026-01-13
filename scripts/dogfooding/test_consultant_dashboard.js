const { createServiceClient, requireEnv, resolveUserIdByEmail } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CONSULTANT_EMAIL', 'CONSULTANT_PASSWORD'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CONSULTANT_EMAIL=... CONSULTANT_PASSWORD=... node scripts/dogfooding/test_consultant_dashboard.js'
);

const client = createServiceClient();

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           CONSULTANT DASHBOARD TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const consultantEmail = process.env.CONSULTANT_EMAIL;
  const consultantPassword = process.env.CONSULTANT_PASSWORD;
  const consultantId = process.env.CONSULTANT_ID || await resolveUserIdByEmail(client, consultantEmail);

  if (!consultantId) {
    console.error('Unable to resolve consultant user ID.');
    console.error('Set CONSULTANT_ID or ensure CONSULTANT_EMAIL exists.');
    process.exit(1);
  }

  // Step 1: Verify login credentials work
  console.log('1. Testing Consultant login...');
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: consultantEmail,
    password: consultantPassword,
  });

  if (authError) {
    console.error('   ❌ Login failed:', authError.message);
    return;
  }

  console.log('   ✅ Login successful');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // Step 2: Check user profile
  console.log('\n2. Fetching user profile...');
  const { data: profile, error: profileError } = await client
    .from('user_profiles')
    .select('id, email, role, full_name')
    .eq('id', consultantId)
    .single();

  if (profileError) {
    console.error('   ❌ Profile fetch failed:', profileError.message);
  } else {
    console.log('   ✅ Profile loaded');
    console.log('   Role:', profile.role);
    console.log('   Name:', profile.full_name);
  }

  // Step 3: Fetch clients (users with consultant_id = this consultant)
  console.log('\n3. Fetching clients assigned to consultant...');
  const { data: clients, error: clientsError } = await client
    .from('user_profiles')
    .select('id, email, full_name, company, role')
    .eq('consultant_id', consultantId);

  if (clientsError) {
    console.error('   ❌ Clients fetch failed:', clientsError.message);
    return;
  }

  console.log('   ✅ Clients loaded:', clients.length, 'client(s)');
  clients.forEach((c, i) => {
    console.log(`\n   ┌─ Client ${i + 1}: ${c.full_name || c.email}`);
    console.log(`   │  Email: ${c.email}`);
    console.log(`   │  Company: ${c.company || 'N/A'}`);
    console.log(`   └  Role: ${c.role}`);
  });

  // Step 4: Fetch projects for all clients
  console.log('\n4. Fetching projects for all clients...');
  const clientIds = clients.map(c => c.id);
  console.log('   Client IDs:', clientIds);

  const { data: clientProjects, error: projectsError } = await client
    .from('projects')
    .select('id, user_id, name, description, status, stage, gate_status')
    .in('user_id', clientIds);

  if (projectsError) {
    console.error('   ❌ Projects fetch failed:', projectsError.message);
  } else {
    console.log('   ✅ Projects loaded:', clientProjects?.length || 0, 'project(s)');
    clientProjects?.forEach((p, i) => {
      const owner = clients.find(c => c.id === p.user_id);
      console.log(`\n   ┌─ Project ${i + 1}: ${p.name}`);
      console.log(`   │  Owner: ${owner?.full_name || owner?.email}`);
      console.log(`   │  ID: ${p.id}`);
      console.log(`   │  Status: ${p.status}`);
      console.log(`   │  Stage: ${p.stage}`);
      console.log(`   └  Gate Status: ${p.gate_status}`);
    });
  }

  // Step 5: Fetch validation states for client projects
  console.log('\n5. Fetching validation states for client projects...');
  if (clientProjects && clientProjects.length > 0) {
    const projectIds = clientProjects.map(p => p.id);
    const { data: states, error: statesError } = await client
      .from('crewai_validation_states')
      .select('id, project_id, phase, desirability_signal, feasibility_signal, viability_signal')
      .in('project_id', projectIds);

    if (statesError) {
      console.error('   ❌ States fetch failed:', statesError.message);
    } else {
      console.log('   ✅ States loaded:', states?.length || 0, 'state(s)');
    }
  } else {
    console.log('   (No projects to fetch states for)');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           DASHBOARD SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n✅ Consultant can login with ${consultantEmail}`);
  console.log(`✅ Role: "${profile?.role}"`);
  console.log(`✅ Clients: ${clients?.length || 0}`);
  console.log(`✅ Client Projects: ${clientProjects?.length || 0}`);
  console.log('\n📍 Browser URL: http://localhost:3001/consultant-dashboard');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

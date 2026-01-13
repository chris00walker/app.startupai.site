const { createServiceClient, requireEnv, resolveUserIdByEmail } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FOUNDER_EMAIL', 'FOUNDER_PASSWORD'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FOUNDER_EMAIL=... FOUNDER_PASSWORD=... node scripts/dogfooding/test_founder_dashboard.js'
);

const client = createServiceClient();

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           FOUNDER DASHBOARD TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const founderEmail = process.env.FOUNDER_EMAIL;
  const founderPassword = process.env.FOUNDER_PASSWORD;
  const founderId = process.env.FOUNDER_ID || await resolveUserIdByEmail(client, founderEmail);

  if (!founderId) {
    console.error('Unable to resolve founder user ID.');
    console.error('Set FOUNDER_ID or ensure FOUNDER_EMAIL exists.');
    process.exit(1);
  }

  // Step 1: Verify login credentials work
  console.log('1. Testing Founder login...');
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: founderEmail,
    password: founderPassword,
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
    .eq('id', founderId)
    .single();

  if (profileError) {
    console.error('   ❌ Profile fetch failed:', profileError.message);
  } else {
    console.log('   ✅ Profile loaded');
    console.log('   Role:', profile.role);
    console.log('   Name:', profile.full_name);
  }

  // Step 3: Fetch projects (what founder-dashboard shows)
  console.log('\n3. Fetching projects (founder-dashboard view)...');
  const { data: projects, error: projectsError } = await client
    .from('projects')
    .select('id, name, description, status, stage, gate_status, created_at, updated_at')
    .eq('user_id', founderId)
    .order('updated_at', { ascending: false });

  if (projectsError) {
    console.error('   ❌ Projects fetch failed:', projectsError.message);
  } else {
    console.log('   ✅ Projects loaded:', projects.length, 'project(s)');
    projects.forEach((p, i) => {
      console.log(`\n   ┌─ Project ${i + 1}: ${p.name}`);
      console.log(`   │  ID: ${p.id}`);
      console.log(`   │  Status: ${p.status}`);
      console.log(`   │  Stage: ${p.stage}`);
      console.log(`   │  Gate Status: ${p.gate_status}`);
      console.log(`   └  Description: ${p.description?.substring(0, 60)}...`);
    });
  }

  // Step 4: Fetch pending approvals
  console.log('\n4. Fetching pending approvals...');
  const { data: approvals, error: approvalsError } = await client
    .from('approval_requests')
    .select('id, title, status, task_id, created_at, evidence_summary')
    .eq('user_id', founderId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (approvalsError) {
    console.error('   ❌ Approvals fetch failed:', approvalsError.message);
  } else {
    const pending = approvals.filter(a => a.status === 'pending');
    console.log('   ✅ Approvals loaded:', approvals.length, 'total,', pending.length, 'pending');

    if (approvals.length > 0) {
      console.log('\n   Recent approvals:');
      approvals.slice(0, 5).forEach((a, i) => {
        console.log(`\n   ┌─ Approval ${i + 1}: ${a.title}`);
        console.log(`   │  ID: ${a.id}`);
        console.log(`   │  Status: ${a.status}`);
        console.log(`   │  Task: ${a.task_id}`);
        if (a.evidence_summary) {
          const summary = typeof a.evidence_summary === 'string'
            ? a.evidence_summary
            : JSON.stringify(a.evidence_summary);
          console.log(`   └  Evidence: ${summary.substring(0, 80)}...`);
        } else {
          console.log(`   └  Evidence: (none)`);
        }
      });
    }
  }

  // Step 5: Check validation state
  console.log('\n5. Fetching validation states...');
  if (projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    const { data: states, error: statesError } = await client
      .from('crewai_validation_states')
      .select('id, project_id, phase, desirability_signal, feasibility_signal, viability_signal, human_approval_status')
      .in('project_id', projectIds);

    if (statesError) {
      console.error('   ❌ States fetch failed:', statesError.message);
    } else {
      console.log('   ✅ States loaded:', states?.length || 0, 'state(s)');
      states?.forEach((s, i) => {
        console.log(`\n   ┌─ State ${i + 1}:`);
        console.log(`   │  Project ID: ${s.project_id}`);
        console.log(`   │  Phase: ${s.phase}`);
        console.log(`   │  D-Signal: ${s.desirability_signal}`);
        console.log(`   │  F-Signal: ${s.feasibility_signal}`);
        console.log(`   │  V-Signal: ${s.viability_signal}`);
        console.log(`   └  Approval: ${s.human_approval_status}`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('           DASHBOARD SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n✅ Founder can login with ${founderEmail}`);
  console.log(`✅ Role: "${profile?.role}"`);
  console.log(`✅ Projects: ${projects?.length || 0}`);
  console.log(`✅ Approvals: ${approvals?.length || 0} total`);
  console.log('\n📍 Browser URL: http://localhost:3001/founder-dashboard');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);

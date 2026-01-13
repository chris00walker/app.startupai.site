const { createServiceClient, requireEnv } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FOUNDER_EMAIL', 'CONSULTANT_EMAIL'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FOUNDER_EMAIL=... CONSULTANT_EMAIL=... node scripts/dogfooding/verify_test_setup.js'
);

const client = createServiceClient();

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║               DOGFOODING TEST SETUP VERIFICATION                      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const founderEmail = process.env.FOUNDER_EMAIL;
  const consultantEmail = process.env.CONSULTANT_EMAIL;

  // === FOUNDER ACCOUNT ===
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ FOUNDER ACCOUNT                                                       │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');

  const { data: founder, error: founderError } = await client
    .from('user_profiles')
    .select('id, email, role, full_name, consultant_id')
    .eq('email', founderEmail)
    .single();

  if (founderError || !founder) {
    console.log('│ ❌ Founder account NOT FOUND                                          │');
    return;
  }

  console.log(`│ ✅ Email: ${founder.email.padEnd(54)}│`);
  console.log(`│ ✅ Role: ${founder.role.padEnd(55)}│`);
  console.log(`│ ✅ User ID: ${founder.id.padEnd(52)}│`);
  console.log(`│ ✅ Assigned Consultant: ${(founder.consultant_id || 'None').toString().substring(0, 40)}│`);

  // Founder's projects
  const { data: founderProjects } = await client
    .from('projects')
    .select('id, name, status')
    .eq('user_id', founder.id);

  console.log(`│ ✅ Projects: ${(founderProjects?.length || 0)} project(s)`.padEnd(68) + '│');
  if (founderProjects && founderProjects.length > 0) {
    founderProjects.forEach(p => {
      console.log(`│    - ${p.name} (${p.status})`.padEnd(68) + '│');
    });
  }

  // Founder's approvals
  const { data: founderApprovals } = await client
    .from('approval_requests')
    .select('id, title, status')
    .eq('user_id', founder.id)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`│ ✅ Pending Approvals: ${(founderApprovals?.filter(a => a.status === 'pending').length || 0)} pending`.padEnd(47) + '│');
  console.log('└─────────────────────────────────────────────────────────────────────┘\n');

  // === CONSULTANT ACCOUNT ===
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ CONSULTANT ACCOUNT                                                    │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');

  const { data: consultant, error: consultantError } = await client
    .from('user_profiles')
    .select('id, email, role, full_name')
    .eq('email', consultantEmail)
    .single();

  if (consultantError || !consultant) {
    console.log('│ ❌ Consultant account NOT FOUND                                       │');
    return;
  }

  console.log(`│ ✅ Email: ${consultant.email.padEnd(54)}│`);
  console.log(`│ ✅ Role: ${consultant.role.padEnd(55)}│`);
  console.log(`│ ✅ User ID: ${consultant.id.padEnd(52)}│`);

  // Consultant's clients
  const { data: clients } = await client
    .from('user_profiles')
    .select('id, email, full_name')
    .eq('consultant_id', consultant.id);

  console.log(`│ ✅ Clients: ${(clients?.length || 0)} client(s)`.padEnd(56) + '│');
  if (clients && clients.length > 0) {
    clients.forEach(c => {
      console.log(`│    - ${c.email}`.padEnd(68) + '│');
    });
  }
  console.log('└─────────────────────────────────────────────────────────────────────┘\n');

  // === TEST CREDENTIALS ===
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ TEST CREDENTIALS                                                      │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  console.log('│ Founder Login:                                                        │');
  console.log('│   URL: http://localhost:3001/login                                    │');
  console.log(`│   Email: ${founderEmail.padEnd(59)}│`);
  console.log(`│   Password: ${(process.env.FOUNDER_PASSWORD || '(set FOUNDER_PASSWORD)').padEnd(56)}│`);
  console.log('│                                                                       │');
  console.log('│ Consultant Login:                                                     │');
  console.log('│   URL: http://localhost:3001/login                                    │');
  console.log(`│   Email: ${consultantEmail.padEnd(59)}│`);
  console.log(`│   Password: ${(process.env.CONSULTANT_PASSWORD || '(set CONSULTANT_PASSWORD)').padEnd(54)}│`);
  console.log('└─────────────────────────────────────────────────────────────────────┘\n');

  // === EXPECTED NAVIGATION ===
  console.log('┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ EXPECTED NAVIGATION                                                   │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  console.log('│ Founder Journey:                                                      │');
  console.log('│   /login → /founder-dashboard → /project/{id} → /approvals            │');
  console.log('│                                                                       │');
  console.log('│ Consultant Journey:                                                   │');
  console.log('│   /login → /consultant-dashboard → /client/{id} → /approvals          │');
  console.log('└─────────────────────────────────────────────────────────────────────┘\n');

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SETUP COMPLETE - Ready for browser testing!                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
}

main();

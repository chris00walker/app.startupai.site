const { createServiceClient, requireEnv, resolveUserIdByEmail } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FOUNDER_EMAIL=... CONSULTANT_EMAIL=... node scripts/dogfooding/link_founder_to_consultant.js'
);

const client = createServiceClient();

async function main() {
  console.log('=== Linking Founder to Consultant ===\n');

  const founderEmail = process.env.FOUNDER_EMAIL;
  const consultantEmail = process.env.CONSULTANT_EMAIL;
  const founderId = process.env.FOUNDER_ID || await resolveUserIdByEmail(client, founderEmail);
  const consultantId = process.env.CONSULTANT_ID || await resolveUserIdByEmail(client, consultantEmail);

  if (!founderId || !consultantId) {
    console.error('Unable to resolve founder or consultant user IDs.');
    console.error('Set FOUNDER_ID/CONSULTANT_ID or provide FOUNDER_EMAIL/CONSULTANT_EMAIL.');
    process.exit(1);
  }

  // Check current state
  console.log('1. Current founder profile...');
  const { data: current, error: currentError } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', founderId)
    .single();

  if (currentError) {
    console.error('   Error:', currentError.message);
    return;
  }

  console.log('   Current consultant_id:', current.consultant_id);

  // Update founder to have consultant_id
  console.log('\n2. Setting consultant_id on founder profile...');
  const { data: updated, error: updateError } = await client
    .from('user_profiles')
    .update({ consultant_id: consultantId })
    .eq('id', founderId)
    .select()
    .single();

  if (updateError) {
    console.error('   Error:', updateError.message);
    console.log('\n   The consultant_id column might not exist. Let me check...');

    // Check the columns
    const { data: cols, error: colsError } = await client.rpc('exec', {
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'`
    });

    if (colsError) {
      // Try to get column info via regular query
      console.log('   Checking by selecting all columns...');
      const { data: sample, error: sampleError } = await client
        .from('user_profiles')
        .select('*')
        .limit(1)
        .single();

      if (!sampleError && sample) {
        console.log('   Available columns:', Object.keys(sample).join(', '));
      }
    }
    return;
  }

  console.log('   Updated consultant_id:', updated.consultant_id);

  // Verify the relationship
  console.log('\n3. Verifying the relationship...');
  const { data: verify, error: verifyError } = await client
    .from('user_profiles')
    .select('id, email, role, consultant_id')
    .eq('consultant_id', consultantId);

  if (verifyError) {
    console.error('   Verify error:', verifyError.message);
    return;
  }

  console.log('   Clients assigned to consultant:', verify.length);
  verify.forEach(c => {
    console.log(`     - ${c.email} (${c.role})`);
  });

  console.log('\n=== Success ===');
  console.log('Consultant should now see founder as a client in their dashboard');
}

main();

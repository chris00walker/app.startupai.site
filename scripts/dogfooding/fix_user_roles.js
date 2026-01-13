const { createServiceClient, requireEnv, resolveUserIdByEmail } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FOUNDER_EMAIL', 'CONSULTANT_EMAIL'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FOUNDER_EMAIL=... CONSULTANT_EMAIL=... node scripts/dogfooding/fix_user_roles.js'
);

const client = createServiceClient();

async function main() {
  console.log('=== Checking and Fixing User Roles ===\n');

  const founderEmail = process.env.FOUNDER_EMAIL;
  const consultantEmail = process.env.CONSULTANT_EMAIL;
  const founderId = process.env.FOUNDER_ID || await resolveUserIdByEmail(client, founderEmail);
  const consultantId = process.env.CONSULTANT_ID || await resolveUserIdByEmail(client, consultantEmail);

  if (!founderId || !consultantId) {
    console.error('Unable to resolve founder or consultant user IDs.');
    console.error('Set FOUNDER_ID/CONSULTANT_ID or ensure the emails exist in Supabase.');
    process.exit(1);
  }

  // Check current user_profiles
  console.log('1. Checking current user_profiles...');
  const { data: profiles, error: profilesError } = await client
    .from('user_profiles')
    .select('id, email, role, full_name')
    .in('id', [founderId, consultantId]);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
  }

  console.log('   Current profiles:', JSON.stringify(profiles, null, 2));

  // Update or create Founder profile
  console.log('\n2. Ensuring Founder profile has role=founder...');
  const { data: founderProfile, error: founderError } = await client
    .from('user_profiles')
    .upsert({
      id: founderId,
      email: founderEmail,
      role: 'founder',
      full_name: process.env.FOUNDER_NAME || 'Founder',
      subscription_tier: 'free',
      plan_status: 'active'
    }, { onConflict: 'id' })
    .select()
    .single();

  if (founderError) {
    console.error('   Error updating founder:', founderError.message);
  } else {
    console.log('   Founder profile:', founderProfile.email, '→', founderProfile.role);
  }

  // Update or create Consultant profile
  console.log('\n3. Ensuring Consultant profile has role=consultant...');
  const { data: consultantProfile, error: consultantError } = await client
    .from('user_profiles')
    .upsert({
      id: consultantId,
      email: consultantEmail,
      role: 'consultant',
      full_name: process.env.CONSULTANT_NAME || 'Consultant',
      subscription_tier: 'free',
      plan_status: 'active'
    }, { onConflict: 'id' })
    .select()
    .single();

  if (consultantError) {
    console.error('   Error updating consultant:', consultantError.message);
  } else {
    console.log('   Consultant profile:', consultantProfile.email, '→', consultantProfile.role);
  }

  // Verify the updates
  console.log('\n4. Verifying profiles...');
  const { data: verifyProfiles, error: verifyError } = await client
    .from('user_profiles')
    .select('id, email, role')
    .in('id', [founderId, consultantId]);

  if (verifyError) {
    console.error('   Error verifying:', verifyError.message);
  } else {
    console.log('   Final profiles:');
    verifyProfiles.forEach(p => {
      console.log(`     ${p.email} → role: ${p.role}`);
    });
  }

  console.log('\n=== Summary ===');
  console.log(`Founder (${founderEmail}) should now see founder-dashboard`);
  console.log(`Consultant (${consultantEmail}) should now see consultant-dashboard with clients`);
}

main();

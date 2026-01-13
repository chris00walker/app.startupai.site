const { createClient } = require('@supabase/supabase-js');

function missingEnv(required) {
  return required.filter((name) => !process.env[name]);
}

function requireEnv(required, example) {
  const missing = missingEnv(required);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    if (example) {
      console.error(`Example: ${example}`);
    }
    process.exit(1);
  }
}

function createServiceClient() {
  requireEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function resolveUserIdByEmail(client, email) {
  if (!email) return null;

  const { data: profile, error: profileError } = await client
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!profileError && profile?.id) {
    return profile.id;
  }

  if (client.auth?.admin?.listUsers) {
    const { data: users, error: usersError } = await client.auth.admin.listUsers();
    if (!usersError && users?.users) {
      const match = users.users.find((user) => user.email === email);
      return match?.id || null;
    }
  }

  return null;
}

module.exports = {
  createServiceClient,
  missingEnv,
  requireEnv,
  resolveUserIdByEmail,
};

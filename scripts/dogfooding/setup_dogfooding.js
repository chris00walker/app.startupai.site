const { createServiceClient, requireEnv } = require('./_helpers');

requireEnv(
  ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'FOUNDER_EMAIL', 'CONSULTANT_EMAIL'],
  'SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FOUNDER_EMAIL=... CONSULTANT_EMAIL=... node scripts/dogfooding/setup_dogfooding.js'
);

const client = createServiceClient();

async function main() {
  console.log('=== Setting up Dogfooding Test Data ===\n');
  const founderEmail = process.env.FOUNDER_EMAIL;
  const consultantEmail = process.env.CONSULTANT_EMAIL;
  const projectName = process.env.PROJECT_NAME || 'StartupAI';

  // Step 1: Find Founder user
  console.log(`1. Looking for Founder user (${founderEmail})...`);
  const { data: founderUsers, error: founderError } = await client.auth.admin.listUsers();

  if (founderError) {
    console.error('Error listing users:', founderError.message);
    return;
  }

  const founder = founderUsers.users.find(u => u.email === founderEmail);
  const consultant = founderUsers.users.find(u => u.email === consultantEmail);

  if (!founder) {
    console.error(`Founder account not found! Please create account with ${founderEmail}`);
    return;
  }
  console.log(`   Found Founder: ${founder.id}`);

  if (!consultant) {
    console.error(`Consultant account not found! Please create account with ${consultantEmail}`);
    return;
  }
  console.log(`   Found Consultant: ${consultant.id}`);

  // Step 2: Check if project already exists
  console.log(`\n2. Checking for existing ${projectName} project...`);
  const { data: existingProjects, error: projectsError } = await client
    .from('projects')
    .select('id, name, user_id')
    .eq('user_id', founder.id)
    .ilike('name', `%${projectName}%`);

  if (projectsError) {
    console.error('Error checking projects:', projectsError.message);
    return;
  }

  let projectId;
  if (existingProjects && existingProjects.length > 0) {
    console.log(`   Found existing project: ${existingProjects[0].name} (${existingProjects[0].id})`);
    projectId = existingProjects[0].id;
  } else {
    // Create project
    console.log('   No existing project found. Creating project...');
    const { data: newProject, error: createError } = await client
      .from('projects')
      .insert({
        user_id: founder.id,
        name: projectName,
        description: process.env.PROJECT_DESCRIPTION || 'Dogfooding project',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating project:', createError.message);
      return;
    }
    console.log(`   Created project: ${newProject.id}`);
    projectId = newProject.id;
  }

  // Step 3: Check if consultant-client relationship exists
  console.log('\n3. Checking for consultant-client relationship...');
  const { data: existingRelation, error: relationError } = await client
    .from('consultant_clients')
    .select('id, consultant_id, project_id')
    .eq('consultant_id', consultant.id)
    .eq('project_id', projectId);

  if (relationError && !relationError.message.includes('does not exist')) {
    console.error('Error checking relationship:', relationError.message);
    // Table might not exist, let's try to create it anyway
  }

  if (existingRelation && existingRelation.length > 0) {
    console.log(`   Relationship already exists: ${existingRelation[0].id}`);
  } else {
    // Create consultant-client relationship
    console.log('   Creating consultant-client relationship...');
    const { data: newRelation, error: createRelError } = await client
      .from('consultant_clients')
      .insert({
        consultant_id: consultant.id,
        project_id: projectId,
        client_name: 'Chris Walker',
        status: 'active'
      })
      .select()
      .single();

    if (createRelError) {
      console.log(`   Note: ${createRelError.message}`);
      console.log('   (Table might not exist - will need to create migration)');
    } else {
      console.log(`   Created relationship: ${newRelation.id}`);
    }
  }

  // Step 4: Summary
  console.log('\n=== Summary ===');
  console.log(`Founder ID: ${founder.id}`);
  console.log(`Consultant ID: ${consultant.id}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`\nFounder can login at: http://localhost:3001/login`);
  console.log(`  Email: ${founderEmail}`);
  console.log(`  Password: ${process.env.FOUNDER_PASSWORD || '(set FOUNDER_PASSWORD)'}`);
  console.log(`\nConsultant can login at: http://localhost:3001/login`);
  console.log(`  Email: ${consultantEmail}`);
  console.log(`  Password: ${process.env.CONSULTANT_PASSWORD || '(set CONSULTANT_PASSWORD)'}`);
}

main();

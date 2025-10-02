/**
 * Database Seed Script
 * 
 * Populates Supabase with existing mock data for testing and development.
 * Run with: pnpm db:seed
 */

import { createClient } from '@supabase/supabase-js';
import {
  demoClient,
  demoValuePropositionCanvas,
  demoBusinessModelCanvas,
  demoTestingBusinessIdeas,
} from '../data/demoData';
import {
  mockPortfolioProjects,
} from '../data/portfolioMockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Create a test user for seeding data
 */
async function createTestUser() {
  console.log('\n🔐 Creating test user...');
  
  const testEmail = 'test@startupai.site';
  const testPassword = 'Test123456!';

  // Try to sign up the user (will fail if already exists)
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('❌ Error creating user:', signUpError);
    throw signUpError;
  }

  // Get user ID
  const { data, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Error listing users:', listError);
    throw listError;
  }

  const testUser = data.users?.find(u => u.email === testEmail);
  
  if (!testUser) {
    throw new Error('Test user not found after creation');
  }

  console.log(`✅ Test user ready: ${testEmail} (${testUser.id})`);
  console.log(`   Password: ${testPassword}`);
  
  return testUser.id;
}

/**
 * Seed user profile
 */
async function seedUserProfile(userId: string) {
  console.log('\n👤 Seeding user profile...');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email: 'test@startupai.site',
      full_name: 'Test User',
      company: 'StartupAI Demo',
      subscription_tier: 'pro',
      subscription_status: 'active',
      trial_expires_at: null,
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error seeding user profile:', error);
    throw error;
  }

  console.log('✅ User profile seeded');
  return data;
}

/**
 * Seed projects from mock data
 */
async function seedProjects(userId: string) {
  console.log('\n📁 Seeding projects...');
  
  const projectsToSeed = [
    ...mockPortfolioProjects.map(p => ({
      name: p.clientName,
      description: `${p.stage} stage project for ${p.clientName}`,
      user_id: userId,
      status: 'active',
    })),
    {
      name: demoClient.name,
      description: demoClient.description,
      user_id: userId,
      status: 'active',
    }
  ];

  // Remove duplicates by name
  const uniqueProjects = projectsToSeed.filter((project, index, self) =>
    index === self.findIndex((p) => p.name === project.name)
  );

  const { data, error } = await supabase
    .from('projects')
    .upsert(uniqueProjects, {
      onConflict: 'name,user_id',
      ignoreDuplicates: true
    })
    .select();

  if (error) {
    console.error('❌ Error seeding projects:', error);
    throw error;
  }

  console.log(`✅ Seeded ${data?.length || 0} projects`);
  return data || [];
}

/**
 * Seed evidence items
 */
async function seedEvidence(projects: any[]) {
  console.log('\n📊 Seeding evidence...');
  
  // Find the TechStart project
  const techStartProject = projects.find(p => p.name === 'TechStart Inc.');
  
  if (!techStartProject) {
    console.warn('⚠️  TechStart project not found, skipping evidence seeding');
    return [];
  }

  const evidenceItems = [
    // From VPC
    {
      project_id: techStartProject.id,
      content: 'Customer Jobs: Stay fit and healthy, Track workout progress, Get personalized fitness guidance',
      source_type: 'canvas',
      source_url: null,
      tags: ['customer-jobs', 'vpc', 'desirability'],
    },
    {
      project_id: techStartProject.id,
      content: 'Customer Pains: Lack of personalized workout plans, Difficulty staying motivated, Expensive personal trainers',
      source_type: 'canvas',
      source_url: null,
      tags: ['pains', 'vpc', 'desirability'],
    },
    // From TBI Hypotheses
    ...demoTestingBusinessIdeas.data.hypotheses.map((h, idx) => ({
      project_id: techStartProject.id,
      content: `Hypothesis: ${h.hypothesis}. Test Method: ${h.testMethod}. Results: ${h.results}`,
      source_type: 'experiment',
      source_url: null,
      tags: [h.category.toLowerCase(), 'hypothesis', h.status],
    })),
    // From TBI Experiments
    ...demoTestingBusinessIdeas.data.experiments.map((e) => ({
      project_id: techStartProject.id,
      content: `Experiment: ${e.name}. Results: ${JSON.stringify(e.results)}`,
      source_type: 'experiment',
      source_url: null,
      tags: ['experiment', e.status],
    })),
  ];

  const { data, error } = await supabase
    .from('evidence')
    .insert(evidenceItems)
    .select();

  if (error) {
    console.error('❌ Error seeding evidence:', error);
    throw error;
  }

  console.log(`✅ Seeded ${data?.length || 0} evidence items`);
  return data || [];
}

/**
 * Seed AI-generated reports
 */
async function seedReports(projects: any[]) {
  console.log('\n📄 Seeding reports...');
  
  const techStartProject = projects.find(p => p.name === 'TechStart Inc.');
  
  if (!techStartProject) {
    console.warn('⚠️  TechStart project not found, skipping report seeding');
    return [];
  }

  const reports = [
    {
      project_id: techStartProject.id,
      report_type: 'value_proposition_canvas',
      title: demoValuePropositionCanvas.title,
      content: {
        ...demoValuePropositionCanvas.data,
        qualityScore: demoValuePropositionCanvas.qualityScore,
        aiInsights: demoValuePropositionCanvas.aiInsights,
      },
      model: 'gpt-4',
      tokens_used: '2500',
    },
    {
      project_id: techStartProject.id,
      report_type: 'business_model_canvas',
      title: demoBusinessModelCanvas.title,
      content: {
        ...demoBusinessModelCanvas.data,
        qualityScore: demoBusinessModelCanvas.qualityScore,
        aiInsights: demoBusinessModelCanvas.aiInsights,
      },
      model: 'gpt-4',
      tokens_used: '3200',
    },
    {
      project_id: techStartProject.id,
      report_type: 'testing_business_ideas',
      title: demoTestingBusinessIdeas.title,
      content: {
        ...demoTestingBusinessIdeas.data,
        qualityScore: demoTestingBusinessIdeas.qualityScore,
        aiInsights: demoTestingBusinessIdeas.aiInsights,
      },
      model: 'gpt-4',
      tokens_used: '4500',
    },
  ];

  const { data, error } = await supabase
    .from('reports')
    .insert(reports)
    .select();

  if (error) {
    console.error('❌ Error seeding reports:', error);
    throw error;
  }

  console.log(`✅ Seeded ${data?.length || 0} reports`);
  return data || [];
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');
  console.log('━'.repeat(50));

  try {
    // 1. Create test user
    const userId = await createTestUser();

    // 2. Seed user profile
    await seedUserProfile(userId);

    // 3. Seed projects
    const projects = await seedProjects(userId);

    // 4. Seed evidence
    await seedEvidence(projects);

    // 5. Seed reports
    await seedReports(projects);

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Database seeded successfully!\n');
    console.log('📝 Test credentials:');
    console.log('   Email: test@startupai.site');
    console.log('   Password: Test123456!');
    console.log('\n💡 You can now login and see the seeded data!');
    
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

export { seed };

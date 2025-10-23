/**
 * Database Seed Script
 * 
 * Populates Supabase with existing mock data for testing and development.
 * Run with: pnpm db:seed
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import {
  getDemoClient,
  getDemoValuePropositionCanvas,
  getDemoBusinessModelCanvas,
  getDemoTestingBusinessIdeas,
} from '../data/demoData';
import {
  mockPortfolioProjects,
} from '../data/portfolioMockData';
import type { UserRole } from '../db/schema';

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
async function getOrCreateUser({
  email,
  password,
  role,
  subscriptionTier,
  subscriptionStatus,
  planStatus = 'active',
  trialExpiresAt = null,
  company = 'StartupAI',
  fullName,
}: {
  email: string;
  password: string;
  role: UserRole;
  subscriptionTier: string;
  subscriptionStatus: string;
  planStatus?: string;
  trialExpiresAt?: string | null;
  company?: string;
  fullName: string;
}) {
  console.log(`\n🔐 Ensuring user exists: ${email}`);

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Error listing users:', listError);
    throw listError;
  }

  let user = listData.users?.find(u => u.email === email);

  if (!user) {
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role,
      },
      user_metadata: {
        full_name: fullName,
        company,
      },
    });

    if (signUpError) {
      console.error('❌ Error creating user:', signUpError);
      throw signUpError;
    }

    user = signUpData.user;
  } else if (user.app_metadata?.role !== role) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        role,
      },
    });

    if (updateError) {
      console.error('❌ Error updating user metadata:', updateError);
      throw updateError;
    }
  }

  if (!user) {
    throw new Error(`User not found after creation: ${email}`);
  }

  console.log(`✅ User ready: ${email} (${user.id}) [role=${role}]`);

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email,
      full_name: fullName,
      company,
      subscription_tier: subscriptionTier,
      subscription_status: subscriptionStatus,
      plan_status: planStatus,
      trial_expires_at: trialExpiresAt,
      role,
    }, {
      onConflict: 'id'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error upserting user profile:', error);
    throw error;
  }

  return {
    userId: user.id,
    profile: data,
    credentials: { email, password },
  };
}

/**
 * Seed projects from mock data with full portfolio fields
 */
async function seedProjects(userId: string, demoClient: any) {
  console.log('\n📁 Seeding projects...');
  
  // First, delete existing test projects for this user
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.warn('⚠️  Error deleting existing projects:', deleteError);
  }

  const projectsToSeed = [
    ...mockPortfolioProjects.map(p => ({
      // Basic fields
      name: p.clientName,
      description: `${p.stage} stage project for ${p.clientName}`,
      user_id: userId,
      status: 'active',
      
      // Portfolio management fields
      stage: p.stage,
      gate_status: p.gateStatus,
      
      // Risk budget tracking
      risk_budget_planned: p.riskBudget.planned,
      risk_budget_actual: p.riskBudget.actual,
      risk_budget_delta: p.riskBudget.delta,
      
      // Consultant & activity tracking
      assigned_consultant: p.assignedConsultant,
      last_activity: new Date(), // Will be updated by activities
      next_gate_date: p.nextGateDate ? new Date(new Date().getFullYear(), new Date().getMonth(), parseInt(p.nextGateDate.split(' ')[1])) : null,
      
      // Evidence & quality metrics
      evidence_quality: p.evidenceQuality,
      hypotheses_count: p.hypothesesCount,
      experiments_count: p.experimentsCount,
      evidence_count: p.evidenceCount,
    })),
    {
      // Demo client project with defaults
      name: demoClient.name,
      description: demoClient.description,
      user_id: userId,
      status: 'active',
      stage: 'DESIRABILITY',
      gate_status: 'Pending',
      risk_budget_planned: 5.0,
      risk_budget_actual: 4.5,
      risk_budget_delta: -0.1,
      assigned_consultant: 'Demo Consultant',
      last_activity: new Date(),
      evidence_quality: 0.75,
      hypotheses_count: 8,
      experiments_count: 5,
      evidence_count: 15,
    }
  ];

  // Remove duplicates by name
  const uniqueProjects = projectsToSeed.filter((project, index, self) =>
    index === self.findIndex((p) => p.name === project.name)
  );

  const { data, error } = await supabase
    .from('projects')
    .insert(uniqueProjects)
    .select();

  if (error) {
    console.error('❌ Error seeding projects:', error);
    throw error;
  }

  console.log(`✅ Seeded ${data?.length || 0} projects with full portfolio fields`);
  return data || [];
}

/**
 * Seed evidence items
 */
async function seedEvidence(projects: any[], demoTestingBusinessIdeas: any) {
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
async function seedReports(projects: any[], demoValuePropositionCanvas: any, demoBusinessModelCanvas: any, demoTestingBusinessIdeas: any) {
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

  // Get demo data using lazy loading functions
  const demoClient = getDemoClient();
  const demoValuePropositionCanvas = getDemoValuePropositionCanvas();
  const demoBusinessModelCanvas = getDemoBusinessModelCanvas();
  const demoTestingBusinessIdeas = getDemoTestingBusinessIdeas();

  try {
    // 1. Create test user
    const users = await Promise.all([
      getOrCreateUser({
        email: 'admin@startupai.site',
        password: 'Admin123456!',
        role: 'admin',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        planStatus: 'active',
        company: 'StartupAI Admin',
        fullName: 'System Administrator',
      }),
      getOrCreateUser({
        email: 'founder@startupai.site',
        password: 'Founder123!',
        role: 'founder',
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        planStatus: 'active',
        company: 'Founder Co.',
        fullName: 'Founder User',
      }),
      getOrCreateUser({
        email: 'consultant@startupai.site',
        password: 'Consultant123!',
        role: 'consultant',
        subscriptionTier: 'enterprise',
        subscriptionStatus: 'active',
        planStatus: 'active',
        company: 'Consultant Collective',
        fullName: 'Consultant User',
      }),
      getOrCreateUser({
        email: 'trial@startupai.site',
        password: 'Trial123!',
        role: 'trial',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
        planStatus: 'trialing',
        trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        company: 'Trial Startup',
        fullName: 'Trial User',
      }),
    ]);

    const consultantUser = users.find(u => u.profile.role === 'consultant');
    if (!consultantUser) {
      throw new Error('Consultant user not seeded correctly');
    }

    // 2. Seed projects for consultant persona
    const projects = await seedProjects(consultantUser.userId, demoClient);

    // 3. Seed evidence
    await seedEvidence(projects, demoTestingBusinessIdeas);

    // 4. Seed reports
    await seedReports(projects, demoValuePropositionCanvas, demoBusinessModelCanvas, demoTestingBusinessIdeas);

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Database seeded successfully!\n');
    console.log('📝 Seeded user credentials:');
    for (const user of users) {
      console.log(`   ${user.profile.role.toUpperCase()}: ${user.credentials.email} / ${user.credentials.password}`);
    }
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

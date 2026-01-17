import { createClient } from '@supabase/supabase-js'

// Load env vars (supporting both naming conventions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  console.error('URL:', supabaseUrl ? 'OK' : 'MISSING')
  console.error('Service Key:', supabaseServiceKey ? 'OK' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDogfooding() {
  console.log('=== SUPABASE DOGFOODING STATUS CHECK ===')
  console.log(`Connected to: ${supabaseUrl}\n`)
  
  try {
    // 1. Check users table for test accounts
    console.log('1. TEST ACCOUNTS:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at, role')
      .in('email', ['chris00walker@proton.me', 'chris00walker@gmail.com'])
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('Error fetching users:', usersError.message)
    } else if (users && users.length > 0) {
      console.table(users)
    } else {
      console.log('No test accounts found')
    }
    
    // 2. Check onboarding_sessions
    console.log('\n2. ONBOARDING SESSIONS (last 5):')
    const { data: sessions, error: sessionsError } = await supabase
      .from('onboarding_sessions')
      .select('id, user_id, stage, completed, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError.message)
    } else if (sessions && sessions.length > 0) {
      console.table(sessions)
    } else {
      console.log('No onboarding sessions found')
    }
    
    // 3. Check entrepreneur_briefs
    console.log('\n3. ENTREPRENEUR BRIEFS (last 5):')
    const { data: briefs, error: briefsError } = await supabase
      .from('entrepreneur_briefs')
      .select('id, user_id, problem, solution, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (briefsError) {
      console.error('Error fetching briefs:', briefsError.message)
    } else if (briefs && briefs.length > 0) {
      console.table(briefs)
    } else {
      console.log('No entrepreneur briefs found')
    }
    
    // 4. Check projects
    console.log('\n4. PROJECTS (last 5):')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, owner_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError.message)
    } else if (projects && projects.length > 0) {
      console.table(projects)
    } else {
      console.log('No projects found')
    }
    
    // 5. Check validation_runs
    console.log('\n5. VALIDATION RUNS (last 5):')
    const { data: runs, error: runsError } = await supabase
      .from('validation_runs')
      .select('id, project_id, status, current_phase, current_stage, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)
    
    if (runsError) {
      console.error('Error fetching validation runs:', runsError.message)
    } else if (runs && runs.length > 0) {
      console.table(runs)
    } else {
      console.log('No validation runs found')
    }
    
    // 6. Check hitl_requests
    console.log('\n6. HITL REQUESTS (last 5):')
    const { data: hitl, error: hitlError } = await supabase
      .from('hitl_requests')
      .select('id, project_id, status, checkpoint_type, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (hitlError) {
      console.error('Error fetching HITL requests:', hitlError.message)
    } else if (hitl && hitl.length > 0) {
      console.table(hitl)
    } else {
      console.log('No HITL requests found')
    }
    
    console.log('\n=== DATABASE HEALTH: OK ===')
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

checkDogfooding().catch(console.error)

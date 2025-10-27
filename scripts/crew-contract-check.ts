#!/usr/bin/env tsx

/**
 * CrewAI Contract Check Script
 *
 * Usage:
 *   CREW_CONTRACT_BEARER="Bearer <supabase_jwt>" pnpm crew:contract-check
 *
 * Optional environment variables:
 *   CREW_ANALYZE_URL - override Netlify function URL
 */

const crewUrl = process.env.CREW_ANALYZE_URL ?? 'http://localhost:8888/.netlify/functions/crew-analyze';
const bearer = process.env.CREW_CONTRACT_BEARER;

if (!bearer) {
  console.warn('[crew-contract-check] Skipping check: set CREW_CONTRACT_BEARER to call the Netlify function.');
  process.exit(0);
}

async function run() {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: bearer.startsWith('Bearer') ? bearer : `Bearer ${bearer}`,
  };

  const startPayload = {
    action: 'conversation_start',
    plan_type: 'trial',
    user_context: {
      referralSource: 'contract_check',
      previousExperience: 'first_time',
      timeAvailable: 20,
    },
  };

  const startResponse = await fetch(crewUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(startPayload),
  });

  if (!startResponse.ok) {
    throw new Error(`conversation_start failed: ${startResponse.status} ${await startResponse.text()}`);
  }

  const startData = await startResponse.json();
  assertHas(startData, ['success', 'session', 'session.stage_snapshot']);

  const messageResponse = await fetch(crewUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'conversation_message',
      session_id: 'contract-check',
      message: 'We help independent consultants manage billing and admin flow.',
      current_stage: startData.session?.stage_state?.current_stage ?? 1,
      conversation_history: [],
      stage_data: {},
    }),
  });

  if (!messageResponse.ok) {
    throw new Error(`conversation_message failed: ${messageResponse.status} ${await messageResponse.text()}`);
  }

  const messageData = await messageResponse.json();
  assertHas(messageData, ['success', 'message', 'message.quality_signals', 'message.stage_snapshot']);

  const analysisResponse = await fetch(crewUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      strategic_question: 'How can we grow ARR to $1M in 12 months?',
      project_id: '11111111-1111-1111-1111-111111111111',
      project_context: 'B2B SaaS platform for restaurant inventory',
      priority_level: 'high',
    }),
  });

  if (!analysisResponse.ok) {
    throw new Error(`analysis failed: ${analysisResponse.status} ${await analysisResponse.text()}`);
  }

  const analysisData = await analysisResponse.json();
  assertHas(analysisData, ['success', 'analysis_id', 'result.summary', 'result.quality_signals']);

  console.log('✅ CrewAI contract check passed for', crewUrl);
}

function assertHas(obj: any, dottedKeys: string[]) {
  for (const dotted of dottedKeys) {
    const parts = dotted.split('.');
    let current: any = obj;
    for (const part of parts) {
      if (current && part in current) {
        current = current[part];
      } else {
        throw new Error(`Response missing expected field: ${dotted}`);
      }
    }
  }
}

run().catch((error) => {
  console.error('❌ CrewAI contract check failed');
  console.error(error);
  process.exit(1);
});

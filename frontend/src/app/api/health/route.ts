/**
 * @story US-A05
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[api/health] Health check received');
  
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    runtime: 'nodejs',
    version: process.version,
  });
}

export async function POST(req: NextRequest) {
  console.log('[api/health] Health POST received');
  
  const body = await req.json().catch(() => ({}));
  
  return NextResponse.json({
    status: 'healthy',
    method: 'POST',
    timestamp: new Date().toISOString(),
    echo: body,
  });
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // For now, return mock progress data
    // In a full implementation, this would query a database
    return NextResponse.json({
      success: true,
      currentStage: 1,
      overallProgress: 0,
      stageProgress: 0,
    });

  } catch (error: any) {
    console.error('[ConsultantStatus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

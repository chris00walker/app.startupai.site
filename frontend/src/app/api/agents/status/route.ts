import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement actual agent status monitoring
    // For now, return mock status to prevent 404 errors
    return NextResponse.json({
      success: true,
      data: {
        agents: []
      }
    })

  } catch (error) {
    console.error('Error in GET /api/agents/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

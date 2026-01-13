import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: projects, count: projectCount, error: projectsError } = await supabase
      .from("projects")
      .select("id, name", { count: "exact" })
      .eq("user_id", user.id)

    if (projectsError) {
      console.error("[api/analytics/dashboard] Projects query failed:", projectsError)
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    const projectIds = (projects || []).map((project) => project.id)

    const [
      validationsResult,
      completedValidationsResult,
      hypothesesResult,
      evidenceResult,
      clientsResult,
    ] = await Promise.all([
      supabase
        .from("crewai_validation_states")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("crewai_validation_states")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("phase", ["validated", "killed"]),
      projectIds.length > 0
        ? supabase
            .from("hypotheses")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
        : Promise.resolve({ count: 0, error: null }),
      projectIds.length > 0
        ? supabase
            .from("evidence")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
        : Promise.resolve({ count: 0, error: null }),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("consultant_id", user.id),
    ])

    if (
      validationsResult.error ||
      completedValidationsResult.error ||
      hypothesesResult.error ||
      evidenceResult.error ||
      clientsResult.error
    ) {
      console.error("[api/analytics/dashboard] Metric query failed:", {
        validations: validationsResult.error,
        completedValidations: completedValidationsResult.error,
        hypotheses: hypothesesResult.error,
        evidence: evidenceResult.error,
        clients: clientsResult.error,
      })
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    const payload = {
      metrics: {
        projects: projectCount || 0,
        validations: validationsResult.count || 0,
        hypotheses: hypothesesResult.count || 0,
        evidence: evidenceResult.count || 0,
        clients: clientsResult.count || 0,
      },
      workflows: {
        total: validationsResult.count || 0,
        completed: completedValidationsResult.count || 0,
      },
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error("[api/analytics/dashboard] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

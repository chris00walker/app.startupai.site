"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SignupForm, DEFAULT_PLAN_OPTIONS } from "@/components/signup-form"

function SignupContent() {
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<string>()

  useEffect(() => {
    if (!searchParams) {
      return
    }

    const planFromUrl = searchParams.get("plan")
    if (planFromUrl && DEFAULT_PLAN_OPTIONS.some((option) => option.id === planFromUrl)) {
      setSelectedPlan(planFromUrl)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col p-8 lg:p-12">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000"}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to marketing site
            </Link>
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <SignupForm selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex flex-col justify-center p-12">
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Accelerate your evidence-led journey</h1>
              <p className="text-xl text-muted-foreground">
                Select the plan that matches your momentum. Upgrade or switch plans anytime as your needs evolve.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Guided onboarding</h3>
                  <p className="text-sm text-muted-foreground">
                    Get paired with frameworks and AI agents that calibrate to your selected plan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Plan-specific analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboards and metrics adapt to your plan—from rapid sprints to recurring evidence programs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Switch anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Founder Platform or Agency Co-Pilot as your workload scales beyond the trial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}

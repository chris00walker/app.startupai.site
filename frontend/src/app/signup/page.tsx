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
    <div className="min-h-screen flex flex-col p-8 lg:p-12">
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
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}

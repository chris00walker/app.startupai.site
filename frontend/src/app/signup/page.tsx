"use client"

/**
 * Signup Page
 *
 * @story US-MF03
 */

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserCheck, Loader2 } from "lucide-react"
import { SignupForm, DEFAULT_PLAN_OPTIONS } from "@/components/signup-form"

interface InviteInfo {
  valid: boolean
  email: string
  clientName: string | null
  consultantId: string
  consultantName: string
  consultantCompany: string | null
  expiresAt: string
}

function SignupContent() {
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<string>()
  const [selectedRole, setSelectedRole] = useState<string>()
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchParams) {
      return
    }

    const planFromUrl = searchParams.get("plan")
    if (planFromUrl && DEFAULT_PLAN_OPTIONS.some((option) => option.id === planFromUrl)) {
      setSelectedPlan(planFromUrl)
    }

    const roleFromUrl = searchParams.get("role")
    if (roleFromUrl && ['founder', 'consultant'].includes(roleFromUrl)) {
      setSelectedRole(roleFromUrl)
    }

    // Check for invite token
    const invite = searchParams.get("invite")
    if (invite) {
      setInviteToken(invite)
      validateInvite(invite)
    }
  }, [searchParams])
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '/')

  const validateInvite = async (token: string) => {
    setInviteLoading(true)
    setInviteError(null)

    try {
      const response = await fetch(`/api/auth/validate-invite?token=${encodeURIComponent(token)}`)
      const data = await response.json()

      if (!response.ok || !data.valid) {
        setInviteError(data.error || "Invalid or expired invite")
        setInviteToken(null)
        return
      }

      setInviteInfo(data)
      // Force founder role for invited clients
      setSelectedRole("founder")
    } catch (error) {
      console.error("Failed to validate invite:", error)
      setInviteError("Failed to validate invite")
      setInviteToken(null)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-8 lg:p-12">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={marketingUrl}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to marketing site
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          {inviteLoading && (
            <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validating invite...</span>
            </div>
          )}

          {inviteError && (
            <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
              <p className="text-sm font-medium">{inviteError}</p>
              <p className="text-xs mt-1">You can still sign up for a regular account below.</p>
            </div>
          )}

          {inviteInfo && (
            <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Invited by {inviteInfo.consultantName}
                  </p>
                  {inviteInfo.consultantCompany && (
                    <p className="text-xs text-muted-foreground">
                      {inviteInfo.consultantCompany}
                    </p>
                  )}
                </div>
              </div>
              {inviteInfo.clientName && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Welcome, {inviteInfo.clientName}!
                </p>
              )}
            </div>
          )}

          <SignupForm
            selectedPlan={selectedPlan}
            selectedRole={selectedRole}
            onPlanChange={setSelectedPlan}
            onRoleChange={setSelectedRole}
            inviteToken={inviteToken}
            inviteInfo={inviteInfo}
          />
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

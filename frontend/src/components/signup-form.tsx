"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { analytics } from "@/lib/analytics"

type PlanOption = {
  id: string
  name: string
  description: string
  price: string
  bestFor: string
  badge?: string
}

type SignupFormProps = React.ComponentProps<"form"> & {
  planOptions?: PlanOption[]
  selectedPlan?: string
  selectedRole?: string
  onPlanChange?: (plan: string) => void
  onRoleChange?: (role: string) => void
}

export const DEFAULT_PLAN_OPTIONS: PlanOption[] = [
  {
    id: "founder-platform",
    name: "Founder Platform",
    description: "Continuous validation with AI strategist",
    price: "$199/mo",
    bestFor: "Founders scaling validated ideas"
  },
  {
    id: "strategy-sprint",
    name: "Strategy Sprint",
    description: "One-week evidence-backed strategy",
    price: "$1,500",
    bestFor: "Teams needing rapid direction"
  },
  {
    id: "agency-co-pilot",
    name: "Agency Co-Pilot",
    description: "White-label AI workflows for agencies",
    price: "$499/mo",
    bestFor: "Consultancies serving multiple clients"
  },
  {
    id: "trial",
    name: "Free Trial",
    description: "Test the core evidence experience",
    price: "$0",
    bestFor: "Getting started risk-free"
  }
]

export function SignupForm({
  className,
  planOptions = DEFAULT_PLAN_OPTIONS,
  selectedPlan,
  selectedRole,
  onPlanChange,
  onRoleChange,
  ...props
}: SignupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const supabase = useMemo(() => createClient(), [])
  const [localPlan, setLocalPlan] = useState(() => {
    if (selectedPlan && planOptions.some((option) => option.id === selectedPlan)) {
      return selectedPlan
    }
    return planOptions[0]?.id ?? "trial"
  })
  const [localRole, setLocalRole] = useState(() => {
    if (selectedRole && ['founder', 'consultant'].includes(selectedRole)) {
      return selectedRole
    }
    return 'founder' // Default to founder if no role specified
  })

  useEffect(() => {
    if (selectedPlan && planOptions.some((option) => option.id === selectedPlan)) {
      setLocalPlan(selectedPlan)
    }
  }, [selectedPlan, planOptions])

  useEffect(() => {
    if (selectedRole && ['founder', 'consultant'].includes(selectedRole)) {
      setLocalRole(selectedRole)
    }
  }, [selectedRole])

  const plan = selectedPlan ?? localPlan
  const role = selectedRole ?? localRole

  const handlePlanChange = (value: string) => {
    if (!planOptions.some((option) => option.id === value)) {
      return
    }
    if (!selectedPlan) {
      setLocalPlan(value)
    }
    onPlanChange?.(value)
  }

  const handleEmailSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      analytics.auth.signupStarted("email", plan)

      const { data: result, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            company,
            plan_choice: plan,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${plan}&role=${role}`,
        },
      })

      if (error) {
        setError(error.message)
        setIsSubmitting(false)
        return
      }

      if (result.user?.id) {
        analytics.auth.signupCompleted("email", plan, result.user.id)
      }

      setSuccess("Check your email to confirm your account. Click the verification link to get started - you can then close this tab.")
      setIsSubmitting(false)
    } catch (err) {
      console.error(err)
      setError("Sign up failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleGitHubSignup = async () => {
    setError(null)
    setSuccess(null)
    setIsOAuthLoading(true)

    analytics.auth.signupStarted("github", plan)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'user:email read:user',
          redirectTo: `${window.location.origin}/auth/callback?plan=${plan}&role=${role}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
        setIsOAuthLoading(false)
      } else {
        analytics.auth.signupInitiatedOAuth("github", plan)
      }
    } catch (err) {
      console.error('GitHub signup error:', err)
      setError('GitHub signup failed. Please try again.')
      setIsOAuthLoading(false)
      analytics.auth.signupFailed("github", plan, "exception")
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleEmailSignup} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Join StartupAI and unlock expert business guidance
        </p>
      </div>
      <div className="grid gap-6">
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Choose your plan</legend>
          <div className="grid gap-3">
            {planOptions.map((option) => (
              <label
                key={option.id}
                htmlFor={`plan-${option.id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-primary",
                  plan === option.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <input
                  type="radio"
                  id={`plan-${option.id}`}
                  name="plan"
                  value={option.id}
                  checked={plan === option.id}
                  onChange={(event) => handlePlanChange(event.target.value)}
                  className="mt-1 h-4 w-4 border border-primary text-primary focus-visible:outline-none"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{option.name}</span>
                    {option.badge && <Badge variant="secondary">{option.badge}</Badge>}
                    <span className="text-sm text-muted-foreground">{option.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                  <p className="text-xs text-muted-foreground">Best for: {option.bestFor}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting || isOAuthLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting || isOAuthLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="company">Company (Optional)</Label>
          <Input
            id="company"
            type="text"
            placeholder="Your Company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            disabled={isSubmitting || isOAuthLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting || isOAuthLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting || isOAuthLoading}
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
            {success}
          </div>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isOAuthLoading}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignup}
          disabled={isOAuthLoading || isSubmitting}
        >
          {isOAuthLoading ? "Connecting to GitHub..." : "Sign up with GitHub"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/login" className="underline underline-offset-4">
          Sign in
        </a>
      </div>
    </form>
  )
}

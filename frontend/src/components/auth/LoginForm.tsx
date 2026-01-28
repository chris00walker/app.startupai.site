/**
 * @story US-AU01, US-AU02
 */
"use client"

/**
 * LoginForm Component
 *
 * Minimal, distraction-free login form following competitor best practices.
 * Features:
 * - GitHub OAuth as primary option
 * - Email/password with visibility toggle
 * - Loading states on all buttons
 * - Clear error messaging
 * - Accessible form controls
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Rocket, Loader2, Github, AlertCircle, Eye, EyeOff } from "lucide-react"
import { signIn, signInWithGitHub } from "@/lib/auth/actions"
import { getRedirectForRole, deriveRole } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import { useFormAccessibility } from "@/hooks/useFormAccessibility"

interface LoginFormProps extends React.ComponentProps<"div"> {
  className?: string
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const emailA11y = useFormAccessibility('email')
  const passwordA11y = useFormAccessibility('password')

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true)
    setFormError(null)
    try {
      const result = await signInWithGitHub()

      if (result.error) {
        console.error('GitHub OAuth error:', result.error)
        setFormError(`GitHub sign-in failed: ${result.error}`)
        setIsGitHubLoading(false)
        return
      }

      if (result.url) {
        // Redirect to GitHub OAuth
        window.location.href = result.url
      } else {
        setFormError('No OAuth URL received')
        setIsGitHubLoading(false)
      }
    } catch (error) {
      console.error('GitHub sign in error:', error)
      setFormError('GitHub sign-in failed. Please try again.')
      setIsGitHubLoading(false)
    }
  }

  const handleEmailSignIn = async (formData: FormData) => {
    setIsLoading(true)
    setFormError(null)
    emailA11y.clearError()
    passwordA11y.clearError()

    try {
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      if (!email) {
        emailA11y.setError('Email is required')
        setIsLoading(false)
        return
      }

      if (!password) {
        passwordA11y.setError('Password is required')
        setIsLoading(false)
        return
      }

      const result = await signIn(email, password)

      if (result.success) {
        // Fetch user profile and use existing role redirect logic
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, plan_status, subscription_status')
            .eq('id', user.id)
            .single()

          const role = deriveRole({
            profileRole: profile?.role,
            appRole: user.app_metadata?.role as string | undefined,
          })

          const planStatus = profile?.plan_status ?? profile?.subscription_status ?? null

          const redirectPath = getRedirectForRole({ role, planStatus })
          window.location.href = redirectPath
        }
      } else {
        setFormError('Invalid email or password. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Email sign in error:', error)
      setFormError(error instanceof Error ? error.message : 'Sign in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || isGitHubLoading

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-xl shadow-black/[0.08]">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
              <Rocket className="h-7 w-7" />
            </div>
          </div>

          {/* Title - simplified, no feature selling */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-display font-bold">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to continue to StartupAI
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex flex-col gap-5">
            {/* GitHub OAuth - Primary CTA */}
            <Button
              onClick={handleGitHubSignIn}
              variant="default"
              size="lg"
              className="w-full h-12 text-base font-medium transition-all hover:shadow-lg active:scale-[0.98] active:shadow-md"
              disabled={isDisabled}
              aria-label="Sign in with GitHub"
            >
              {isGitHubLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* Form Error Alert */}
            {formError && (
              <div role="alert" aria-live="assertive">
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Email/Password Form */}
            <form action={handleEmailSignIn}>
              <div className="grid gap-4">
                {/* Email Field */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    disabled={isDisabled}
                    required
                    autoComplete="email"
                    className="h-11"
                    {...emailA11y.fieldProps}
                  />
                  {emailA11y.hasError && (
                    <p {...emailA11y.errorProps} className="text-sm text-destructive">
                      {emailA11y.error}
                    </p>
                  )}
                </div>

                {/* Password Field with visibility toggle */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      disabled={isDisabled}
                      required
                      autoComplete="current-password"
                      className="h-11 pr-10"
                      {...passwordA11y.fieldProps}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordA11y.hasError && (
                    <p {...passwordA11y.errorProps} className="text-sm text-destructive">
                      {passwordA11y.error}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="w-full h-11 text-base font-medium mt-1 transition-all hover:shadow-md hover:bg-secondary/70 active:scale-[0.98] active:shadow-sm"
                  disabled={isDisabled}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Sign up link - outside the card for visual balance */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/signup"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </a>
      </p>
    </div>
  )
}

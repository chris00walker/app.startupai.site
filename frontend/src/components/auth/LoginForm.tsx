"use client"

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
import { Brain, Loader2, Github, AlertCircle } from "lucide-react"
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to StartupAI</CardTitle>
          <CardDescription>
            Sign in to access your evidence-led strategy platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* GitHub OAuth - Primary */}
            <Button 
              onClick={handleGitHubSignIn}
              variant="default" 
              className="w-full" 
              disabled={isGitHubLoading || isLoading}
              aria-label="Sign in with GitHub"
            >
              {isGitHubLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form Error Alert */}
            {formError && (
              <div role="alert" aria-live="assertive">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Email/Password Form */}
            <form action={handleEmailSignIn}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoading || isGitHubLoading}
                    required
                    autoComplete="email"
                    {...emailA11y.fieldProps}
                  />
                  {emailA11y.hasError && (
                    <p {...emailA11y.errorProps} className="text-sm text-destructive">
                      {emailA11y.error}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    disabled={isLoading || isGitHubLoading}
                    required
                    autoComplete="current-password"
                    {...passwordA11y.fieldProps}
                  />
                  {passwordA11y.hasError && (
                    <p {...passwordA11y.errorProps} className="text-sm text-destructive">
                      {passwordA11y.error}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="secondary"
                  disabled={isLoading || isGitHubLoading}
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

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="underline underline-offset-4 hover:text-primary">
                Sign up
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

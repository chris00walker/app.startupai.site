"use client"

import * as React from "react"
import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    // Mock authentication - in production this would call your auth API
    console.log("Authenticating:", email)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo purposes, accept any email/password
    if (email && password) {
      // In production, you'd set auth tokens and redirect
      window.location.href = "/dashboard"
    } else {
      throw new Error("Please enter both email and password")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to home
              </Link>
            </Button>
          </div>
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex flex-col justify-center p-12 text-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">
              AI-Powered Strategy Consulting
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Transform your business strategy with multi-agent AI collaboration 
              and visual canvas generation.
            </p>
            <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto text-left">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="text-sm">Value Proposition Canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="text-sm">Business Model Canvas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="text-sm">Testing Business Ideas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full" />
                <span className="text-sm">Multi-Agent AI Orchestration</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Palette,
  Users,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle,
  Target,
  Layers,
  Sparkles
} from "lucide-react"

interface Client {
  _id: string;
  name: string;
  company: string;
  industry: string;
  status: string;
  riskLevel: string;
  description?: string;
  assignedConsultant?: string;
  workflowStatus?: {
    discovery: { status: string; completedAt?: string };
    validation: { status: string; completedAt?: string };
    scale: { status: string; completedAt?: string };
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    lastActivity: string;
  };
  createdAt: string;
}

function HomePage() {
  const features = [
    {
      icon: Target,
      title: "Value Proposition Canvas",
      description: "AI-powered customer segment analysis and value proposition mapping with visual generation.",
      badge: "Core Framework"
    },
    {
      icon: Layers,
      title: "Business Model Canvas",
      description: "Complete 9-block business model visualization with multi-agent collaboration.",
      badge: "Strategic Planning"
    },
    {
      icon: Zap,
      title: "Testing Business Ideas",
      description: "Hypothesis-driven validation framework with automated experiment design.",
      badge: "Validation"
    },
    {
      icon: Brain,
      title: "Multi-Agent AI",
      description: "Collaborative AI agents working together to generate professional consulting deliverables.",
      badge: "AI Innovation"
    }
  ]

  const stats = [
    { label: "Canvas Generated", value: "2,500+", icon: Palette },
    { label: "Success Rate", value: "94%", icon: CheckCircle },
    { label: "Avg. Generation Time", value: "<2s", icon: Zap },
    { label: "Client Satisfaction", value: "4.8/5", icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold">Strategyzer AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Strategy Consulting
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Transform Strategy with{" "}
            <span className="text-primary">Multi-Agent AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate professional business canvases, validate ideas, and accelerate
            strategic planning with collaborative AI agents following proven Strategyzer methodology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                <Brain className="h-4 w-4 mr-2" />
                Start AI Workflow
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Strategyzer Methodology + AI Innovation</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Proven business strategy frameworks enhanced with multi-agent AI collaboration
            for faster, more accurate strategic insights.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Strategy?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading consultants and strategists using AI to generate professional
              business canvases and accelerate client outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">
                  Get Started Today
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  <Palette className="h-4 w-4 mr-2" />
                  View Canvas Gallery
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Brain className="h-3 w-3" />
              </div>
              <span className="font-semibold">Strategyzer AI Platform</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Strategyzer AI. Powered by multi-agent collaboration.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage

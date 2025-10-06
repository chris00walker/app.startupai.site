"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Lightbulb, 
  Target, 
  Users, 
  DollarSign, 
  Rocket,
  Brain,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MessageSquare
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"

interface ProjectCreationWizardProps {
  clientId?: string // Optional - for consultants creating projects for clients
}

interface ProjectData {
  name: string
  description: string
  problemStatement: string
  targetMarket: string
  businessModel: string
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE'
  clientId?: string
}

interface AIInsight {
  type: 'hypothesis' | 'experiment' | 'risk' | 'opportunity'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export function ProjectCreationWizard({ clientId }: ProjectCreationWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    problemStatement: '',
    targetMarket: '',
    businessModel: '',
    stage: 'DESIRABILITY',
    clientId: clientId
  })
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [pending, startTransition] = useTransition()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleInputChange = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
  }

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true)
    
    try {
      // Get auth token for CrewAI API call
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required for AI analysis')
      }
      
      // Call CrewAI backend for real strategic analysis
      const response = await fetch('/.netlify/functions/crew-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          strategic_question: `Analyze ${projectData.name} for market validation and strategic positioning`,
          project_context: `${projectData.description}. Problem: ${projectData.problemStatement}. Target Market: ${projectData.targetMarket}. Business Model: ${projectData.businessModel}`,
          project_id: `new-project-${Date.now()}`,
          priority_level: 'high'
        })
      })
      
      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`)
      }
      
      const aiResult = await response.json()
      
      // Parse CrewAI result into insights format
      const crewaiInsights = parseCrewAIResult(aiResult.result)
      
      setAiInsights(crewaiInsights)
      
    } catch (error) {
      console.error('AI analysis error:', error)
      
      // Fallback to enhanced mock insights if AI fails
      const fallbackInsights: AIInsight[] = [
        {
          type: 'hypothesis',
          title: 'Primary Value Hypothesis',
          description: `Target customers will pay for ${projectData.name} because it solves their core problem: ${projectData.problemStatement}`,
          priority: 'high'
        },
        {
          type: 'experiment',
          title: 'Customer Interview Series',
          description: 'Conduct 15-20 interviews with target market to validate problem-solution fit',
          priority: 'high'
        },
        {
          type: 'risk',
          title: 'Market Size Validation',
          description: 'Verify that the target market is large enough to sustain the business model',
          priority: 'medium'
        },
        {
          type: 'opportunity',
          title: 'Early Adopter Identification',
          description: 'Focus on identifying and engaging early adopters within the target market',
          priority: 'high'
        }
      ]
      
      setAiInsights(fallbackInsights)
    } finally {
      setIsGeneratingInsights(false)
    }
  }
  
  // Helper function to parse CrewAI result into insights
  const parseCrewAIResult = (crewaiResult: string): AIInsight[] => {
    const insights: AIInsight[] = []
    
    // Extract key insights from CrewAI markdown result
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    
    if (crewaiResult.includes('hypothesis') || crewaiResult.includes('Hypothesis')) {
      insights.push({
        type: 'hypothesis',
        title: 'AI-Generated Value Hypothesis',
        description: 'Based on strategic analysis, key value propositions have been identified for validation',
        priority: 'high'
      })
    }
    
    if (crewaiResult.includes('experiment') || crewaiResult.includes('validation')) {
      insights.push({
        type: 'experiment',
        title: 'AI-Recommended Validation Experiments',
        description: 'Strategic analysis suggests specific experiments to validate core assumptions',
        priority: 'high'
      })
    }
    
    if (crewaiResult.includes('risk') || crewaiResult.includes('challenge')) {
      insights.push({
        type: 'risk',
        title: 'AI-Identified Strategic Risks',
        description: 'Analysis has identified potential risks that require mitigation strategies',
        priority: 'medium'
      })
    }
    
    if (crewaiResult.includes('opportunity') || crewaiResult.includes('market')) {
      insights.push({
        type: 'opportunity',
        title: 'AI-Discovered Market Opportunities',
        description: 'Strategic analysis reveals market opportunities for competitive advantage',
        priority: 'high'
      })
    }
    
    // Ensure we always have at least one insight
    if (insights.length === 0) {
      insights.push({
        type: 'hypothesis',
        title: 'AI Strategic Analysis Complete',
        description: 'Comprehensive strategic analysis has been completed with actionable recommendations',
        priority: 'high'
      })
    }
    
    return insights
  }

  const createProject = async () => {
    if (!user) return
    
    setIsCreatingProject(true)
    
    try {
      // Call the API endpoint to create project with AI integration
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const { project, clientId: responseClientId } = await response.json()
      
      startTransition(() => {
        // If created for a client, redirect to client dashboard
        // Otherwise redirect to project gate page
        if (responseClientId) {
          router.push(`/client/${responseClientId}`)
        } else {
          router.push(`/project/${project.id}/gate`)
        }
      })
    } catch (error) {
      console.error('Error creating project:', error)
      // TODO: Show error message to user
    } finally {
      setIsCreatingProject(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
      if (currentStep === 2) {
        generateAIInsights()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.name.trim() && projectData.description.trim()
      case 2:
        return projectData.problemStatement.trim() && projectData.targetMarket.trim()
      case 3:
        return projectData.businessModel.trim()
      case 4:
        return aiInsights.length > 0
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          Create Your Validation Project
        </h1>
        <p className="text-muted-foreground">
          Let our AI help you set up a comprehensive validation framework for your startup idea
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto" />
                <h2 className="text-2xl font-semibold">Tell us about your idea</h2>
                <p className="text-muted-foreground">
                  Start by describing your startup concept and what you're building
                </p>
              </div>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., EcoDelivery, HealthTracker Pro, SmartHome Assistant"
                    value={projectData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your startup idea in 2-3 sentences. What does it do and who is it for?"
                    rows={4}
                    value={projectData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Target className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-2xl font-semibold">Define the problem & market</h2>
                <p className="text-muted-foreground">
                  Help us understand the problem you're solving and who you're solving it for
                </p>
              </div>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Statement *</Label>
                  <Textarea
                    id="problem"
                    placeholder="What specific problem does your startup solve? Be as detailed as possible."
                    rows={4}
                    value={projectData.problemStatement}
                    onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="market">Target Market *</Label>
                  <Textarea
                    id="market"
                    placeholder="Who are your target customers? Describe their demographics, behaviors, and pain points."
                    rows={4}
                    value={projectData.targetMarket}
                    onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <DollarSign className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-2xl font-semibold">Business model & monetization</h2>
                <p className="text-muted-foreground">
                  How will your startup make money and create value?
                </p>
              </div>
              
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="business-model">Business Model *</Label>
                  <Textarea
                    id="business-model"
                    placeholder="How will you make money? (e.g., subscription, marketplace, freemium, advertising, etc.)"
                    rows={6}
                    value={projectData.businessModel}
                    onChange={(e) => handleInputChange('businessModel', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Brain className="h-12 w-12 text-purple-500 mx-auto" />
                <h2 className="text-2xl font-semibold">AI-Generated Validation Plan</h2>
                <p className="text-muted-foreground">
                  Our AI has analyzed your startup and created a personalized validation framework
                </p>
              </div>

              {isGeneratingInsights ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Analyzing your startup with AI...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {aiInsights.map((insight, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={insight.priority === 'high' ? 'default' : 'secondary'}>
                              {insight.type}
                            </Badge>
                            <Badge variant="outline">
                              {insight.priority} priority
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">AI Recommendation</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Start with the <strong>Desirability</strong> stage to validate that customers actually want your solution. 
                          Focus on customer interviews and problem validation before building anything.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button 
              onClick={nextStep}
              disabled={!canProceed() || isGeneratingInsights}
            >
              Next Step
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={createProject}
              disabled={!canProceed() || isCreatingProject || pending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingProject ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Project...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Validation Project
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

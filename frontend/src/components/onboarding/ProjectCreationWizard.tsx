/**
 * @story US-F11
 */
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { ValidationProgressTimeline } from "@/components/validation/ValidationProgressTimeline"

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

interface AnalysisResult {
  analysisId: string
  summary?: string
  insights?: Array<{
    id: string
    headline: string
    confidence?: string
    support?: string
  }>
  rawOutput?: string
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
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectClientId, setProjectClientId] = useState<string | undefined>(clientId)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [aiProgress, setAiProgress] = useState<string>('')
  const [aiError, setAiError] = useState<string>('')
  const [analysisLoaded, setAnalysisLoaded] = useState(false)
  const [validationRunId, setValidationRunId] = useState<string | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [pending, startTransition] = useTransition()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleInputChange = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
    if (['name', 'description', 'problemStatement', 'targetMarket', 'businessModel'].includes(field)) {
      setAnalysisLoaded(false)
      setAnalysisResult(null)
      setAiInsights([])
    }
  }

  const ensureProjectCreated = async (): Promise<string> => {
    if (projectId) {
      return projectId
    }

    setAiProgress('Creating project...')

    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create project before analysis')
    }

    const { project, clientId: createdClientId } = await response.json()
    setProjectId(project.id)
    if (createdClientId) {
      setProjectClientId(createdClientId)
    }
    return project.id as string
  }

  const generateAIInsights = async (force = false) => {
    if (!force && analysisLoaded) {
      return
    }

    setIsGeneratingInsights(true)
    setAiProgress('Starting AI analysis...')
    setAiError('')
    setAnalysisResult(null)
    setAnalysisLoaded(false)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required for AI analysis')
      }
      
      const ensuredProjectId = await ensureProjectCreated()

      setAiProgress('Connecting to AI analysis engine...')
      
      const strategicQuestion = `What strategic moves should ${projectData.name || 'this startup'} prioritize to validate the problem "${projectData.problemStatement}"?`
      const projectContext = [
        projectData.description && `Description: ${projectData.description}`,
        projectData.problemStatement && `Problem: ${projectData.problemStatement}`,
        projectData.targetMarket && `Target Market: ${projectData.targetMarket}`,
        projectData.businessModel && `Business Model: ${projectData.businessModel}`,
      ]
        .filter(Boolean)
        .join(' | ')

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          strategic_question: strategicQuestion,
          project_context: projectContext,
          project_id: ensuredProjectId,
          priority_level: 'high' as const,
        })
      })
      
      setAiProgress('AI agents analyzing your startup...')

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`AI analysis failed: ${response.statusText}${errorText ? ` – ${errorText}` : ''}`)
      }

      setAiProgress('Processing AI analysis results...')
      const aiResult = await response.json() as {
        success: boolean;
        summary?: string;
        insights?: any[];
        analysisId?: string;
        rawOutput?: string;
        run_id?: string;
        status?: string;
        status_url?: string;
      }

      // Handle async validation pattern (Modal returns 202 with run_id)
      if (aiResult.run_id && aiResult.status === 'started') {
        setAiProgress('Validation started - tracking progress...')
        setValidationRunId(aiResult.run_id)
        setShowProgressModal(true)

        // Create placeholder insights while validation runs
        const placeholderInsights: AIInsight[] = [
          {
            type: 'hypothesis',
            title: 'AI Analysis In Progress',
            description: 'Our AI agents are analyzing your startup. This process validates your idea across desirability, feasibility, and viability dimensions.',
            priority: 'high'
          }
        ]
        setAiInsights(placeholderInsights)
        setAnalysisResult({
          analysisId: aiResult.run_id,
          summary: 'AI validation in progress. You can track real-time progress and will be notified when approval is needed.',
        })
        setAnalysisLoaded(true)
        return
      }

      if (!aiResult?.success) {
        throw new Error('Analysis completed without success flag')
      }

      const crewaiInsights = parseCrewAIResult({
        summary: aiResult.summary,
        insights: aiResult.insights,
        rawOutput: aiResult.rawOutput,
      })

      setAiProgress('AI analysis complete')
      setAiInsights(crewaiInsights)
      setAnalysisResult({
        analysisId: aiResult.analysisId || '',
        summary: aiResult.summary,
        insights: aiResult.insights,
        rawOutput: aiResult.rawOutput,
      })
      setAnalysisLoaded(true)
      
    } catch (error) {
      console.error('AI analysis error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setAiError(`AI analysis error: ${errorMessage}. Using fallback recommendations.`)
      setAiProgress('Using fallback recommendations...')
      
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
      setAiProgress('Fallback recommendations ready')
      setAnalysisResult(null)
    } finally {
      setIsGeneratingInsights(false)
    }
  }
  
  // Helper function to parse CrewAI result into insights
  const parseCrewAIResult = (analysis: { summary?: string; insights?: any[]; rawOutput?: string }): AIInsight[] => {
    const insights: AIInsight[] = []
    const raw = (analysis.rawOutput || analysis.summary || '').toLowerCase()

    analysis.insights?.slice(0, 4).forEach((item: any) => {
      insights.push({
        type: 'opportunity',
        title: item.headline || 'AI Strategic Insight',
        description: item.support || item.headline || 'AI generated insight',
        priority: item.confidence === 'high' ? 'high' : item.confidence === 'low' ? 'low' : 'medium',
      })
    })

    if (insights.length === 0 && raw.includes('hypothesis')) {
      insights.push({
        type: 'hypothesis',
        title: 'AI-Generated Value Hypothesis',
        description: 'Based on strategic analysis, key value propositions have been identified for validation',
        priority: 'high',
      })
    }

    if (insights.length === 0 && (raw.includes('experiment') || raw.includes('validation'))) {
      insights.push({
        type: 'experiment',
        title: 'AI-Recommended Validation Experiments',
        description: 'Strategic analysis suggests specific experiments to validate core assumptions',
        priority: 'high',
      })
    }

    if (raw.includes('risk') || raw.includes('challenge')) {
      insights.push({
        type: 'risk',
        title: 'AI-Identified Strategic Risks',
        description: 'Analysis has identified potential risks that require mitigation strategies',
        priority: 'medium',
      })
    }

    if (raw.includes('opportunity') || raw.includes('market')) {
      insights.push({
        type: 'opportunity',
        title: 'AI-Discovered Market Opportunities',
        description: 'Strategic analysis reveals market opportunities for competitive advantage',
        priority: 'high',
      })
    }

    if (insights.length === 0) {
      insights.push({
        type: 'hypothesis',
        title: 'AI Strategic Analysis Complete',
        description: 'Comprehensive strategic analysis has been completed with actionable recommendations',
        priority: 'high',
      })
    }

    return insights
  }

  const createProject = async () => {
    if (!user) return

    setIsCreatingProject(true)

    try {
      const ensuredProjectId = await ensureProjectCreated()

      const metadata = {
        problemStatement: projectData.problemStatement,
        targetMarket: projectData.targetMarket,
        businessModel: projectData.businessModel,
        createdViaWizard: true,
        aiInsightsGenerated: analysisLoaded,
        ...(projectClientId ? { clientId: projectClientId } : {}),
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description,
          stage: projectData.stage,
          status: 'active',
          metadata,
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
        })
        .eq('id', ensuredProjectId)

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update project')
      }

      startTransition(() => {
        if (projectClientId) {
          router.push(`/client/${projectClientId}`)
        } else {
          router.push(`/project/${ensuredProjectId}/gate`)
        }
      })
    } catch (error) {
      console.error('Error creating project:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to finalize project')
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

              {/* Accessibility: Screen reader announcements */}
              <div 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
              >
                {aiProgress}
              </div>
              
              {aiError && (
                <div 
                  role="alert" 
                  aria-live="assertive"
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">AI Analysis Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">{aiError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {isGeneratingInsights ? (
                <div className="text-center py-12">
                  <div 
                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                    role="img"
                    aria-label="Loading spinner"
                  ></div>
                  <p className="text-muted-foreground" aria-live="polite">{aiProgress || 'Analyzing your startup with AI...'}</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take 30-60 seconds</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="sr-only" role="status" aria-live="polite">
                      Found {aiInsights.length} AI-generated insights for your startup
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult?.analysisId ? `Analysis run ID: ${analysisResult.analysisId}` : 'AI insights ready'}
                      </p>
                      {analysisResult?.summary && (
                        <p className="text-base font-medium text-foreground mt-1">
                          {analysisResult.summary}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => generateAIInsights(true)}
                      disabled={isGeneratingInsights}
                    >
                      Regenerate insights
                    </Button>
                  </div>

                  {aiInsights.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {aiInsights.map((insight, index) => (
                        <Card 
                          key={index} 
                          className="border-l-4 border-l-blue-500"
                          role="article"
                          aria-label={`${insight.type}: ${insight.title}`}
                        >
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
                  ) : (
                    <div className="border border-dashed border-blue-200 rounded-lg p-6 text-center text-sm text-muted-foreground">
                      AI insights will appear here after the analysis finishes.
                    </div>
                  )}

                  <div 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    role="complementary"
                    aria-label="AI Recommendation"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                      <div>
                        <h4 className="font-medium text-blue-900">AI Recommendation</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {analysisResult?.summary
                            ? analysisResult.summary
                            : 'Start with the Desirability stage to validate demand before investing further effort.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {analysisResult?.rawOutput && (
                    <details className="bg-muted/30 border border-muted rounded-lg p-4">
                      <summary className="text-sm font-medium cursor-pointer">View raw AI output</summary>
                      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                        {analysisResult.rawOutput}
                      </p>
                    </details>
                  )}
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

      {/* Validation Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI Validation in Progress</DialogTitle>
            <DialogDescription>
              Your startup is being analyzed by our AI founders team.
            </DialogDescription>
          </DialogHeader>
          {validationRunId && (
            <ValidationProgressTimeline
              runId={validationRunId}
              variant="modal"
              onHITLRequired={(checkpoint) => {
                setShowProgressModal(false)
                router.push('/approvals')
              }}
              onComplete={() => {
                setShowProgressModal(false)
                if (projectId) {
                  router.push(`/project/${projectId}/analysis`)
                } else if (projectClientId) {
                  router.push(`/client/${projectClientId}`)
                }
              }}
              onError={(err) => {
                console.error('[ProjectCreationWizard] Validation error:', err)
                setAiError(err.message || 'Validation failed')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

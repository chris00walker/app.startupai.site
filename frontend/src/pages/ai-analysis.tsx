"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain,
  Sparkles,
  FileText,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Download,
  Share
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/hooks"

interface AnalysisRequest {
  strategicQuestion: string
  projectContext: string
  targetSources: string
  priorityLevel: 'low' | 'medium' | 'high'
}

interface AgentStatus {
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  description: string
}

interface AnalysisResult {
  success: boolean
  result: string
  metadata: {
    project_id: string
    question: string
    user_id: string
    execution_time_seconds: number
  }
}

const AGENTS: AgentStatus[] = [
  { name: "Research Analyst", status: 'pending', progress: 0, description: "Gathering market intelligence and competitive data" },
  { name: "Strategy Consultant", status: 'pending', progress: 0, description: "Analyzing strategic positioning and opportunities" },
  { name: "Evidence Curator", status: 'pending', progress: 0, description: "Collecting and validating supporting evidence" },
  { name: "Risk Assessor", status: 'pending', progress: 0, description: "Identifying potential risks and mitigation strategies" },
  { name: "Market Validator", status: 'pending', progress: 0, description: "Validating market assumptions and hypotheses" },
  { name: "Report Generator", status: 'pending', progress: 0, description: "Synthesizing insights into strategic recommendations" }
]

export default function AIAnalysisPage() {
  const [analysisRequest, setAnalysisRequest] = useState<AnalysisRequest>({
    strategicQuestion: '',
    projectContext: '',
    targetSources: '',
    priorityLevel: 'medium'
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [agents, setAgents] = useState<AgentStatus[]>(AGENTS)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [currentStep, setCurrentStep] = useState<'input' | 'analyzing' | 'results'>('input')
  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleInputChange = (field: keyof AnalysisRequest, value: string) => {
    setAnalysisRequest(prev => ({ ...prev, [field]: value }))
  }

  const simulateAgentProgress = () => {
    let currentAgentIndex = 0
    const interval = setInterval(() => {
      setAgents(prev => {
        const updated = [...prev]
        
        // Complete previous agent
        if (currentAgentIndex > 0) {
          updated[currentAgentIndex - 1].status = 'completed'
          updated[currentAgentIndex - 1].progress = 100
        }
        
        // Start current agent
        if (currentAgentIndex < updated.length) {
          updated[currentAgentIndex].status = 'running'
          updated[currentAgentIndex].progress = 50
        }
        
        return updated
      })
      
      currentAgentIndex++
      
      // Complete all agents
      if (currentAgentIndex >= AGENTS.length) {
        setAgents(prev => {
          const final = [...prev]
          final[final.length - 1].status = 'completed'
          final[final.length - 1].progress = 100
          return final
        })
        clearInterval(interval)
      }
    }, 3000) // Each agent takes ~3 seconds
  }

  const startAnalysis = async () => {
    if (!user || !analysisRequest.strategicQuestion.trim()) return
    
    setIsAnalyzing(true)
    setCurrentStep('analyzing')
    
    // Reset agents
    setAgents(AGENTS.map(agent => ({ ...agent, status: 'pending', progress: 0 })))
    
    // Start agent progress simulation
    simulateAgentProgress()
    
    try {
      // Get auth token for CrewAI API call
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required for AI analysis')
      }
      
      // Call CrewAI backend for strategic analysis
      const response = await fetch('/.netlify/functions/crew-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          strategic_question: analysisRequest.strategicQuestion,
          project_context: analysisRequest.projectContext,
          project_id: `ai-analysis-${Date.now()}`,
          target_sources: analysisRequest.targetSources || 'General web sources',
          priority_level: analysisRequest.priorityLevel
        })
      })
      
      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      setAnalysisResult(result)
      setCurrentStep('results')
      
    } catch (error) {
      console.error('AI analysis error:', error)
      // Set error state for agents
      setAgents(prev => prev.map(agent => ({ 
        ...agent, 
        status: agent.status === 'running' ? 'error' : agent.status 
      })))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setCurrentStep('input')
    setAnalysisResult(null)
    setAgents(AGENTS.map(agent => ({ ...agent, status: 'pending', progress: 0 })))
    setIsAnalyzing(false)
  }

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/founder-dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Strategic Analysis
              </h1>
              <p className="text-muted-foreground">
                Get comprehensive strategic insights powered by our 6-agent AI system
              </p>
            </div>
          </div>
          
          {currentStep === 'results' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share Analysis
              </Button>
            </div>
          )}
        </div>

        {/* Input Form */}
        {currentStep === 'input' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Strategic Analysis Request
              </CardTitle>
              <CardDescription>
                Provide details about your strategic question to get comprehensive AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">Strategic Question *</Label>
                <Textarea
                  id="question"
                  placeholder="e.g., What is our competitive positioning in the AI-powered startup validation market?"
                  value={analysisRequest.strategicQuestion}
                  onChange={(e) => handleInputChange('strategicQuestion', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="context">Project Context</Label>
                <Textarea
                  id="context"
                  placeholder="Provide background about your project, industry, target market, etc."
                  value={analysisRequest.projectContext}
                  onChange={(e) => handleInputChange('projectContext', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sources">Target Sources (Optional)</Label>
                  <Input
                    id="sources"
                    placeholder="e.g., G2, Gartner, industry reports"
                    value={analysisRequest.targetSources}
                    onChange={(e) => handleInputChange('targetSources', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <select
                    id="priority"
                    value={analysisRequest.priorityLevel}
                    onChange={(e) => handleInputChange('priorityLevel', e.target.value as any)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={startAnalysis}
                disabled={!analysisRequest.strategicQuestion.trim() || isAnalyzing}
                className="w-full"
                size="lg"
              >
                <Brain className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agent Progress */}
        {currentStep === 'analyzing' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 animate-pulse" />
                AI Analysis in Progress
              </CardTitle>
              <CardDescription>
                Our 6-agent system is analyzing your strategic question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agents.map((agent, index) => (
                <div key={agent.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(agent.status)}
                      <span className="font-medium">{agent.name}</span>
                      <Badge variant={
                        agent.status === 'completed' ? 'default' :
                        agent.status === 'running' ? 'secondary' :
                        agent.status === 'error' ? 'destructive' : 'outline'
                      }>
                        {agent.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {agent.progress}%
                    </span>
                  </div>
                  <Progress value={agent.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {currentStep === 'results' && analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Strategic Analysis Complete
              </CardTitle>
              <CardDescription>
                Analysis completed in {analysisResult.metadata.execution_time_seconds}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="insights" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="insights">Key Insights</TabsTrigger>
                  <TabsTrigger value="report">Full Report</TabsTrigger>
                  <TabsTrigger value="metadata">Analysis Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="insights" className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                      <h4 className="text-blue-800 font-semibold mb-2">AI-Generated Strategic Insights</h4>
                      <p className="text-blue-700 text-sm">
                        Based on comprehensive analysis by our 6-agent system including market research, 
                        competitive intelligence, and strategic frameworks.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="report" className="space-y-4">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
                      {analysisResult.result}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Analysis ID</Label>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {analysisResult.metadata.project_id}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Execution Time</Label>
                      <p className="text-sm">
                        {analysisResult.metadata.execution_time_seconds} seconds
                      </p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Strategic Question</Label>
                      <p className="text-sm bg-gray-100 p-2 rounded">
                        {analysisResult.metadata.question}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex gap-2 mt-6">
                <Button onClick={resetAnalysis} variant="outline">
                  New Analysis
                </Button>
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Save to Project
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

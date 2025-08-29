import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import {
  demoClient,
  demoValuePropositionCanvas,
  demoBusinessModelCanvas,
  demoTestingBusinessIdeas,
  demoMetrics,
  demoActiveWorkflows,
  demoRecentActivity
} from '@/data/demoData'

interface CanvasItem {
  id: string
  title: string
  type: "vpc" | "bmc" | "tbi"
  client: string
  status: "completed" | "in-progress" | "draft"
  lastModified: string
  aiGenerated: boolean
  completionRate: number
}

export interface DemoState {
  isDemo: boolean
  currentStep: number
  showGuidedTour: boolean
  client: typeof demoClient
  canvases: CanvasItem[]
  metrics: typeof demoMetrics
  activeWorkflows: typeof demoActiveWorkflows
  recentActivity: typeof demoRecentActivity
}

export const useDemoMode = () => {
  const router = useRouter()
  
  // Transform demo canvas data to match CanvasGallery expected format
  const transformedCanvases = [
    {
      id: demoValuePropositionCanvas.id,
      title: demoValuePropositionCanvas.title,
      type: demoValuePropositionCanvas.type,
      client: "TechStart Inc.",
      status: demoValuePropositionCanvas.status,
      lastModified: "2 hours ago",
      aiGenerated: true,
      completionRate: 95,
    },
    {
      id: demoBusinessModelCanvas.id,
      title: demoBusinessModelCanvas.title,
      type: demoBusinessModelCanvas.type,
      client: "TechStart Inc.",
      status: demoBusinessModelCanvas.status,
      lastModified: "3 hours ago",
      aiGenerated: true,
      completionRate: 92,
    },
    {
      id: demoTestingBusinessIdeas.id,
      title: demoTestingBusinessIdeas.title,
      type: demoTestingBusinessIdeas.type,
      client: "TechStart Inc.",
      status: demoTestingBusinessIdeas.status,
      lastModified: "1 day ago",
      aiGenerated: true,
      completionRate: 88,
    }
  ]

  const [demoState, setDemoState] = useState<DemoState>({
    isDemo: false,
    currentStep: 0,
    showGuidedTour: false,
    client: demoClient,
    canvases: transformedCanvases,
    metrics: demoMetrics,
    activeWorkflows: demoActiveWorkflows,
    recentActivity: demoRecentActivity
  })

  useEffect(() => {
    // Check if we're in demo mode based on URL parameter
    const isDemoMode = router.query.demo === 'true'
    setDemoState(prev => ({
      ...prev,
      isDemo: isDemoMode,
      showGuidedTour: isDemoMode && prev.currentStep === 0
    }))
  }, [router.query.demo])

  const startDemo = () => {
    router.push('/dashboard?demo=true')
  }

  const exitDemo = () => {
    router.push('/dashboard')
  }

  const nextStep = () => {
    setDemoState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }))
  }

  const prevStep = () => {
    setDemoState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }))
  }

  const skipTour = () => {
    setDemoState(prev => ({
      ...prev,
      showGuidedTour: false
    }))
  }

  const restartTour = () => {
    setDemoState(prev => ({
      ...prev,
      currentStep: 0,
      showGuidedTour: true
    }))
  }

  return {
    ...demoState,
    startDemo,
    exitDemo,
    nextStep,
    prevStep,
    skipTour,
    restartTour
  }
}

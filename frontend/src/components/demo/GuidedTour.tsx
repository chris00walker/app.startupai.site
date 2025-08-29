"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ArrowRight, ArrowLeft, Play, Eye, Sparkles } from "lucide-react"

interface TourStep {
  id: string
  title: string
  description: string
  target?: string
  position: "top" | "bottom" | "left" | "right"
  action?: string
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Strategyzer AI Demo",
    description: "You're now viewing TechStart Inc.'s live business strategy dashboard. Notice the demo banner above - you're experiencing real AI-powered strategic planning in action.",
    target: "[data-tour='demo-banner']",
    position: "bottom"
  },
  {
    id: "metrics",
    title: "Real-time Performance Metrics",
    description: "Monitor key performance indicators including client success rates, canvas generation speed, and cost efficiency.",
    target: "[data-tour='metrics']",
    position: "bottom"
  },
  {
    id: "workflows",
    title: "Active AI Workflows",
    description: "See multi-agent AI collaboration in action. Our agents work together to validate business hypotheses and generate strategic insights.",
    target: "[data-tour='workflows']",
    position: "right"
  },
  {
    id: "canvas-gallery",
    title: "Strategic Canvas Gallery",
    description: "Explore completed Value Proposition Canvas, Business Model Canvas, and Testing Business Ideas frameworks for TechStart Inc.",
    target: "[data-tour='canvas-gallery']",
    position: "top"
  },
  {
    id: "vpc",
    title: "Value Proposition Canvas",
    description: "AI-generated customer insights and value propositions based on market research and competitive analysis.",
    action: "View detailed Value Proposition Canvas with customer jobs, pains, gains, and corresponding value propositions.",
    position: "right"
  },
  {
    id: "bmc",
    title: "Business Model Canvas",
    description: "Complete 9-block business model with revenue streams, cost structure, and key partnerships identified by AI analysis.",
    action: "Explore the comprehensive business model including market opportunities and operational requirements.",
    position: "right"
  },
  {
    id: "tbi",
    title: "Testing Business Ideas",
    description: "Hypothesis-driven validation with real experiments, results, and risk assessments to de-risk the business model.",
    action: "Review validation experiments and see how hypotheses are tested with measurable success criteria.",
    position: "right"
  },
  {
    id: "complete",
    title: "Demo Complete!",
    description: "You've experienced the full Strategyzer AI platform. Ready to transform your own strategic planning process?",
    position: "bottom"
  }
]

interface GuidedTourProps {
  currentStep: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
  isVisible: boolean
}

export function GuidedTour({ 
  currentStep, 
  onNext, 
  onPrev, 
  onSkip, 
  onComplete,
  isVisible 
}: GuidedTourProps) {
  if (!isVisible || currentStep >= tourSteps.length) return null

  const step = tourSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tourSteps.length - 1

  // Get the target element for positioning
  const targetElement = step.target ? document.querySelector(step.target) : null
  const targetRect = targetElement?.getBoundingClientRect()

  // Calculate tooltip position based on step.position and target element
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    
    const padding = 20
    const tooltipWidth = 320 // w-80 = 320px
    const tooltipHeight = 300 // estimated height
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let position = step.position
    let top = 0
    let left = 0
    let transform = ''
    
    // Calculate initial position
    switch (position) {
      case 'top':
        top = targetRect.top - padding - tooltipHeight
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, 0)'
        break
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + targetRect.width / 2
        transform = 'translate(-50%, 0)'
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.left - padding - tooltipWidth
        transform = 'translate(0, -50%)'
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2
        left = targetRect.right + padding
        transform = 'translate(0, -50%)'
        break
      default:
        top = viewportHeight / 2
        left = viewportWidth / 2
        transform = 'translate(-50%, -50%)'
    }
    
    // Check for collision with target element
    const checkCollision = (tooltipTop: number, tooltipLeft: number) => {
      const tooltipRight = tooltipLeft + tooltipWidth
      const tooltipBottom = tooltipTop + tooltipHeight
      
      return !(
        tooltipRight < targetRect.left ||
        tooltipLeft > targetRect.right ||
        tooltipBottom < targetRect.top ||
        tooltipTop > targetRect.bottom
      )
    }
    
    // Viewport boundary checks and collision avoidance
    if (top < padding) {
      // Too high, move below target
      top = targetRect.bottom + padding
      transform = transform.includes('-50%') ? 'translate(-50%, 0)' : 'translate(0, 0)'
    }
    
    if (top + tooltipHeight > viewportHeight - padding) {
      // Too low, move above target
      top = targetRect.top - padding - tooltipHeight
      transform = transform.includes('-50%') ? 'translate(-50%, 0)' : 'translate(0, 0)'
    }
    
    // Check if tooltip would overlap target element and reposition
    if (checkCollision(top, left)) {
      // Try positioning to the right of target
      const rightPosition = targetRect.right + padding
      if (rightPosition + tooltipWidth <= viewportWidth - padding) {
        left = rightPosition
        top = targetRect.top + targetRect.height / 2
        transform = 'translate(0, -50%)'
      } else {
        // Try positioning to the left of target
        const leftPosition = targetRect.left - padding - tooltipWidth
        if (leftPosition >= padding) {
          left = leftPosition
          top = targetRect.top + targetRect.height / 2
          transform = 'translate(0, -50%)'
        } else {
          // Position above target with enough clearance
          top = targetRect.top - padding - tooltipHeight
          left = Math.max(padding, Math.min(targetRect.left, viewportWidth - tooltipWidth - padding))
          transform = 'translate(0, 0)'
        }
      }
    }
    
    if (left < padding) {
      // Too far left
      left = padding
      transform = 'translate(0, -50%)'
    }
    
    if (left + tooltipWidth > viewportWidth - padding) {
      // Too far right
      left = viewportWidth - tooltipWidth - padding
      transform = 'translate(0, -50%)'
    }
    
    // Final collision check and emergency positioning
    if (checkCollision(top, left)) {
      // Emergency positioning: place in top-right corner of viewport
      top = padding
      left = viewportWidth - tooltipWidth - padding
      transform = 'translate(0, 0)'
    }
    
    // Ensure we don't go off screen even after adjustments
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    
    return {
      top: `${top}px`,
      left: `${left}px`,
      transform
    }
  }

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" />
      
      {/* Spotlight highlight for target element */}
      {targetElement && targetRect && (
        <div 
          className="fixed z-45 border-2 border-primary rounded-lg shadow-lg shadow-primary/20"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Positioned tooltip */}
      <div 
        className="fixed z-50 w-80 max-w-sm"
        style={getTooltipPosition()}
      >
        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="mb-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Interactive Demo
              </Badge>
              <Button variant="ghost" size="sm" onClick={onSkip}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Step {currentStep + 1} of {tourSteps.length}
              <div className="flex-1 bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{step.description}</p>
            {step.action && (
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium">{step.action}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onPrev}
                disabled={isFirstStep}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                {!isLastStep ? (
                  <Button size="sm" onClick={onNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={onComplete}>
                    <Eye className="h-4 w-4 mr-1" />
                    Start Exploring
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Demo Banner Component
interface DemoBannerProps {
  onExitDemo: () => void
  onRestartTour: () => void
}

export function DemoBanner({ onExitDemo, onRestartTour }: DemoBannerProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20" data-tour="demo-banner">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Demo Mode
            </Badge>
            <span className="text-sm font-medium">
              Exploring TechStart Inc. - AI Fitness App Strategy
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRestartTour}>
              <Play className="h-4 w-4 mr-1" />
              Restart Tour
            </Button>
            <Button variant="outline" size="sm" onClick={onExitDemo}>
              <X className="h-4 w-4 mr-1" />
              Exit Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

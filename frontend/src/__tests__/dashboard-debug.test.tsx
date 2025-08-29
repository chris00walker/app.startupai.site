import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/dashboard',
    query: {},
    asPath: '/dashboard',
  }),
}))

// Test each import individually to identify the problematic component
describe('Dashboard Component Import Tests', () => {
  
  test('should import React without issues', () => {
    const React = require('react')
    expect(React).toBeDefined()
  })

  test('should import DashboardLayout component', async () => {
    try {
      const { DashboardLayout } = await import('@/components/layout/DashboardLayout')
      expect(DashboardLayout).toBeDefined()
      expect(typeof DashboardLayout).toBe('function')
    } catch (error) {
      console.error('DashboardLayout import failed:', error)
      throw error
    }
  })

  test('should import MetricsCards component', async () => {
    try {
      const { MetricsCards } = await import('@/components/dashboard/MetricsCards')
      expect(MetricsCards).toBeDefined()
      expect(typeof MetricsCards).toBe('function')
    } catch (error) {
      console.error('MetricsCards import failed:', error)
      throw error
    }
  })

  test('should import CanvasGallery component', async () => {
    try {
      const { CanvasGallery } = await import('@/components/canvas/CanvasGallery')
      expect(CanvasGallery).toBeDefined()
      expect(typeof CanvasGallery).toBe('function')
    } catch (error) {
      console.error('CanvasGallery import failed:', error)
      throw error
    }
  })

  test('should import all UI components', async () => {
    try {
      const { Card, CardContent, CardDescription, CardHeader, CardTitle } = await import('@/components/ui/card')
      expect(Card).toBeDefined()
      expect(CardContent).toBeDefined()
      expect(CardDescription).toBeDefined()
      expect(CardHeader).toBeDefined()
      expect(CardTitle).toBeDefined()
    } catch (error) {
      console.error('Card components import failed:', error)
      throw error
    }

    try {
      const { Button } = await import('@/components/ui/button')
      expect(Button).toBeDefined()
    } catch (error) {
      console.error('Button import failed:', error)
      throw error
    }

    try {
      const { Badge } = await import('@/components/ui/badge')
      expect(Badge).toBeDefined()
    } catch (error) {
      console.error('Badge import failed:', error)
      throw error
    }

    try {
      const { Progress } = await import('@/components/ui/progress')
      expect(Progress).toBeDefined()
    } catch (error) {
      console.error('Progress import failed:', error)
      throw error
    }
  })

  test('should import all lucide-react icons', async () => {
    try {
      const { 
        Brain, 
        Palette, 
        Clock, 
        Play, 
        Pause, 
        CheckCircle,
        AlertCircle,
        Users,
        TrendingUp
      } = await import('lucide-react')
      
      expect(Brain).toBeDefined()
      expect(Palette).toBeDefined()
      expect(Clock).toBeDefined()
      expect(Play).toBeDefined()
      expect(Pause).toBeDefined()
      expect(CheckCircle).toBeDefined()
      expect(AlertCircle).toBeDefined()
      expect(Users).toBeDefined()
      expect(TrendingUp).toBeDefined()
    } catch (error) {
      console.error('Lucide icons import failed:', error)
      throw error
    }
  })

  test('should render MetricsCards component', () => {
    const MetricsCards = require('@/components/dashboard/MetricsCards').MetricsCards
    expect(() => render(<MetricsCards />)).not.toThrow()
  })

  test('should render DashboardLayout with children', () => {
    const DashboardLayout = require('@/components/layout/DashboardLayout').DashboardLayout
    expect(() => render(
      <DashboardLayout>
        <div>Test content</div>
      </DashboardLayout>
    )).not.toThrow()
  })

  test('should render CanvasGallery component', () => {
    const CanvasGallery = require('@/components/canvas/CanvasGallery').CanvasGallery
    expect(() => render(<CanvasGallery />)).not.toThrow()
  })

  test('should render complete Dashboard page', async () => {
    try {
      const Dashboard = await import('@/pages/dashboard')
      const DashboardComponent = Dashboard.default
      expect(DashboardComponent).toBeDefined()
      expect(() => render(<DashboardComponent />)).not.toThrow()
    } catch (error) {
      console.error('Dashboard page render failed:', error)
      throw error
    }
  })
})

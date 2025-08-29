/**
 * Canvas Components TDD Validation Suite
 * 
 * Simplified test suite to validate our Test-Driven Development implementation
 * for ShadCN-based canvas components following the MCP server patterns
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock API service with proper data structures
jest.mock('@/services/api', () => ({
  canvas: {
    getById: jest.fn().mockImplementation((canvasId) => {
      // Return different data structures based on canvas type
      const baseMetadata = {
        id: canvasId,
        name: 'Test Canvas',
        status: 'draft',
        lastModified: new Date().toISOString(),
        collaborators: [],
        version: 1,
        aiGenerated: false
      }

      if (canvasId.includes('vpc')) {
        return Promise.resolve({
          canvas: {
            id: canvasId,
            type: 'value-proposition',
            data: {
              valuePropositionTitle: 'Test Value Proposition',
              customerSegmentTitle: 'Test Customer Segment',
              valueMap: {
                productsServices: [],
                painRelievers: [],
                gainCreators: []
              },
              customerProfile: {
                customerJobs: [],
                pains: [],
                gains: []
              }
            }
          },
          metadata: { ...baseMetadata, type: 'value-proposition' }
        })
      } else if (canvasId.includes('bmc')) {
        return Promise.resolve({
          canvas: {
            id: canvasId,
            type: 'business-model',
            data: {
              keyPartners: [],
              keyActivities: [],
              keyResources: [],
              valuePropositions: [],
              customerRelationships: [],
              channels: [],
              customerSegments: [],
              costStructure: [],
              revenueStreams: []
            }
          },
          metadata: { ...baseMetadata, type: 'business-model' }
        })
      } else if (canvasId.includes('tbi')) {
        return Promise.resolve({
          canvas: {
            id: canvasId,
            type: 'testing-business-ideas',
            data: {
              assumptions: [],
              testCards: [],
              learningCards: [],
              experiments: []
            }
          },
          metadata: { ...baseMetadata, type: 'testing-business-ideas' }
        })
      }

      // Default fallback
      return Promise.resolve({
        canvas: {
          id: canvasId,
          type: 'value-proposition',
          data: {}
        },
        metadata: baseMetadata
      })
    }),
    create: jest.fn().mockResolvedValue({ id: 'new-canvas' }),
    update: jest.fn().mockResolvedValue({ success: true })
  }
}))

// Import our canvas components
import TestingBusinessIdeasCanvas from '../components/canvas/TestingBusinessIdeasCanvas'
import ValuePropositionCanvas from '../components/canvas/ValuePropositionCanvas'
import BusinessModelCanvas from '../components/canvas/BusinessModelCanvas'
import CanvasEditor from '../components/canvas/CanvasEditor'
import { CanvasGallery } from '../components/canvas/CanvasGallery'

// Mock data for testing
const mockCanvasData = {
  vpc: {
    valuePropositionTitle: "Test Value Proposition",
    customerSegmentTitle: "Test Customer Segment",
    customerProfile: {
      jobs: ['Job 1', 'Job 2'],
      pains: ['Pain 1', 'Pain 2'],
      gains: ['Gain 1', 'Gain 2']
    },
    valueMap: {
      productsAndServices: ['Product 1', 'Product 2'],
      painRelievers: ['Reliever 1', 'Reliever 2'],
      gainCreators: ['Creator 1', 'Creator 2']
    }
  }
}

describe('Canvas Components TDD Validation', () => {
  
  describe('Testing Business Ideas Canvas', () => {
    it('renders successfully with ShadCN components', () => {
      render(
        <TestingBusinessIdeasCanvas
          canvasId="test-tbi"
          clientId="test-client"
          readOnly={false}
        />
      )
      
      // Verify core ShadCN components are rendered
      expect(screen.getByText('Testing Business Ideas')).toBeInTheDocument()
      
      // Verify tabs are present (core TBI functionality)
      expect(screen.getByText('Assumption Map')).toBeInTheDocument()
      expect(screen.getByText('Test Cards')).toBeInTheDocument()
      expect(screen.getByText('Learning Cards')).toBeInTheDocument()
      expect(screen.getByText('Experiments')).toBeInTheDocument()
    })

    it('supports read-only mode', () => {
      render(
        <TestingBusinessIdeasCanvas
          canvasId="test-tbi"
          clientId="test-client"
          readOnly={true}
        />
      )
      
      expect(screen.getByText('Testing Business Ideas')).toBeInTheDocument()
    })
  })

  describe('Value Proposition Canvas', () => {
    it('renders successfully with ShadCN components', () => {
      render(
        <ValuePropositionCanvas
          canvasId="test-vpc"
          clientId="test-client"
          initialData={mockCanvasData.vpc}
          readOnly={false}
        />
      )
      
      // Verify core VPC sections
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
      expect(screen.getByText('Value Map')).toBeInTheDocument()
    })

    it('supports read-only mode', () => {
      render(
        <ValuePropositionCanvas
          canvasId="test-vpc"
          clientId="test-client"
          initialData={mockCanvasData.vpc}
          readOnly={true}
        />
      )
      
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
    })
  })

  describe('Business Model Canvas', () => {
    it('renders successfully with ShadCN components', () => {
      render(
        <BusinessModelCanvas
          canvasId="test-bmc"
          clientId="test-client"
          readOnly={false}
        />
      )
      
      // Verify core BMC sections
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      expect(screen.getByText('Key Partners')).toBeInTheDocument()
      expect(screen.getByText('Value Propositions')).toBeInTheDocument()
      expect(screen.getByText('Customer Segments')).toBeInTheDocument()
    })

    it('supports read-only mode', () => {
      render(
        <BusinessModelCanvas
          canvasId="test-bmc"
          clientId="test-client"
          readOnly={true}
        />
      )
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
    })
  })

  describe('Canvas Editor Integration', () => {
    it('renders VPC canvas type', async () => {
      render(
        <CanvasEditor
          canvasType="value-proposition"
          canvasId="test-vpc"
          clientId="test-client"
          mode="edit"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      })
    })

    it('renders BMC canvas type', async () => {
      render(
        <CanvasEditor
          canvasType="business-model"
          canvasId="test-bmc"
          clientId="test-client"
          mode="edit"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      })
    })

    it('renders TBI canvas type', async () => {
      render(
        <CanvasEditor
          canvasType="testing-business-ideas"
          canvasId="test-tbi"
          clientId="test-client"
          mode="edit"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Testing Business Ideas')).toBeInTheDocument()
      })
    })

    it('supports view mode', async () => {
      render(
        <CanvasEditor
          canvasType="value-proposition"
          canvasId="test-vpc"
          clientId="test-client"
          mode="view"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      })
    })
  })

  describe('Canvas Gallery Integration', () => {
    it('renders successfully with ShadCN components', () => {
      render(<CanvasGallery />)
      
      // Verify core gallery elements
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
      expect(screen.getByText('AI-generated strategic canvases for your clients')).toBeInTheDocument()
      expect(screen.getByText('Generate Canvas')).toBeInTheDocument()
      
      // Verify filter tabs
      expect(screen.getByText('All Canvases')).toBeInTheDocument()
      expect(screen.getByText('Value Proposition')).toBeInTheDocument()
      expect(screen.getByText('Business Model')).toBeInTheDocument()
    })

    it('displays mock canvas data', () => {
      render(<CanvasGallery />)
      
      // Should show some mock canvases
      expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(screen.getByText('SaaS Business Model')).toBeInTheDocument()
    })
  })

  describe('ShadCN Component Integration', () => {
    it('uses proper ShadCN Card components', () => {
      render(<CanvasGallery />)
      
      // Verify ShadCN Card structure is present
      const cards = document.querySelectorAll('[class*="card"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('uses proper ShadCN Tab components', () => {
      render(
        <TestingBusinessIdeasCanvas
          canvasId="test-tbi"
          clientId="test-client"
          readOnly={false}
        />
      )
      
      // Verify ShadCN Tabs structure
      const tabs = document.querySelectorAll('[role="tab"]')
      expect(tabs.length).toBeGreaterThan(0)
    })

    it('uses proper ShadCN Button components', () => {
      render(<CanvasGallery />)
      
      // Verify buttons are rendered
      const generateButton = screen.getByText('Generate Canvas')
      expect(generateButton).toBeInTheDocument()
      expect(generateButton.tagName).toBe('BUTTON')
    })
  })
})

describe('TDD Implementation Validation', () => {
  it('validates all canvas components exist and render', () => {
    // Test that all three main canvas components can be imported and rendered
    expect(() => {
      render(<TestingBusinessIdeasCanvas canvasId="test" clientId="test" />)
    }).not.toThrow()

    expect(() => {
      render(<ValuePropositionCanvas canvasId="test" clientId="test" />)
    }).not.toThrow()

    expect(() => {
      render(<BusinessModelCanvas canvasId="test" clientId="test" />)
    }).not.toThrow()
  })

  it('validates integration components exist and render', () => {
    // Test that integration components work
    expect(() => {
      render(<CanvasEditor canvasType="value-proposition" canvasId="test" clientId="test" mode="edit" />)
    }).not.toThrow()

    expect(() => {
      render(<CanvasGallery />)
    }).not.toThrow()
  })

  it('validates ShadCN UI integration', () => {
    // Render a component and verify ShadCN classes are present
    render(<CanvasGallery />)
    
    // Look for common ShadCN class patterns
    const elementsWithShadcnClasses = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="border-"]')
    expect(elementsWithShadcnClasses.length).toBeGreaterThan(0)
  })
})

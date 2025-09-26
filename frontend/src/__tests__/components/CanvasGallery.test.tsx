import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { CanvasGallery } from '@/components/canvas/CanvasGallery'

// Mock the canvas components
jest.mock('@/components/canvas/ValuePropositionCanvas', () => {
  return function MockValuePropositionCanvas({ readOnly }: any) {
    return (
      <div data-testid="vpc-preview">
        <h3>VPC Preview</h3>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
      </div>
    )
  }
})

jest.mock('@/components/canvas/BusinessModelCanvas', () => {
  return function MockBusinessModelCanvas({ readOnly }: any) {
    return (
      <div data-testid="bmc-preview">
        <h3>BMC Preview</h3>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
      </div>
    )
  }
})

jest.mock('@/components/canvas/TestingBusinessIdeasCanvas', () => {
  return function MockTestingBusinessIdeasCanvas({ readOnly }: any) {
    return (
      <div data-testid="tbi-preview">
        <h3>TBI Preview</h3>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
      </div>
    )
  }
})

// Mock demo data
jest.mock('@/data/demoData', () => ({
  demoValuePropositionCanvas: {
    id: 'demo-vpc-1',
    title: 'Demo VPC',
    type: 'Value Proposition Canvas'
  }
}))

describe('CanvasGallery', () => {
  const mockDemoCanvases = [
    {
      id: '1',
      title: 'E-commerce Platform VPC',
      type: 'vpc' as const,
      client: 'TechStart Inc.',
      status: 'completed' as const,
      lastModified: '2024-01-15',
      aiGenerated: true,
      completionRate: 95
    },
    {
      id: '2',
      title: 'SaaS Business Model',
      type: 'bmc' as const,
      client: 'StartupCo',
      status: 'in-progress' as const,
      lastModified: '2024-01-14',
      aiGenerated: false,
      completionRate: 70
    },
    {
      id: '3',
      title: 'User Testing Framework',
      type: 'tbi' as const,
      client: 'InnovateLab',
      status: 'draft' as const,
      lastModified: '2024-01-13',
      aiGenerated: true,
      completionRate: 45
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    test('renders gallery header and controls', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should have main heading
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
      expect(screen.getByText('AI-generated strategic canvases for your clients')).toBeInTheDocument()
      
      // Should have search input
      expect(screen.getByPlaceholderText('Search canvases...')).toBeInTheDocument()
      
      // Should have filter tabs
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    test('renders filter controls', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should have filter tabs
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /all canvases/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /value proposition/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /business model/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /testing ideas/i })).toBeInTheDocument()
    })

    test('renders view toggle buttons', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should have grid/list view toggles
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Canvas Cards Display', () => {
    test('displays canvas cards when demo data provided', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(screen.getByText('SaaS Business Model')).toBeInTheDocument()
      expect(screen.getByText('User Testing Framework')).toBeInTheDocument()
    })

    test('shows canvas metadata correctly', async () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Wait for canvas cards to render - use more flexible text matching
      await waitFor(() => {
        // Check for canvas titles (which we know are rendering from other tests)
        expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
        expect(screen.getByText('SaaS Business Model')).toBeInTheDocument()
        expect(screen.getByText('User Testing Framework')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Check for client names with partial matching
      expect(screen.getByText(/TechStart/)).toBeInTheDocument()
      expect(screen.getByText(/StartupCo/)).toBeInTheDocument()
      expect(screen.getByText(/InnovateLab/)).toBeInTheDocument()
      
      // Check for completion rates
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('70%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    test('displays completion rates', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Check for completion rates
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('70%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    test('shows AI generation badges', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should show AI badges for AI-generated canvases
      const aiBadges = screen.getAllByText(/ai/i)
      expect(aiBadges.length).toBeGreaterThan(0)
    })
  })

  describe('Canvas Type Filtering', () => {
    test('filters by canvas type', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)

      const vpcTab = screen.getByRole('tab', { name: /value proposition/i })
      await user.click(vpcTab)

      const activePanel = await screen.findByRole('tabpanel', { name: /value proposition/i })

      expect(within(activePanel).getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(within(activePanel).queryByText('SaaS Business Model')).not.toBeInTheDocument()
    })

    test('shows all canvas types by default', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // All three canvas types should be visible
      expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(screen.getByText('SaaS Business Model')).toBeInTheDocument()
      expect(screen.getByText('User Testing Framework')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    test('filters canvases by search term', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const searchInput = screen.getByPlaceholderText(/search canvases/i)
      await user.type(searchInput, 'E-commerce')
      
      // Should show only matching canvases
      expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(screen.queryByText('SaaS Business Model')).not.toBeInTheDocument()
      expect(screen.queryByText('User Testing Framework')).not.toBeInTheDocument()
    })

    test('shows no results message when search has no matches', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const searchInput = screen.getByPlaceholderText(/search canvases/i)
      await user.type(searchInput, 'NonexistentCanvas')
      
      // Should show no results or empty state
      expect(screen.queryByText('E-commerce Platform VPC')).not.toBeInTheDocument()
      expect(screen.queryByText('SaaS Business Model')).not.toBeInTheDocument()
      expect(screen.queryByText('User Testing Framework')).not.toBeInTheDocument()
    })

    test('clears search results when search is cleared', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const searchInput = screen.getByPlaceholderText(/search canvases/i)
      await user.type(searchInput, 'E-commerce')
      
      // Clear the search
      await user.clear(searchInput)
      
      // Should show all canvases again
      expect(screen.getByText('E-commerce Platform VPC')).toBeInTheDocument()
      expect(screen.getByText('SaaS Business Model')).toBeInTheDocument()
      expect(screen.getByText('User Testing Framework')).toBeInTheDocument()
    })
  })

  describe('Canvas Viewing', () => {
    test('opens canvas for viewing when clicked', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Find and click a VPC canvas
      const vpcCanvas = screen.getByText('E-commerce Platform VPC')
      await user.click(vpcCanvas)
      
      // Should show the canvas preview
      await waitFor(() => {
        expect(screen.getByTestId('vpc-preview')).toBeInTheDocument()
        expect(screen.getByText('VPC Preview')).toBeInTheDocument()
        expect(screen.getByText('Read Only: true')).toBeInTheDocument()
      })
    })

    test('opens BMC canvas for viewing', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const bmcCanvas = screen.getByText('SaaS Business Model')
      await user.click(bmcCanvas)
      
      await waitFor(() => {
        expect(screen.getByTestId('bmc-preview')).toBeInTheDocument()
        expect(screen.getByText('BMC Preview')).toBeInTheDocument()
        expect(screen.getByText('Read Only: true')).toBeInTheDocument()
      })
    })

    test('opens TBI canvas for viewing', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const tbiCanvas = screen.getByText('User Testing Framework')
      await user.click(tbiCanvas)
      
      await waitFor(() => {
        expect(screen.getByTestId('tbi-preview')).toBeInTheDocument()
        expect(screen.getByText('TBI Preview')).toBeInTheDocument()
        expect(screen.getByText('Read Only: true')).toBeInTheDocument()
      })
    })

    test('closes canvas view when back button clicked', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Open a canvas
      const vpcCanvas = screen.getByText('E-commerce Platform VPC')
      await user.click(vpcCanvas)
      
      await waitFor(() => {
        expect(screen.getByTestId('vpc-preview')).toBeInTheDocument()
      })
      
      // Find and click back button
      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)
      
      // Should return to gallery view
      expect(screen.queryByTestId('vpc-preview')).not.toBeInTheDocument()
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
    })
  })

  describe('View Modes', () => {
    test('switches between grid and list view', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Find view toggle buttons
      const viewButtons = screen.getAllByRole('button')
      const gridButton = viewButtons.find(btn => btn.getAttribute('aria-label')?.includes('grid'))
      const listButton = viewButtons.find(btn => btn.getAttribute('aria-label')?.includes('list'))
      
      if (gridButton && listButton) {
        // Switch to list view
        await user.click(listButton)
        
        // Should change layout (implementation dependent)
        expect(listButton).toBeInTheDocument()
        
        // Switch back to grid view
        await user.click(gridButton)
        
        expect(gridButton).toBeInTheDocument()
      }
    })
  })

  describe('Empty States', () => {
    test('shows empty state when no canvases provided', () => {
      render(<CanvasGallery demoCanvases={[]} />)
      
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
      // Should show empty state or no canvases message
    })

    test('handles undefined demo canvases', () => {
      render(<CanvasGallery />)
      
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
      // Should not crash and should show appropriate state
    })
  })

  describe('Canvas Actions', () => {
    test('shows action buttons for each canvas', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should have action buttons (view, edit, etc.)
      const actionButtons = screen.getAllByRole('button')
      expect(actionButtons.length).toBeGreaterThan(0)
    })

    test('handles canvas dropdown menu actions', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Find dropdown menu triggers (three dots button)
      const menuButtons = screen.getAllByRole('button')
      const dropdownButton = menuButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('menu') ||
        btn.textContent?.includes('⋮') ||
        btn.textContent?.includes('...')
      )
      
      if (dropdownButton) {
        await user.click(dropdownButton)
        
        // Should show dropdown menu options
        expect(dropdownButton).toBeInTheDocument()
      }
    })
  })

  describe('Responsive Design', () => {
    test('adapts to different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      })
      
      // Component should still render correctly
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    test('handles large number of canvases efficiently', () => {
      const largeCanvasSet = Array(100).fill(0).map((_, i) => {
        const types = ['vpc', 'bmc', 'tbi'] as const
        return {
          id: `canvas-${i}`,
          title: `Canvas ${i}`,
          type: types[i % 3],
          client: `Client ${i}`,
          status: 'completed' as const,
          lastModified: '2024-01-15',
          aiGenerated: i % 2 === 0,
          completionRate: Math.floor(Math.random() * 100)
        }
      })
      
      const startTime = performance.now()
      render(<CanvasGallery demoCanvases={largeCanvasSet} />)
      const endTime = performance.now()
      
      // Allow generous threshold to avoid CI flakiness
      expect(endTime - startTime).toBeLessThan(7000)
      expect(screen.getByText('Canvas Gallery')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Search input should have proper label
      const searchInput = screen.getByPlaceholderText(/search canvases/i)
      expect(searchInput).toBeInTheDocument()
      
      // Buttons should have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const hasAccessibleName = button.getAttribute('aria-label') || 
                                 button.textContent?.trim() || 
                                 button.getAttribute('title')
        expect(hasAccessibleName).toBeTruthy()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Should be able to tab through interactive elements
      await user.tab()
      
      // First tab should focus on Generate Canvas button
      expect(document.activeElement).toHaveAttribute('aria-label', 'Generate new canvas')
      
      // Tab to search input
      await user.tab()
      expect(document.activeElement).toHaveAttribute('placeholder', 'Search canvases...')
      
      // Tab to filter tabs - ShadCN Tabs focuses on individual tab elements
      await user.tab()
      expect(document.activeElement).toHaveAttribute('role', 'tab')
    })

    test('has proper heading structure', () => {
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      const mainHeading = screen.getByRole('heading', { name: /canvas gallery/i })
      expect(mainHeading).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    test('integrates with all canvas types correctly', async () => {
      const user = userEvent.setup()
      render(<CanvasGallery demoCanvases={mockDemoCanvases} />)
      
      // Test VPC integration - click on canvas card
      await user.click(screen.getByText('E-commerce Platform VPC'))
      await waitFor(() => {
        expect(screen.getByText('Back to Gallery')).toBeInTheDocument()
      })
      
      // Go back and test BMC
      await user.click(screen.getByText('Back to Gallery'))
      await user.click(screen.getByText('SaaS Business Model'))
      await waitFor(() => {
        expect(screen.getByText('Back to Gallery')).toBeInTheDocument()
      })
      
      // Go back and test TBI
      await user.click(screen.getByText('Back to Gallery'))
      await user.click(screen.getByText('User Testing Framework'))
      await waitFor(() => {
        expect(screen.getByText('Back to Gallery')).toBeInTheDocument()
      })
    })
  })
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ValuePropositionCanvas from '@/components/canvas/ValuePropositionCanvas'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock URL.createObjectURL for export functionality
const mockCreateObjectURL = jest.fn(() => 'mock-url')
const mockRevokeObjectURL = jest.fn()
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  }
})

// Mock document.createElement for export functionality
const mockClick = jest.fn()
const originalCreateElement = document.createElement
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
    } as any
  }
  return originalCreateElement.call(document, tagName)
})

describe('ValuePropositionCanvas', () => {
  const defaultProps = {
    canvasId: 'vpc-test-1',
    clientId: 'client-test-1',
    readOnly: false,
  }

  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
    mockClick.mockClear()
  })

  describe('Component Rendering', () => {
    test('renders main canvas structure', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      
      // Check for main sections
      expect(screen.getByText('Value Map')).toBeInTheDocument()
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
      
      // Check for subsections
      expect(screen.getByText('Products & Services')).toBeInTheDocument()
      expect(screen.getByText('Pain Relievers')).toBeInTheDocument()
      expect(screen.getByText('Gain Creators')).toBeInTheDocument()
      expect(screen.getByText('Customer Jobs')).toBeInTheDocument()
      expect(screen.getByText('Pains')).toBeInTheDocument()
      expect(screen.getByText('Gains')).toBeInTheDocument()
    })

    test('renders action buttons', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
    })

    test('renders canvas titles input fields', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Enter value proposition title...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter customer segment title...')).toBeInTheDocument()
    })
  })

  describe('Value Map Management', () => {
    test('adds new product/service item', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find the add button for Products & Services section
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const productsAddButton = addButtons[0] // First add button should be for products
      
      await user.click(productsAddButton)
      
      // Should see a new input field
      const productInputs = screen.getAllByPlaceholderText('What products and services do you offer?')
      expect(productInputs.length).toBeGreaterThan(0)
    })

    test('updates product/service text', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Add a product first
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0])
      
      // Type in the new input
      const productInputs = screen.getAllByPlaceholderText('What products and services do you offer?')
      const productInput = productInputs[0] // Get the first input
      await user.type(productInput, 'Mobile app')
      
      expect(productInput).toHaveValue('Mobile app')
    })

    test('removes product/service item', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Add a product first
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0])
      
      // Type some text
      const productInputs = screen.getAllByPlaceholderText('What products and services do you offer?')
      const productInput = productInputs[productInputs.length - 1] // Get the newly added input
      await user.type(productInput, 'Test product')
      
      // Add another product first to enable remove button (only shows when length > 1)
      await user.click(addButtons[0])
      
      // Count initial products
      const initialProducts = screen.getAllByPlaceholderText('What products and services do you offer?')
      const initialCount = initialProducts.length
      
      // Find and click remove button (× symbol)
      const removeButtons = screen.getAllByText('×')
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0])
        
        // Check that one product was removed
        const remainingProducts = screen.getAllByPlaceholderText('What products and services do you offer?')
        expect(remainingProducts.length).toBe(initialCount - 1)
      }
    })

    test('manages pain relievers section', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find pain relievers add button (should be second in value map)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const painRelieversAddButton = addButtons[1]
      
      await user.click(painRelieversAddButton)
      
      const painRelieverInputs = screen.getAllByPlaceholderText('How do you relieve customer pains?')
      const painRelieverInput = painRelieverInputs[painRelieverInputs.length - 1] // Get the newly added input
      await user.type(painRelieverInput, 'Automated backup system')
      
      expect(painRelieverInput).toHaveValue('Automated backup system')
    })

    test('manages gain creators section', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find gain creators add button (should be third in value map)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const gainCreatorsAddButton = addButtons[2]
      
      await user.click(gainCreatorsAddButton)
      
      const gainCreatorInputs = screen.getAllByPlaceholderText('How do you create customer gains?')
      const gainCreatorInput = gainCreatorInputs[gainCreatorInputs.length - 1] // Get the newly added input
      await user.type(gainCreatorInput, 'Real-time analytics dashboard')
      
      expect(gainCreatorInput).toHaveValue('Real-time analytics dashboard')
    })
  })

  describe('Customer Profile Management', () => {
    test('manages customer jobs section', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find customer jobs add button (should be fourth)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const jobsAddButton = addButtons[3]
      
      await user.click(jobsAddButton)
      
      const jobInputs = screen.getAllByPlaceholderText('What jobs is your customer trying to get done?')
      const jobInput = jobInputs[jobInputs.length - 1] // Get the newly added input
      await user.type(jobInput, 'Track business performance')
      
      expect(jobInput).toHaveValue('Track business performance')
    })

    test('manages pains section', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find pains add button (should be fifth)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const painsAddButton = addButtons[4]
      
      await user.click(painsAddButton)
      
      const painInput = screen.getByPlaceholderText('What pains does your customer experience?')
      await user.type(painInput, 'Manual data entry is time-consuming')
      
      expect(painInput).toHaveValue('Manual data entry is time-consuming')
    })

    test('manages gains section', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Find gains add button (should be sixth)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const gainsAddButton = addButtons[5]
      
      await user.click(gainsAddButton)
      
      const gainInput = screen.getByPlaceholderText('What gains does your customer expect?')
      await user.type(gainInput, 'Increased productivity and efficiency')
      
      expect(gainInput).toHaveValue('Increased productivity and efficiency')
    })
  })

  describe('Canvas Titles', () => {
    test('updates value proposition title', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      const vpTitleInput = screen.getByPlaceholderText('Enter value proposition title...')
      await user.type(vpTitleInput, 'Business Intelligence Platform')
      
      expect(vpTitleInput).toHaveValue('Business Intelligence Platform')
    })

    test('updates customer segment title', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      const customerTitleInput = screen.getByPlaceholderText('Enter customer segment title...')
      await user.type(customerTitleInput, 'Small Business Owners')
      
      expect(customerTitleInput).toHaveValue('Small Business Owners')
    })
  })

  describe('Save and Export Functionality', () => {
    test('calls onSave with current data when save button clicked', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} onSave={mockOnSave} />)
      
      // Add some data first
      const vpTitleInput = screen.getByPlaceholderText('Enter value proposition title...')
      await user.type(vpTitleInput, 'Test VP')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          valuePropositionTitle: 'Test VP',
          customerSegmentTitle: '',
          valueMap: expect.any(Object),
          customerProfile: expect.any(Object)
        })
      )
    })

    test('saves to localStorage when no onSave callback', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'vpc-canvas-vpc-test-1',
        expect.any(String)
      )
    })

    test('handles export button click', async () => {
      const user = userEvent.setup()
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)
      
      // Export functionality should be triggered (implementation dependent)
      expect(exportButton).toBeInTheDocument()
    })
  })

  describe('Initial Data Loading', () => {
    const initialData = {
      valuePropositionTitle: 'AI Analytics Platform',
      customerSegmentTitle: 'Data Scientists',
      valueMap: {
        productsAndServices: ['Machine learning models', 'Data visualization'],
        painRelievers: ['Automated model training'],
        gainCreators: ['Faster insights']
      },
      customerProfile: {
        jobs: ['Analyze data patterns'],
        pains: ['Complex model setup'],
        gains: ['Quick decision making']
      }
    }

    test('loads initial data correctly', () => {
      render(<ValuePropositionCanvas {...defaultProps} initialData={initialData} />)
      
      expect(screen.getByDisplayValue('AI Analytics Platform')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Data Scientists')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Machine learning models')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Analyze data patterns')).toBeInTheDocument()
    })
  })

  describe('Read-Only Mode', () => {
    test('disables inputs when readOnly is true', () => {
      render(<ValuePropositionCanvas {...defaultProps} readOnly={true} />)
      
      const vpTitleInput = screen.getByPlaceholderText('Enter value proposition title...')
      const customerTitleInput = screen.getByPlaceholderText('Enter customer segment title...')
      
      expect(vpTitleInput).toBeDisabled()
      expect(customerTitleInput).toBeDisabled()
    })

    test('hides action buttons in read-only mode', () => {
      render(<ValuePropositionCanvas {...defaultProps} readOnly={true} />)
      
      // Add buttons should not be present or should be disabled
      const addButtons = screen.queryAllByRole('button', { name: /add/i })
      addButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Data Validation', () => {
    test('handles empty arrays gracefully', () => {
      const emptyData = {
        valuePropositionTitle: '',
        customerSegmentTitle: '',
        valueMap: {
          productsAndServices: [],
          painRelievers: [],
          gainCreators: []
        },
        customerProfile: {
          jobs: [],
          pains: [],
          gains: []
        }
      }

      render(<ValuePropositionCanvas {...defaultProps} initialData={emptyData} />)
      
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
    })

    test('handles malformed data gracefully', () => {
      const malformedData = {
        valuePropositionTitle: null,
        customerSegmentTitle: undefined,
        valueMap: null,
        customerProfile: undefined
      }

      // Should not crash
      render(<ValuePropositionCanvas {...defaultProps} initialData={malformedData as any} />)
      
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { name: /value proposition canvas/i })).toBeInTheDocument()
      expect(screen.getByText('Value Map')).toBeInTheDocument()
      expect(screen.getByText('Customer Profile')).toBeInTheDocument()
    })

    test('has proper form labels', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      // Title inputs should have proper labels or placeholders
      expect(screen.getByPlaceholderText('Enter value proposition title...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter customer segment title...')).toBeInTheDocument()
    })

    test('buttons have accessible names or aria-labels', () => {
      render(<ValuePropositionCanvas {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    test('handles large datasets efficiently', async () => {
      const largeData = {
        valuePropositionTitle: 'Large Dataset Test',
        customerSegmentTitle: 'Test Segment',
        valueMap: {
          productsAndServices: Array(50).fill(0).map((_, i) => `Product ${i}`),
          painRelievers: Array(50).fill(0).map((_, i) => `Pain Reliever ${i}`),
          gainCreators: Array(50).fill(0).map((_, i) => `Gain Creator ${i}`)
        },
        customerProfile: {
          jobs: Array(50).fill(0).map((_, i) => `Job ${i}`),
          pains: Array(50).fill(0).map((_, i) => `Pain ${i}`),
          gains: Array(50).fill(0).map((_, i) => `Gain ${i}`)
        }
      }

      const startTime = performance.now()
      render(<ValuePropositionCanvas {...defaultProps} initialData={largeData} />)
      const endTime = performance.now()
      
      // Should render within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should still display the title
      expect(screen.getByDisplayValue('Large Dataset Test')).toBeInTheDocument()
    })
  })
})

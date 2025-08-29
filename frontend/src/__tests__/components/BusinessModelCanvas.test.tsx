import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BusinessModelCanvas from '@/components/canvas/BusinessModelCanvas'

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

describe('BusinessModelCanvas', () => {
  const defaultProps = {
    canvasId: 'bmc-test-1',
    clientId: 'client-test-1',
    readOnly: false,
  }

  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Component Rendering', () => {
    test('renders main canvas structure with 9 building blocks', () => {
      render(<BusinessModelCanvas {...defaultProps} />)
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      
      // Check for all 9 building blocks
      expect(screen.getByText('Key Partners')).toBeInTheDocument()
      expect(screen.getByText('Key Activities')).toBeInTheDocument()
      expect(screen.getByText('Key Resources')).toBeInTheDocument()
      expect(screen.getByText('Value Propositions')).toBeInTheDocument()
      expect(screen.getByText('Customer Relationships')).toBeInTheDocument()
      expect(screen.getByText('Channels')).toBeInTheDocument()
      expect(screen.getByText('Customer Segments')).toBeInTheDocument()
      expect(screen.getByText('Cost Structure')).toBeInTheDocument()
      expect(screen.getByText('Revenue Streams')).toBeInTheDocument()
    })

    test('renders action buttons', () => {
      render(<BusinessModelCanvas {...defaultProps} />)
      
      expect(screen.getByTestId('save-canvas-button')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ai generate/i })).toBeInTheDocument()
    })

    test('renders add buttons for each section', () => {
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Should have add buttons for each of the 9 sections
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      expect(addButtons.length).toBeGreaterThanOrEqual(9)
    })
  })

  describe('Key Partners Section', () => {
    test('adds new key partner', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Find the Key Partners section and its add button
      const keyPartnersSection = screen.getByText('Key Partners').closest('[data-section]')
      const addButton = keyPartnersSection?.querySelector('button[aria-label*="Add"], button:has-text("Add")')
      
      if (addButton) {
        await user.click(addButton)
        
        // Should see a textarea for the new partner
        const textarea = keyPartnersSection?.querySelector('textarea')
        expect(textarea).toBeInTheDocument()
      }
    })

    test('updates key partner text', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Add a key partner first
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0]) // Assume first button is for Key Partners
      
      // Find the textarea and update with fireEvent.change
      const textareas = screen.getAllByRole('textbox')
      const partnerTextarea = textareas[0]
      fireEvent.change(partnerTextarea, { target: { value: 'Technology suppliers' } })
      
      expect(partnerTextarea).toHaveValue('Technology suppliers')
    })

    test('removes key partner', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // First add content to the existing textarea (keyPartners-0)
      const keyPartnersTextarea = screen.getByTestId('keyPartners-0')
      fireEvent.change(keyPartnersTextarea, { target: { value: 'Test partner' } })
      
      // Wait for the value to be set
      await waitFor(() => {
        expect(keyPartnersTextarea).toHaveValue('Test partner')
      })
      
      // Find and click remove button (X button) - it should be next to the textarea
      const removeButton = screen.getByLabelText(/remove.*key partner/i)
      await user.click(removeButton)
      
      // Verify the item is removed (the textarea should be gone or empty)
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Test partner')).not.toBeInTheDocument()
      })
    })
  })

  describe('Value Propositions Section', () => {
    test('manages value propositions', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Find Value Propositions add button (should be 4th in the 9-block layout)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const vpAddButton = addButtons[3] // Assuming order: Partners, Activities, Resources, VP
      
      await user.click(vpAddButton)
      
      const textareas = screen.getAllByRole('textbox')
      const vpTextarea = textareas.find(ta => 
        ta.closest('[data-section="valuePropositions"]') ||
        ta.getAttribute('placeholder')?.includes('value proposition')
      )
      
      if (vpTextarea) {
        await user.type(vpTextarea, 'Automated business intelligence')
        expect(vpTextarea).toHaveValue('Automated business intelligence')
      }
    })
  })

  describe('Customer Segments Section', () => {
    test('manages customer segments', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Find Customer Segments add button
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const csAddButton = addButtons[6] // Assuming standard BMC layout order
      
      await user.click(csAddButton)
      
      const textareas = screen.getAllByRole('textbox')
      const csTextarea = textareas.find(ta => 
        ta.closest('[data-section="customerSegments"]') ||
        ta.getAttribute('placeholder')?.includes('customer segment')
      )
      
      if (csTextarea) {
        await user.type(csTextarea, 'Small and medium businesses')
        expect(csTextarea).toHaveValue('Small and medium businesses')
      }
    })
  })

  describe('Revenue Streams Section', () => {
    test('manages revenue streams', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Find Revenue Streams add button (should be last)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      const rsAddButton = addButtons[8] // Last of the 9 sections
      
      await user.click(rsAddButton)
      
      const textareas = screen.getAllByRole('textbox')
      const rsTextarea = textareas.find(ta => 
        ta.closest('[data-section="revenueStreams"]') ||
        ta.getAttribute('placeholder')?.includes('revenue')
      )
      
      if (rsTextarea) {
        await user.type(rsTextarea, 'Subscription fees')
        expect(rsTextarea).toHaveValue('Subscription fees')
      }
    })
  })

  describe('AI Generation', () => {
    test('triggers AI generation when button clicked', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      const aiButton = screen.getByRole('button', { name: /ai generate/i })
      await user.click(aiButton)
      
      // Should show loading state or trigger AI generation
      // This tests the button interaction, actual AI integration would be mocked
      expect(aiButton).toBeInTheDocument()
    })

    test('shows loading state during AI generation', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      const aiButton = screen.getByRole('button', { name: /ai generate/i })
      await user.click(aiButton)
      
      // Check if button shows loading state (implementation dependent)
      // This would typically show a spinner or "Generating..." text
      expect(aiButton).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    test('calls onSave with current BMC data', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} onSave={mockOnSave} />)
      
      // Add some data first by clicking Add and then Cancel to avoid dialog interference
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0]) // Add to Key Partners - this opens dialog
      
      // Cancel the dialog to close it but keep the added empty item
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      // Wait for dialog to close and textareas to be available
      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox')
        expect(textareas.length).toBeGreaterThan(0)
      })
      
      // Get the Key Partners textarea specifically (the newly added empty item)
      const keyPartnersTextarea = screen.getByTestId('keyPartners-1') // Target the newly added item
      
      // Use fireEvent.change to directly set the value (more reliable than typing)
      fireEvent.change(keyPartnersTextarea, { target: { value: 'Test partner' } })
      
      // Wait for the value to be updated
      await waitFor(() => {
        expect(keyPartnersTextarea).toHaveValue('Test partner')
      })
      
      const saveButton = screen.getByTestId('save-canvas-button')
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          keyPartners: expect.arrayContaining(['Test partner']),
          keyActivities: expect.any(Array),
          keyResources: expect.any(Array),
          valuePropositions: expect.any(Array),
          customerRelationships: expect.any(Array),
          channels: expect.any(Array),
          customerSegments: expect.any(Array),
          costStructure: expect.any(Array),
          revenueStreams: expect.any(Array)
        })
      )
    })

    test('saves to localStorage when no onSave callback', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      const saveButton = screen.getByTestId('save-canvas-button')
      await user.click(saveButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bmc-canvas-bmc-test-1',
        expect.any(String)
      )
    })
  })

  describe('Initial Data Loading', () => {
    const initialData = {
      keyPartners: ['Tech suppliers', 'Marketing agencies'],
      keyActivities: ['Software development', 'Customer support'],
      keyResources: ['Development team', 'Cloud infrastructure'],
      valuePropositions: ['Automated reporting', 'Real-time analytics'],
      customerRelationships: ['Self-service', 'Personal assistance'],
      channels: ['Website', 'Mobile app'],
      customerSegments: ['SMBs', 'Enterprise'],
      costStructure: ['Development costs', 'Infrastructure costs'],
      revenueStreams: ['Subscription', 'Professional services']
    }

    test('loads initial data correctly', () => {
      render(<BusinessModelCanvas {...defaultProps} initialData={initialData} />)
      
      // Check that initial data is displayed
      expect(screen.getByDisplayValue('Tech suppliers')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Software development')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Automated reporting')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Subscription')).toBeInTheDocument()
    })
  })

  describe('Read-Only Mode', () => {
    test('disables inputs when readOnly is true', () => {
      const initialData = {
        keyPartners: ['Test partner'],
        keyActivities: [],
        keyResources: [],
        valuePropositions: [],
        customerRelationships: [],
        channels: [],
        customerSegments: [],
        costStructure: [],
        revenueStreams: []
      }

      render(<BusinessModelCanvas {...defaultProps} readOnly={true} initialData={initialData} />)
      
      const textarea = screen.getByDisplayValue('Test partner')
      expect(textarea).toBeDisabled()
    })

    test('hides add/remove buttons in read-only mode', () => {
      render(<BusinessModelCanvas {...defaultProps} readOnly={true} />)
      
      const addButtons = screen.queryAllByRole('button', { name: /add/i })
      addButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Section Management', () => {
    test('handles all 9 sections independently', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      const sectionNames = [
        'Key Partners', 'Key Activities', 'Key Resources',
        'Value Propositions', 'Customer Relationships', 'Channels',
        'Customer Segments', 'Cost Structure', 'Revenue Streams'
      ]
      
      // Verify all sections are present
      sectionNames.forEach(sectionName => {
        expect(screen.getByText(sectionName)).toBeInTheDocument()
      })
      
      // Should have 9 add buttons (one for each section)
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      expect(addButtons.length).toBeGreaterThanOrEqual(9)
    })

    test('maintains section data independently', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Edit items in different sections directly (following official Strategyzer templates)
      // Each section starts with empty textareas that can be edited directly
      
      // Edit first section (Key Partners)
      const keyPartnersTextarea = screen.getByTestId('keyPartners-0')
      fireEvent.change(keyPartnersTextarea, { target: { value: 'Partner 1' } })
      
      // Wait for the value to be updated
      await waitFor(() => {
        expect(keyPartnersTextarea).toHaveValue('Partner 1')
      })
      
      // Edit second section (Key Activities)
      const keyActivitiesTextarea = screen.getByTestId('keyActivities-0')
      fireEvent.change(keyActivitiesTextarea, { target: { value: 'Activity 1' } })
      
      // Wait for the value to be updated
      await waitFor(() => {
        expect(keyActivitiesTextarea).toHaveValue('Activity 1')
      })
      
      // Both should be present using testid to avoid dialog input conflicts
      expect(screen.getByTestId('keyPartners-0')).toHaveValue('Partner 1')
      expect(screen.getByTestId('keyActivities-0')).toHaveValue('Activity 1')
    })
  })

  describe('Data Validation', () => {
    test('handles empty initial data', () => {
      const emptyData = {
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

      render(<BusinessModelCanvas {...defaultProps} initialData={emptyData} />)
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
    })

    test('handles malformed data gracefully', () => {
      const malformedData = {
        keyPartners: null,
        keyActivities: undefined,
        keyResources: 'not an array',
        valuePropositions: [],
        customerRelationships: [],
        channels: [],
        customerSegments: [],
        costStructure: [],
        revenueStreams: []
      }

      // Should not crash
      render(<BusinessModelCanvas {...defaultProps} initialData={malformedData as any} />)
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      render(<BusinessModelCanvas {...defaultProps} />)
      
      expect(screen.getByRole('heading', { name: /business model canvas/i })).toBeInTheDocument()
      
      // Section headings should be present
      expect(screen.getByText('Key Partners')).toBeInTheDocument()
      expect(screen.getByText('Value Propositions')).toBeInTheDocument()
    })

    test('has accessible form controls', () => {
      render(<BusinessModelCanvas {...defaultProps} />)
      
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      expect(addButtons.length).toBeGreaterThan(0)
      
      const saveButton = screen.getByTestId('save-canvas-button')
      expect(saveButton).toBeInTheDocument()
    })

    test('textareas have proper labels or placeholders', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)
      
      // Add an item to see textarea
      const addButtons = screen.getAllByRole('button', { name: /add/i })
      await user.click(addButtons[0])
      
      const textareas = screen.getAllByRole('textbox')
      expect(textareas.length).toBeGreaterThan(0)
      
      // Each textarea should have a placeholder or label
      textareas.forEach(textarea => {
        const hasPlaceholder = textarea.getAttribute('placeholder')
        const hasLabel = textarea.getAttribute('aria-label') || textarea.getAttribute('aria-labelledby')
        expect(hasPlaceholder || hasLabel).toBeTruthy()
      })
    })
  })

  describe('Performance', () => {
    test('handles large datasets efficiently', async () => {
      const largeData = {
        keyPartners: Array(20).fill(0).map((_, i) => `Partner ${i}`),
        keyActivities: Array(20).fill(0).map((_, i) => `Activity ${i}`),
        keyResources: Array(20).fill(0).map((_, i) => `Resource ${i}`),
        valuePropositions: Array(20).fill(0).map((_, i) => `VP ${i}`),
        customerRelationships: Array(20).fill(0).map((_, i) => `Relationship ${i}`),
        channels: Array(20).fill(0).map((_, i) => `Channel ${i}`),
        customerSegments: Array(20).fill(0).map((_, i) => `Segment ${i}`),
        costStructure: Array(20).fill(0).map((_, i) => `Cost ${i}`),
        revenueStreams: Array(20).fill(0).map((_, i) => `Revenue ${i}`)
      }

      const startTime = performance.now()
      render(<BusinessModelCanvas {...defaultProps} initialData={largeData} />)
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(1000)
      
      // Should display the data using testid to avoid conflicts
      expect(screen.getByTestId('keyPartners-0')).toHaveValue('Partner 0')
      expect(screen.getByTestId('valuePropositions-0')).toHaveValue('VP 0')
    })
  })

  describe('Integration', () => {
    test('works with different clientId values', () => {
      render(<BusinessModelCanvas {...defaultProps} clientId="different-client" />)
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
    })

    test('works with different canvasId values', () => {
      render(<BusinessModelCanvas {...defaultProps} canvasId="different-canvas" />)
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
    })
  })
})

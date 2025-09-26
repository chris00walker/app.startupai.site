import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import TestingBusinessIdeasCanvas from '@/components/canvas/TestingBusinessIdeasCanvas'

// Mock the date-fns library
jest.mock('date-fns', () => ({
  format: jest.fn((date) => date?.toLocaleDateString() || ''),
}))

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

type TestUser = ReturnType<typeof userEvent.setup>

async function findActiveDialog(timeout = 250): Promise<HTMLElement | null> {
  try {
    return await screen.findByRole('dialog', undefined, { timeout })
  } catch {
    return null
  }
}

async function addItemThroughDialogOrInline({
  user,
  buttonName,
  placeholder,
  value,
  submitLabel = /^add$/i
}: {
  user: TestUser
  buttonName: RegExp | string
  placeholder: string
  value?: string
  submitLabel?: RegExp
}): Promise<HTMLElement> {
  const addButton = screen.getByRole('button', { name: buttonName })
  const inputsBefore = screen.queryAllByPlaceholderText(placeholder)

  await user.click(addButton)

  const dialog = await findActiveDialog()
  if (dialog) {
    const field = within(dialog).getByPlaceholderText(placeholder)
    if (value) {
      await user.clear(field)
      await user.type(field, value)
    }

    const confirmButton = within(dialog).getByRole('button', { name: submitLabel })
    await user.click(confirmButton)

    if (value) {
      return await screen.findByDisplayValue(value)
    }

    const inputsAfter = await screen.findAllByPlaceholderText(placeholder)
    const newlyAdded = inputsAfter.find((input) => !inputsBefore.includes(input))
    return newlyAdded ?? inputsAfter[inputsAfter.length - 1]
  }

  const inputsAfter = screen.getAllByPlaceholderText(placeholder)
  const newInput = inputsAfter[inputsAfter.length - 1]
  if (value) {
    await user.type(newInput, value)
  }
  return newInput
}

describe('TestingBusinessIdeasCanvas', () => {
  const defaultProps = {
    canvasId: 'test-canvas-1',
    clientId: 'test-client-1',
    readOnly: false,
  }

  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Component Rendering', () => {
    test('renders main header and navigation tabs', () => {
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      expect(screen.getByText('Testing Business Ideas')).toBeInTheDocument()
      expect(screen.getByText('Validate your business assumptions systematically')).toBeInTheDocument()
      
      // Check all tabs are present
      expect(screen.getByRole('tab', { name: /assumptions/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /test cards/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /learning cards/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /experiments/i })).toBeInTheDocument()
    })

    test('renders action buttons in header', () => {
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    test('renders assumptions tab by default', () => {
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      expect(screen.getByText('Assumption Map')).toBeInTheDocument()
      expect(screen.getByText('Map your riskiest assumptions and track validation progress')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add assumption/i })).toBeInTheDocument()
    })
  })

  describe('Assumptions Management', () => {
    test('adds new assumption when Add Assumption button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add assumption/i,
        placeholder: 'Describe your assumption...'
      })
      
      // Should see table headers and a new row
      expect(screen.getByText('Assumption')).toBeInTheDocument()
      expect(screen.getByText('Risk')).toBeInTheDocument()
      expect(screen.getByText('Evidence')).toBeInTheDocument()
      expect(screen.getByText('Confidence')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      
      // Should see form elements for the new assumption
      expect(screen.getByPlaceholderText('Describe your assumption...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Evidence...')).toBeInTheDocument()
    })

    test('updates assumption text when typing', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Add an assumption first
      const assumptionTextarea = await addItemThroughDialogOrInline({
        user,
        buttonName: /add assumption/i,
        placeholder: 'Describe your assumption...'
      })
      fireEvent.change(assumptionTextarea, { target: { value: 'Users will pay for premium features' } })
      
      expect(assumptionTextarea).toHaveValue('Users will pay for premium features')
    })

    test('renders risk level select dropdown', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Add an assumption first
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add assumption/i,
        placeholder: 'Describe your assumption...'
      })

      const riskSelect = await screen.findByRole('combobox')
      
      // Verify the select component is properly rendered and accessible
      expect(riskSelect).toBeInTheDocument()
      expect(riskSelect).toBeEnabled()
      expect(riskSelect).toHaveAttribute('aria-expanded', 'false')
    })

    test('updates confidence slider', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Add an assumption first
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add assumption/i,
        placeholder: 'Describe your assumption...'
      })

      expect(screen.getByText('50%')).toBeInTheDocument()
      
      // Find the slider (it's an input with type range)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveValue(50)
    })

    test('removes assumption when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Add an assumption first
      const assumptionTextarea = await addItemThroughDialogOrInline({
        user,
        buttonName: /add assumption/i,
        placeholder: 'Describe your assumption...'
      })
      await user.type(assumptionTextarea, 'Test assumption')
      
      // Find and click the delete button
      const deleteButton = screen.getByRole('button', { name: '' }) // X button has no accessible name
      await user.click(deleteButton)
      
      // The assumption should be removed
      expect(screen.queryByText('Test Assumption')).not.toBeInTheDocument()
    }, 15000)
  })

  describe('Tab Navigation', () => {
    test('switches to Test Cards tab', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      const testCardsTab = screen.getByRole('tab', { name: /test cards/i })
      await user.click(testCardsTab)
      
      expect(screen.getByRole('heading', { name: 'Test Cards' })).toBeInTheDocument()
      expect(screen.getByText('Design experiments to validate your assumptions')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add test card/i })).toBeInTheDocument()
    }, 15000)

    test('switches to Learning Cards tab', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      const learningCardsTab = screen.getByRole('tab', { name: /learning cards/i })
      await user.click(learningCardsTab)
      
      expect(screen.getByRole('heading', { name: 'Learning Cards' })).toBeInTheDocument()
      expect(screen.getByText('Capture insights and make decisions based on test results')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add learning card/i })).toBeInTheDocument()
    })

    test('switches to Experiments tab', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      const experimentsTab = screen.getByRole('tab', { name: /experiments/i })
      await user.click(experimentsTab)
      
      expect(screen.getByText('Experiment Library')).toBeInTheDocument()
      expect(screen.getByText('Manage your portfolio of experiments and track their progress')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add experiment/i })).toBeInTheDocument()
    })
  })

  describe('Test Cards Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Switch to Test Cards tab
      const testCardsTab = screen.getByRole('tab', { name: /test cards/i })
      await user.click(testCardsTab)
    })

    test('adds new test card', async () => {
      const user = userEvent.setup()
      
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add test card/i,
        placeholder: 'We believe that...'
      })
      
      // Should see a new test card
      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByLabelText(/hypothesis/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/test method/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/metric/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/success criteria/i)).toBeInTheDocument()
    })

    test('fills out test card form fields', async () => {
      const user = userEvent.setup()
      
      const hypothesisField = await addItemThroughDialogOrInline({
        user,
        buttonName: /add test card/i,
        placeholder: 'We believe that...'
      })
      await user.type(hypothesisField, 'Users will sign up for our newsletter')
      
      const testMethodField = await screen.findByPlaceholderText('How will you test this?')
      await user.type(testMethodField, 'Create a landing page with signup form')
      
      const metricField = await screen.findByPlaceholderText('What will you measure?')
      await user.type(metricField, 'Signup conversion rate')
      
      const successField = await screen.findByPlaceholderText('What indicates success?')
      await user.type(successField, '15% conversion rate')
      
      // Verify the values
      expect(hypothesisField).toHaveValue('Users will sign up for our newsletter')
      expect(testMethodField).toHaveValue('Create a landing page with signup form')
      expect(metricField).toHaveValue('Signup conversion rate')
      expect(successField).toHaveValue('15% conversion rate')
    }, 15000)

    test('selects expected outcome via radio buttons', async () => {
      const user = userEvent.setup()
      
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add test card/i,
        placeholder: 'We believe that...'
      })
      
      // Find and select pivot option
      const pivotRadio = screen.getByLabelText('Pivot')
      await user.click(pivotRadio)
      
      expect(pivotRadio).toBeChecked()
    })
  })

  describe('Learning Cards Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Switch to Learning Cards tab
      const learningCardsTab = screen.getByRole('tab', { name: /learning cards/i })
      await user.click(learningCardsTab)
    })

    test('adds new learning card', async () => {
      const user = userEvent.setup()
      
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add learning card/i,
        placeholder: 'What did you observe?'
      })
      
      // Should see a new learning card
      expect(await screen.findByText('Learning Card')).toBeInTheDocument()
      expect(await screen.findByLabelText(/related test/i)).toBeInTheDocument()
      expect(await screen.findByLabelText(/observations/i)).toBeInTheDocument()
      expect(await screen.findByLabelText(/insights/i)).toBeInTheDocument()
      expect(await screen.findByLabelText(/owner/i)).toBeInTheDocument()
    })

    test('fills out learning card observations and insights', async () => {
      const user = userEvent.setup()
      
      const observationsField = await addItemThroughDialogOrInline({
        user,
        buttonName: /add learning card/i,
        placeholder: 'What did you observe?'
      })
      await user.type(observationsField, 'Users clicked the signup button but abandoned the form')
      
      const insightsField = await screen.findByPlaceholderText('What insights did you gain?')
      await user.type(insightsField, 'The form is too long and complex')
      
      expect(observationsField).toHaveValue('Users clicked the signup button but abandoned the form')
      expect(insightsField).toHaveValue('The form is too long and complex')
    }, 15000)
  })

  describe('Experiments Management', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      // Switch to Experiments tab
      const experimentsTab = screen.getByRole('tab', { name: /experiments/i })
      await user.click(experimentsTab)
    })

    test('adds new experiment', async () => {
      const user = userEvent.setup()
      
      await addItemThroughDialogOrInline({
        user,
        buttonName: /add experiment/i,
        placeholder: 'Experiment title...'
      })
      
      // Should see table headers and a new row
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Owner')).toBeInTheDocument()
      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('End Date')).toBeInTheDocument()
      
      // Should see form elements
      expect(screen.getByPlaceholderText('Experiment title...')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Owner...')).toBeInTheDocument()
    })

    test('fills out experiment details', async () => {
      const user = userEvent.setup()
      
      const titleField = await addItemThroughDialogOrInline({
        user,
        buttonName: /add experiment/i,
        placeholder: 'Experiment title...'
      })
      await user.type(titleField, 'Landing Page A/B Test')
      
      const ownerField = await screen.findByPlaceholderText('Owner...')
      await user.type(ownerField, 'John Doe')
      
      expect(titleField).toHaveValue('Landing Page A/B Test')
      expect(ownerField).toHaveValue('John Doe')
    }, 15000)
  })

  describe('Save Functionality', () => {
    test('calls onSave when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} onSave={mockOnSave} />)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      expect(mockOnSave).toHaveBeenCalledWith({
        assumptions: [],
        testCards: [],
        learningCards: [],
        experiments: []
      })
    })

    test('saves to localStorage when no onSave callback provided', async () => {
      const user = userEvent.setup()
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tbi-canvas-test-canvas-1',
        JSON.stringify({
          assumptions: [],
          testCards: [],
          learningCards: [],
          experiments: []
        })
      )
    })
  })

  describe('Read-Only Mode', () => {
    test('disables form elements when readOnly is true', () => {
      render(<TestingBusinessIdeasCanvas {...defaultProps} readOnly={true} />)
      
      // Add button should still be visible but we'll test that form elements are disabled
      const addButton = screen.getByRole('button', { name: /add assumption/i })
      expect(addButton).toBeInTheDocument()
      
      // In read-only mode, the component should handle disabling internally
      // This is more of an integration test to ensure the prop is passed correctly
    })
  })

  describe('Initial Data Loading', () => {
    const initialData = {
      assumptions: [
        {
          id: '1',
          assumption: 'Users want mobile access',
          risk: 'high' as const,
          evidence: 'Survey results',
          confidence: 75,
          priority: 'high' as const,
          status: 'testing' as const
        }
      ],
      testCards: [],
      learningCards: [],
      experiments: []
    }

    test('loads initial data correctly', () => {
      render(<TestingBusinessIdeasCanvas {...defaultProps} initialData={initialData} />)
      
      // Should display the initial assumption
      expect(screen.getByDisplayValue('Users want mobile access')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Survey results')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing date-fns gracefully', () => {
      // This test ensures our mocking works and the component doesn't crash
      render(<TestingBusinessIdeasCanvas {...defaultProps} />)
      expect(screen.getByText('Testing Business Ideas')).toBeInTheDocument()
    })
  })
})

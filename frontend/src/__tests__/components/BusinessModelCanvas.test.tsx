/**
 * @story US-F12
 */

import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import BusinessModelCanvas from '@/components/canvas/BusinessModelCanvas'

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('BusinessModelCanvas', () => {
  const defaultProps = {
    canvasId: 'bmc-test-1',
    clientId: 'client-test-1'
  }

  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Rendering', () => {
    test('shows canvas header and sections', () => {
      render(<BusinessModelCanvas {...defaultProps} />)

      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      const sections = [
        'Key Partners',
        'Key Activities',
        'Key Resources',
        'Value Propositions',
        'Customer Relationships',
        'Channels',
        'Customer Segments',
        'Cost Structure',
        'Revenue Streams'
      ]

      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument()
      })
    })

    test('renders action buttons when editable', () => {
      render(<BusinessModelCanvas {...defaultProps} />)

      expect(screen.getByRole('button', { name: /ai generate/i })).toBeInTheDocument()
      expect(screen.getByTestId('save-canvas-button')).toBeInTheDocument()
    })
  })

  describe('Adding Items', () => {
    test('allows adding a key partner via dialog', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /add key partner/i }))

      const dialog = await screen.findByRole('dialog')
      const input = within(dialog).getByPlaceholderText(/enter key partners/i)
      await user.type(input, 'Strategic integrator')
      await user.click(within(dialog).getByRole('button', { name: /^add$/i }))

      await waitFor(() => {
        expect(screen.getByText('Strategic integrator')).toBeInTheDocument()
      })
    })
  })

  describe('Removing Items', () => {
    test('removes an item when delete is clicked', async () => {
      const user = userEvent.setup()
      render(
        <BusinessModelCanvas
          {...defaultProps}
          initialData={{
            keyPartners: ['Pilot partner'],
            keyActivities: ['Activity'],
            keyResources: [],
            valuePropositions: [],
            customerRelationships: [],
            channels: [],
            customerSegments: [],
            costStructure: [],
            revenueStreams: []
          }}
        />
      )

      await user.click(
        screen.getByRole('button', { name: /remove.*pilot partner/i })
      )

      await waitFor(() => {
        expect(screen.queryByText('Pilot partner')).not.toBeInTheDocument()
      })
    })
  })

  describe('Saving', () => {
    test('invokes onSave with current canvas state', async () => {
      const user = userEvent.setup()
      const initialData = {
        keyPartners: ['Strategic partner'],
        keyActivities: ['Core activity'],
        keyResources: ['Core resource'],
        valuePropositions: ['Key value'],
        customerRelationships: ['Relationship'],
        channels: ['Primary channel'],
        customerSegments: ['Primary segment'],
        costStructure: ['Primary cost'],
        revenueStreams: ['Primary revenue']
      }

      render(<BusinessModelCanvas {...defaultProps} initialData={initialData} onSave={mockOnSave} />)

      await user.click(screen.getByTestId('save-canvas-button'))

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining(initialData))
      })
    })

    test('persists to localStorage when onSave absent', async () => {
      const user = userEvent.setup()
      render(<BusinessModelCanvas {...defaultProps} />)

      await user.click(screen.getByTestId('save-canvas-button'))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bmc-canvas-bmc-test-1',
        expect.any(String)
      )
    })
  })

  describe('Initial Data', () => {
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

    test('renders initial data values', () => {
      render(<BusinessModelCanvas {...defaultProps} initialData={initialData} />)

      Object.values(initialData).forEach(values => {
        values.forEach(value => {
          expect(screen.getByText(value)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Read-only Mode', () => {
    test('hides add and remove controls when readOnly', () => {
      render(
        <BusinessModelCanvas
          {...defaultProps}
          readOnly
          initialData={{
            keyPartners: ['Trusted partner'],
            keyActivities: [],
            keyResources: [],
            valuePropositions: [],
            customerRelationships: [],
            channels: [],
            customerSegments: [],
            costStructure: [],
            revenueStreams: []
          }}
        />
      )

      expect(screen.getByText('Trusted partner')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })
  })
})

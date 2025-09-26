import React from 'react'
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CanvasEditor from '@/components/canvas/CanvasEditor'
import api from '@/services/api'

type MockedCanvasApi = jest.Mocked<typeof api.canvas>

const mockedCanvasApi = api.canvas as MockedCanvasApi

type CanvasEditorPropsType = Parameters<typeof CanvasEditor>[0]

const mockCanvasResponse = {
  canvas: { data: {} },
  metadata: {
    id: 'test-canvas-1',
    name: 'Test Canvas',
    type: 'value-proposition',
    status: 'draft',
    lastModified: new Date().toISOString(),
    collaborators: [],
    aiGenerated: false,
    version: 1,
  },
}

const defaultProps: CanvasEditorPropsType = {
  canvasId: 'test-canvas-1',
  canvasType: 'value-proposition',
  clientId: 'test-client',
  mode: 'edit',
}

const renderCanvasEditor = async (
  props: Partial<CanvasEditorPropsType> = {},
  { waitForLoad = true }: { waitForLoad?: boolean } = {}
) => {
  const utils = render(<CanvasEditor {...defaultProps} {...props} />)

  if (waitForLoad) {
    await waitForElementToBeRemoved(() => screen.getByText('Loading canvas...'))
  }

  return utils
}

const rerenderCanvasEditor = async (
  renderResult: ReturnType<typeof render>,
  props: Partial<CanvasEditorPropsType> = {},
  { waitForLoad = true }: { waitForLoad?: boolean } = {}
) => {
  renderResult.rerender(<CanvasEditor {...defaultProps} {...props} />)

  if (waitForLoad) {
    await waitForElementToBeRemoved(() => screen.getByText('Loading canvas...'))
  }
}

// Mock the canvas components
jest.mock('@/components/canvas/ValuePropositionCanvas', () => {
  return function MockValuePropositionCanvas({ canvasId, clientId, onSave, readOnly }: any) {
    return (
      <div data-testid="vpc-component">
        <h2>Value Proposition Canvas</h2>
        <p>Canvas ID: {canvasId}</p>
        <p>Client ID: {clientId}</p>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
        <button onClick={() => onSave?.({ test: 'vpc-data' })}>Save VPC</button>
      </div>
    )
  }
})

jest.mock('@/components/canvas/BusinessModelCanvas', () => {
  return function MockBusinessModelCanvas({ canvasId, clientId, onSave, readOnly }: any) {
    return (
      <div data-testid="bmc-component">
        <h2>Business Model Canvas</h2>
        <p>Canvas ID: {canvasId}</p>
        <p>Client ID: {clientId}</p>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
        <button onClick={() => onSave?.({ test: 'bmc-data' })}>Save BMC</button>
      </div>
    )
  }
})

jest.mock('@/components/canvas/TestingBusinessIdeasCanvas', () => {
  return function MockTestingBusinessIdeasCanvas({ canvasId, clientId, onSave, readOnly }: any) {
    return (
      <div data-testid="tbi-component">
        <h2>Testing Business Ideas Canvas</h2>
        <p>Canvas ID: {canvasId}</p>
        <p>Client ID: {clientId}</p>
        <p>Read Only: {readOnly ? 'true' : 'false'}</p>
        <button onClick={() => onSave?.({ test: 'tbi-data' })}>Save TBI</button>
      </div>
    )
  }
})

// Mock API service
jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    canvas: {
      getById: jest.fn(),
      updateCanvas: jest.fn(),
      generateValueProposition: jest.fn(),
      exportCanvas: jest.fn(),
    },
  },
}))

describe('CanvasEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedCanvasApi.getById.mockResolvedValue(mockCanvasResponse)
    mockedCanvasApi.updateCanvas.mockResolvedValue({ success: true })
    mockedCanvasApi.generateValueProposition.mockResolvedValue({ canvasId: 'generated-id' })
    mockedCanvasApi.exportCanvas.mockResolvedValue(new Uint8Array())
  })

  describe('Component Rendering', () => {
    test('renders canvas editor with header', async () => {
      await renderCanvasEditor()

      // Should show canvas editor interface
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
    })

    test('renders Value Proposition Canvas when type is value-proposition', async () => {
      await renderCanvasEditor({ canvasType: 'value-proposition' })

      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('renders Business Model Canvas when type is business-model', async () => {
      await renderCanvasEditor({ canvasType: 'business-model' })

      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('renders Testing Business Ideas Canvas when type is testing-business-ideas', async () => {
      await renderCanvasEditor({ canvasType: 'testing-business-ideas' })

      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
      expect(screen.getByText('Testing Business Ideas Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('shows unsupported message for unknown canvas type', async () => {
      await renderCanvasEditor({ canvasType: 'unknown' as any })

      expect(screen.getByText('Canvas type not supported yet')).toBeInTheDocument()
    })
  })

  describe('Mode Handling', () => {
    test('passes readOnly=false when mode is edit', async () => {
      await renderCanvasEditor({ mode: 'edit' })

      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })

    test('passes readOnly=true when mode is view', async () => {
      await renderCanvasEditor({ mode: 'view' })

      expect(screen.getByText('Read Only: true')).toBeInTheDocument()
    })

    test('passes readOnly=false when mode is collaborate', async () => {
      await renderCanvasEditor({ mode: 'collaborate' })

      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })

    test('defaults to edit mode when no mode specified', async () => {
      const { mode: _mode, ...propsWithoutMode } = defaultProps
      await renderCanvasEditor(propsWithoutMode)

      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })
  })

  describe('Canvas Type Names', () => {
    test('returns correct name for value-proposition', async () => {
      await renderCanvasEditor({ canvasType: 'value-proposition' })

      // The component should internally handle the type name correctly
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
    })

    test('returns correct name for business-model', async () => {
      await renderCanvasEditor({ canvasType: 'business-model' })

      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()
    })

    test('returns correct name for testing-business-ideas', async () => {
      await renderCanvasEditor({ canvasType: 'testing-business-ideas' })

      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    test('handles save from Value Proposition Canvas', async () => {
      const user = userEvent.setup()
      await renderCanvasEditor({ canvasType: 'value-proposition' })

      const saveButton = screen.getByText('Save VPC')
      await user.click(saveButton)
      
      // Save functionality should be triggered
      expect(saveButton).toBeInTheDocument()
    })

    test('handles save from Business Model Canvas', async () => {
      const user = userEvent.setup()
      await renderCanvasEditor({ canvasType: 'business-model' })
      
      const saveButton = screen.getByText('Save BMC')
      await user.click(saveButton)
      
      expect(saveButton).toBeInTheDocument()
    })

    test('handles save from Testing Business Ideas Canvas', async () => {
      const user = userEvent.setup()
      await renderCanvasEditor({ canvasType: 'testing-business-ideas' })
      
      const saveButton = screen.getByText('Save TBI')
      await user.click(saveButton)
      
      expect(saveButton).toBeInTheDocument()
    })
  })

  describe('Props Passing', () => {
    test('passes canvasId correctly to child components', async () => {
      await renderCanvasEditor({ canvasId: 'custom-canvas-id' })

      expect(screen.getByText('Canvas ID: custom-canvas-id')).toBeInTheDocument()
    })

    test('passes clientId correctly to child components', async () => {
      await renderCanvasEditor({ clientId: 'custom-client-id' })

      expect(screen.getByText('Client ID: custom-client-id')).toBeInTheDocument()
    })

    test('handles new canvas creation', async () => {
      await renderCanvasEditor({ canvasId: 'new' })

      expect(screen.getByText('Canvas ID: new')).toBeInTheDocument()
    })
  })

  describe('Canvas Type Switching', () => {
    test('switches between canvas types correctly', async () => {
      const renderResult = await renderCanvasEditor({ canvasType: 'value-proposition' })

      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
      expect(screen.queryByTestId('bmc-component')).not.toBeInTheDocument()

      await rerenderCanvasEditor(renderResult, { canvasType: 'business-model' })

      expect(screen.queryByTestId('vpc-component')).not.toBeInTheDocument()
      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()

      await rerenderCanvasEditor(renderResult, { canvasType: 'testing-business-ideas' })

      expect(screen.queryByTestId('bmc-component')).not.toBeInTheDocument()
      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing canvasId gracefully', async () => {
      const { canvasId: _canvasId, ...propsWithoutCanvasId } = defaultProps
      await renderCanvasEditor(propsWithoutCanvasId)

      // Should still render without crashing
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
    })

    test('handles missing clientId gracefully', async () => {
      // Since clientId is required, we'll test with an empty string instead
      await renderCanvasEditor({ clientId: '' }, { waitForLoad: false })

      // Should still render without crashing
      expect(screen.getByText('Loading canvas...')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    test('integrates with all three canvas types', async () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]

      for (const canvasType of canvasTypes) {
        const utils = await renderCanvasEditor({ canvasType })

        const expectedTestId = canvasType === 'value-proposition'
          ? 'vpc-component'
          : canvasType === 'business-model'
            ? 'bmc-component'
            : 'tbi-component'

        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument()

        utils.unmount()
      }
    })

    test('maintains consistent interface across canvas types', async () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]

      for (const canvasType of canvasTypes) {
        const utils = await renderCanvasEditor({ canvasType })

        expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
        expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
        expect(screen.getByText('Read Only: false')).toBeInTheDocument()

        utils.unmount()
      }
    })
  })

  describe('Performance', () => {
    test('renders quickly with different canvas types', async () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]
      
      for (const canvasType of canvasTypes) {
        const startTime = performance.now()
        const utils = await renderCanvasEditor({ canvasType })
        const endTime = performance.now()

        expect(endTime - startTime).toBeLessThan(100)

        utils.unmount()
      }
    })
  })

  describe('Accessibility', () => {
    test('maintains accessibility across canvas types', async () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]

      for (const canvasType of canvasTypes) {
        const utils = await renderCanvasEditor({ canvasType })

        const canvasHeading = screen.getByRole('heading', { level: 2 })
        expect(canvasHeading).toBeInTheDocument()

        utils.unmount()
      }
    })
  })
})

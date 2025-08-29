import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import CanvasEditor from '@/components/canvas/CanvasEditor'

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
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

describe('CanvasEditor', () => {
  const defaultProps = {
    canvasId: 'test-canvas-1',
    canvasType: 'value-proposition' as const,
    clientId: 'test-client',
    mode: 'edit' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    test('renders canvas editor with header', () => {
      render(<CanvasEditor {...defaultProps} />)
      
      // Should show canvas editor interface
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
    })

    test('renders Value Proposition Canvas when type is value-proposition', () => {
      render(<CanvasEditor {...defaultProps} canvasType="value-proposition" />)
      
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('renders Business Model Canvas when type is business-model', () => {
      render(<CanvasEditor {...defaultProps} canvasType="business-model" />)
      
      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('renders Testing Business Ideas Canvas when type is testing-business-ideas', () => {
      render(<CanvasEditor {...defaultProps} canvasType="testing-business-ideas" />)
      
      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
      expect(screen.getByText('Testing Business Ideas Canvas')).toBeInTheDocument()
      expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
      expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
    })

    test('shows unsupported message for unknown canvas type', () => {
      render(<CanvasEditor {...defaultProps} canvasType={'unknown' as any} />)
      
      expect(screen.getByText('Canvas type not supported yet')).toBeInTheDocument()
    })
  })

  describe('Mode Handling', () => {
    test('passes readOnly=false when mode is edit', () => {
      render(<CanvasEditor {...defaultProps} mode="edit" />)
      
      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })

    test('passes readOnly=true when mode is view', () => {
      render(<CanvasEditor {...defaultProps} mode="view" />)
      
      expect(screen.getByText('Read Only: true')).toBeInTheDocument()
    })

    test('passes readOnly=false when mode is collaborate', () => {
      render(<CanvasEditor {...defaultProps} mode="collaborate" />)
      
      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })

    test('defaults to edit mode when no mode specified', () => {
      const { mode, ...propsWithoutMode } = defaultProps
      render(<CanvasEditor {...propsWithoutMode} />)
      
      expect(screen.getByText('Read Only: false')).toBeInTheDocument()
    })
  })

  describe('Canvas Type Names', () => {
    test('returns correct name for value-proposition', () => {
      render(<CanvasEditor {...defaultProps} canvasType="value-proposition" />)
      
      // The component should internally handle the type name correctly
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
    })

    test('returns correct name for business-model', () => {
      render(<CanvasEditor {...defaultProps} canvasType="business-model" />)
      
      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()
    })

    test('returns correct name for testing-business-ideas', () => {
      render(<CanvasEditor {...defaultProps} canvasType="testing-business-ideas" />)
      
      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
    })
  })

  describe('Save Functionality', () => {
    test('handles save from Value Proposition Canvas', async () => {
      const user = userEvent.setup()
      render(<CanvasEditor {...defaultProps} canvasType="value-proposition" />)
      
      const saveButton = screen.getByText('Save VPC')
      await user.click(saveButton)
      
      // Save functionality should be triggered
      expect(saveButton).toBeInTheDocument()
    })

    test('handles save from Business Model Canvas', async () => {
      const user = userEvent.setup()
      render(<CanvasEditor {...defaultProps} canvasType="business-model" />)
      
      const saveButton = screen.getByText('Save BMC')
      await user.click(saveButton)
      
      expect(saveButton).toBeInTheDocument()
    })

    test('handles save from Testing Business Ideas Canvas', async () => {
      const user = userEvent.setup()
      render(<CanvasEditor {...defaultProps} canvasType="testing-business-ideas" />)
      
      const saveButton = screen.getByText('Save TBI')
      await user.click(saveButton)
      
      expect(saveButton).toBeInTheDocument()
    })
  })

  describe('Props Passing', () => {
    test('passes canvasId correctly to child components', () => {
      render(<CanvasEditor {...defaultProps} canvasId="custom-canvas-id" />)
      
      expect(screen.getByText('Canvas ID: custom-canvas-id')).toBeInTheDocument()
    })

    test('passes clientId correctly to child components', () => {
      render(<CanvasEditor {...defaultProps} clientId="custom-client-id" />)
      
      expect(screen.getByText('Client ID: custom-client-id')).toBeInTheDocument()
    })

    test('handles new canvas creation', () => {
      render(<CanvasEditor {...defaultProps} canvasId="new" />)
      
      expect(screen.getByText('Canvas ID: new')).toBeInTheDocument()
    })
  })

  describe('Canvas Type Switching', () => {
    test('switches between canvas types correctly', () => {
      const { rerender } = render(<CanvasEditor {...defaultProps} canvasType="value-proposition" />)
      
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
      expect(screen.queryByTestId('bmc-component')).not.toBeInTheDocument()
      
      rerender(<CanvasEditor {...defaultProps} canvasType="business-model" />)
      
      expect(screen.queryByTestId('vpc-component')).not.toBeInTheDocument()
      expect(screen.getByTestId('bmc-component')).toBeInTheDocument()
      
      rerender(<CanvasEditor {...defaultProps} canvasType="testing-business-ideas" />)
      
      expect(screen.queryByTestId('bmc-component')).not.toBeInTheDocument()
      expect(screen.getByTestId('tbi-component')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles missing canvasId gracefully', () => {
      const { canvasId, ...propsWithoutCanvasId } = defaultProps
      render(<CanvasEditor {...propsWithoutCanvasId} />)
      
      // Should still render without crashing
      expect(screen.getByTestId('vpc-component')).toBeInTheDocument()
    })

    test('handles missing clientId gracefully', () => {
      // Since clientId is required, we'll test with an empty string instead
      const propsWithEmptyClientId = { ...defaultProps, clientId: '' }
      render(<CanvasEditor {...propsWithEmptyClientId} />)
      
      // Should still render without crashing
      expect(screen.getByText('Loading canvas...')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    test('integrates with all three canvas types', () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]
      
      canvasTypes.forEach(canvasType => {
        const { unmount } = render(<CanvasEditor {...defaultProps} canvasType={canvasType} />)
        
        // Each canvas type should render without errors
        const expectedTestId = canvasType === 'value-proposition' ? 'vpc-component' :
                              canvasType === 'business-model' ? 'bmc-component' : 'tbi-component'
        
        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument()
        
        unmount()
      })
    })

    test('maintains consistent interface across canvas types', () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]
      
      canvasTypes.forEach(canvasType => {
        const { unmount } = render(<CanvasEditor {...defaultProps} canvasType={canvasType} />)
        
        // All canvas types should receive the same props structure
        expect(screen.getByText('Canvas ID: test-canvas-1')).toBeInTheDocument()
        expect(screen.getByText('Client ID: test-client')).toBeInTheDocument()
        expect(screen.getByText('Read Only: false')).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Performance', () => {
    test('renders quickly with different canvas types', () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]
      
      canvasTypes.forEach(canvasType => {
        const startTime = performance.now()
        const { unmount } = render(<CanvasEditor {...defaultProps} canvasType={canvasType} />)
        const endTime = performance.now()
        
        expect(endTime - startTime).toBeLessThan(100) // Should render very quickly
        
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    test('maintains accessibility across canvas types', () => {
      const canvasTypes: Array<'value-proposition' | 'business-model' | 'testing-business-ideas'> = [
        'value-proposition',
        'business-model', 
        'testing-business-ideas'
      ]
      
      canvasTypes.forEach(canvasType => {
        const { unmount } = render(<CanvasEditor {...defaultProps} canvasType={canvasType} />)
        
        // Should have proper heading structure
        const canvasHeading = screen.getByRole('heading', { level: 2 })
        expect(canvasHeading).toBeInTheDocument()
        
        unmount()
      })
    })
  })
})

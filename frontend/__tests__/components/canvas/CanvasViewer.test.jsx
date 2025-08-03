/**
 * Canvas Viewer Component Tests
 * 
 * Tests visual display, interactions, export functionality, and theme switching
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import CanvasViewer from '../../../components/canvas/CanvasViewer';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock window.URL for blob downloads
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-blob-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock document.createElement for download links
const mockAnchorElement = {
  href: '',
  download: '',
  click: jest.fn(),
  remove: jest.fn()
};

Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return mockAnchorElement;
    }
    return {};
  })
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn()
});

describe('CanvasViewer Component', () => {
  const mockCanvas = {
    id: 'canvas-123',
    name: 'Test Value Proposition Canvas',
    type: 'valueProposition',
    metadata: {
      qualityScore: 0.85,
      generatedAt: '2024-01-15T10:00:00Z'
    },
    visualAssets: {
      svg: '<svg>test svg content</svg>',
      theme: 'professional'
    }
  };

  const defaultProps = {
    canvas: mockCanvas,
    onEdit: jest.fn(),
    onShare: jest.fn(),
    onExport: jest.fn(),
    interactive: true,
    showControls: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Component Rendering', () => {
    test('renders canvas viewer with basic information', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      expect(screen.getByText('Test Value Proposition Canvas')).toBeInTheDocument();
      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument();
      expect(screen.getByText('Quality Score: 85%')).toBeInTheDocument();
    });

    test('renders different canvas types correctly', () => {
      const businessModelCanvas = {
        ...mockCanvas,
        type: 'businessModel',
        name: 'Test Business Model Canvas'
      };

      render(<CanvasViewer {...defaultProps} canvas={businessModelCanvas} />);
      
      expect(screen.getByText('Business Model Canvas')).toBeInTheDocument();
      expect(screen.getByText('🏢')).toBeInTheDocument();
    });

    test('renders without controls when showControls is false', () => {
      render(<CanvasViewer {...defaultProps} showControls={false} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
    });

    test('renders in non-interactive mode', () => {
      render(<CanvasViewer {...defaultProps} interactive={false} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Share')).not.toBeInTheDocument();
    });
  });

  describe('Visual Content Loading', () => {
    test('loads canvas visual content on mount', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: '<svg>loaded svg content</svg>'
        })
      });

      render(<CanvasViewer {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/canvas/canvas-123/visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: 'professional',
            format: 'svg',
            width: 1200,
            height: 800
          })
        });
      });
    });

    test('displays loading state while fetching visual', () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<CanvasViewer {...defaultProps} />);
      
      expect(screen.getByText('Loading canvas...')).toBeInTheDocument();
    });

    test('handles visual loading error gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<CanvasViewer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No visual content available')).toBeInTheDocument();
      });
    });
  });

  describe('Zoom Controls', () => {
    test('zoom in increases zoom level', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      const zoomDisplay = screen.getByText('100%');
      
      fireEvent.click(zoomInButton);
      
      expect(screen.getByText('125%')).toBeInTheDocument();
    });

    test('zoom out decreases zoom level', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      // First zoom in to have room to zoom out
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      fireEvent.click(zoomInButton);
      
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      fireEvent.click(zoomOutButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('reset zoom returns to 100%', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      // Zoom in first
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomInButton);
      
      // Reset zoom
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    test('zoom controls respect min/max limits', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      
      // Test minimum zoom (25%)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(zoomOutButton);
      }
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(zoomOutButton).toBeDisabled();
      
      // Test maximum zoom (300%)
      for (let i = 0; i < 20; i++) {
        fireEvent.click(zoomInButton);
      }
      expect(screen.getByText('300%')).toBeInTheDocument();
      expect(zoomInButton).toBeDisabled();
    });
  });

  describe('Theme Switching', () => {
    test('changes theme and reloads visual', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: '<svg>themed content</svg>'
        })
      });

      render(<CanvasViewer {...defaultProps} />);

      // Click on theme tab
      const themeTab = screen.getByText('Theme');
      fireEvent.click(themeTab);

      // Select creative theme
      const creativeTheme = screen.getByText('Creative');
      fireEvent.click(creativeTheme);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/canvas/canvas-123/visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: 'creative',
            format: 'svg',
            width: 1200,
            height: 800
          })
        });
      });
    });
  });

  describe('Export Functionality', () => {
    test('exports canvas in different formats', async () => {
      fetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mock pdf content']))
      });

      render(<CanvasViewer {...defaultProps} />);

      // Click export tab
      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);

      // Click PDF export
      const pdfExport = screen.getByText('PDF');
      fireEvent.click(pdfExport);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/canvas/canvas-123/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'pdf' })
        });
      });

      expect(mockAnchorElement.download).toBe('canvas.pdf');
      expect(mockAnchorElement.click).toHaveBeenCalled();
    });

    test('handles export errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Export failed'));

      render(<CanvasViewer {...defaultProps} />);

      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);

      const pngExport = screen.getByText('PNG');
      fireEvent.click(pngExport);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Should show error message (mocked toast)
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Export failed');
    });
  });

  describe('Interactive Actions', () => {
    test('calls onEdit when edit button is clicked', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockCanvas);
    });

    test('calls onShare when share button is clicked', () => {
      render(<CanvasViewer {...defaultProps} />);
      
      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);
      
      expect(defaultProps.onShare).toHaveBeenCalledWith(mockCanvas);
    });

    test('opens fullscreen view', () => {
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(<CanvasViewer {...defaultProps} />);

      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);

      const fullScreenButton = screen.getByText('Full Screen');
      fireEvent.click(fullScreenButton);

      expect(mockOpen).toHaveBeenCalledWith('/canvas/canvas-123/fullscreen', '_blank');
    });
  });

  describe('Canvas Information Display', () => {
    test('displays canvas metadata correctly', () => {
      render(<CanvasViewer {...defaultProps} />);

      const themeTab = screen.getByText('Theme');
      fireEvent.click(themeTab);

      expect(screen.getByText('Value Proposition Canvas')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Number of sections
      expect(screen.getByText('1/15/2024')).toBeInTheDocument(); // Generated date
    });

    test('handles missing metadata gracefully', () => {
      const canvasWithoutMetadata = {
        ...mockCanvas,
        metadata: {}
      };

      render(<CanvasViewer {...defaultProps} canvas={canvasWithoutMetadata} />);

      // Should not crash and should not show quality score
      expect(screen.queryByText(/Quality Score/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for controls', () => {
      render(<CanvasViewer {...defaultProps} />);

      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      render(<CanvasViewer {...defaultProps} />);

      const editButton = screen.getByText('Edit');
      editButton.focus();
      
      fireEvent.keyDown(editButton, { key: 'Enter' });
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockCanvas);
    });
  });
});

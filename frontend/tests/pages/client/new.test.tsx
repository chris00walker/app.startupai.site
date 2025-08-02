import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import NewClientPage from '../new';
import api from '../../../services/api';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

// Mock ClientForm component
jest.mock('../../../components/ClientForm', () => ({
  ClientForm: ({ onSubmit, isLoading }: any) => (
    <div data-testid="client-form">
      <button 
        onClick={() => onSubmit({ name: 'Test Client', email: 'test@example.com' })}
        disabled={isLoading}
        data-testid="submit-button"
      >
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  ),
}));

describe('NewClientPage UX Improvements', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockInvalidateQueries = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    queryClient.invalidateQueries = mockInvalidateQueries;
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewClientPage />
      </QueryClientProvider>
    );
  };

  it('shows progress indicator during client creation', async () => {
    // Mock slow client creation to capture intermediate state
    let resolveClientCreation: (value: any) => void;
    const clientCreationPromise = new Promise((resolve) => {
      resolveClientCreation = resolve;
    });
    mockApi.post.mockReturnValueOnce(clientCreationPromise);

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show progress indicator immediately
    await waitFor(() => {
      expect(screen.getByText('Creating client profile...')).toBeInTheDocument();
    });

    // Resolve the client creation
    resolveClientCreation({ data: { client: { _id: 'test-client-123' } } });
  });

  it('shows workflow triggering status after client creation', async () => {
    // Mock successful client creation first
    let resolveWorkflowTrigger: (value: any) => void;
    const workflowPromise = new Promise((resolve) => {
      resolveWorkflowTrigger = resolve;
    });
    
    mockApi.post
      .mockResolvedValueOnce({ data: { client: { _id: 'test-client-123' } } })
      .mockReturnValueOnce(workflowPromise);

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show workflow triggering status after client creation
    await waitFor(() => {
      expect(screen.getByText('Launching AI discovery workflow...')).toBeInTheDocument();
    });

    // Resolve the workflow trigger
    resolveWorkflowTrigger({ data: { status: 'started' } });
  });

  it('shows success message and redirects after workflow starts', async () => {
    // Mock successful client creation and workflow trigger
    mockApi.post
      .mockResolvedValueOnce({ data: { client: { _id: 'test-client-123' } } })
      .mockResolvedValueOnce({ data: { status: 'started' } });

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Client created and AI analysis started!')).toBeInTheDocument();
    });

    // Should redirect after delay
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/client/test-client-123');
    }, { timeout: 3000 });
  });

  it('handles workflow trigger failure gracefully', async () => {
    // Mock successful client creation but failed workflow trigger
    mockApi.post
      .mockResolvedValueOnce({ data: { client: { _id: 'test-client-123' } } })
      .mockRejectedValueOnce(new Error('Workflow failed'));

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show fallback message
    await waitFor(() => {
      expect(screen.getByText('Client created! You can manually start workflows from the dashboard.')).toBeInTheDocument();
    });

    // Should still redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/client/test-client-123');
    }, { timeout: 3000 });
  });

  it('shows error state when client creation fails', async () => {
    // Mock failed client creation
    mockApi.post.mockRejectedValueOnce(new Error('Creation failed'));

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to create client. Please try again.')).toBeInTheDocument();
    });

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('disables form during processing', async () => {
    // Mock slow client creation
    mockApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderComponent();

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Form should be disabled
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows robot emoji during AI workflow trigger', async () => {
    mockApi.post
      .mockResolvedValueOnce({ data: { client: { _id: 'test-client-123' } } })
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

    renderComponent();

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('🤖 AI agents are analyzing your business requirements...')).toBeInTheDocument();
    });
  });
});

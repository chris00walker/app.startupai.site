import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntakeForm } from '../IntakeForm';
import api from '../../../services/api';

// Mock the API
jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('IntakeForm Component', () => {
  const mockClientId = 'test-client-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step Navigation', () => {
    it('should render the first step (Personal Information) by default', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    });

    it('should navigate to next step when Next button is clicked', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Fill in name to enable Next button
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      
      // Click Next
      fireEvent.click(screen.getByText('Next'));
      
      // Should be on step 2
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('should navigate back to previous step when Back button is clicked', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Navigate to step 2
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      // Navigate back
      fireEvent.click(screen.getByText('Back'));
      
      // Should be back on step 1
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable Next button when required field is empty', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when required field is filled', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable Submit button when any required field is missing', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Navigate to final step
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      // Submit should be disabled without project description
      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with correct data when all fields are filled', async () => {
      mockedApi.post.mockResolvedValue({ data: { success: true } });
      
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Fill all steps
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Project Description'), {
        target: { value: 'Test project description' }
      });
      
      // Submit
      fireEvent.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          `/clients/${mockClientId}/discovery`,
          {
            name: 'John Doe',
            email: 'john@example.com',
            projectDescription: 'Test project description'
          }
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Mock API with a delayed promise to test loading state
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedApi.post.mockReturnValue(delayedPromise);
      
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Navigate through all steps
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Email Address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Project Description'), {
        target: { value: 'Test project' }
      });
      
      fireEvent.click(screen.getByText('Submit'));
      
      // Should show loading state after clicking submit
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
      
      // Resolve the promise to complete the test
      resolvePromise!({ data: { success: true } });
      
      // Wait for the loading state to complete
      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator', () => {
    it('should show correct progress for each step', () => {
      renderWithQueryClient(<IntakeForm clientId={mockClientId} />);
      
      // Step 1 - first indicator should be active
      const progressBars = screen.getAllByRole('generic').filter(el => 
        el.className.includes('h-2') && el.className.includes('rounded-full')
      );
      
      expect(progressBars[0]).toHaveClass('bg-primary');
      expect(progressBars[1]).toHaveClass('bg-muted');
      expect(progressBars[2]).toHaveClass('bg-muted');
    });
  });
});

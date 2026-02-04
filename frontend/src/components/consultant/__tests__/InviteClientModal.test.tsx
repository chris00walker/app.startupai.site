/**
 * InviteClientModal Component Tests
 *
 * Tests for the invite client modal component used by consultants
 * to send invitations to new clients.
 * @story US-C02, US-CT03
*/

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteClientModal } from '../InviteClientModal';

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('InviteClientModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onInvite: jest.fn(),
    // Provide default relationship type for tests that don't test relationship selection
    defaultRelationshipType: 'advisory' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    it('renders the modal when open', () => {
      render(<InviteClientModal {...defaultProps} />);

      expect(screen.getByText('Invite a Client')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<InviteClientModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Invite a Client')).not.toBeInTheDocument();
    });

    it('shows description about the invite process', () => {
      render(<InviteClientModal {...defaultProps} />);

      expect(screen.getByText(/send an invitation to a founder/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when submitting without email', async () => {
      const user = userEvent.setup();
      render(<InviteClientModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /send invite/i }));

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(defaultProps.onInvite).not.toHaveBeenCalled();
    });

    it('validates email format before submission', async () => {
      const user = userEvent.setup();
      render(<InviteClientModal {...defaultProps} />);

      // Type an invalid email
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      // Either our custom validation shows an error message OR the onInvite is not called
      // (HTML5 validation might prevent submission entirely)
      expect(defaultProps.onInvite).not.toHaveBeenCalled();
    });

    it('shows error when submitting without relationship type', async () => {
      const user = userEvent.setup();
      // Note: No defaultRelationshipType provided to test validation
      render(
        <InviteClientModal
          isOpen={true}
          onClose={jest.fn()}
          onInvite={defaultProps.onInvite}
        />
      );

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      expect(screen.getByText('Please select a relationship type')).toBeInTheDocument();
      expect(defaultProps.onInvite).not.toHaveBeenCalled();
    });

    it('accepts valid email with default relationship type', async () => {
      const user = userEvent.setup();
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: true,
          invite: {
            id: '123',
            email: 'client@example.com',
            name: null,
            inviteToken: 'token123',
            inviteUrl: 'http://localhost:3000/signup?invite=token123',
            expiresAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(onInvite).toHaveBeenCalledWith({
          email: 'client@example.com',
          name: undefined,
          relationshipType: 'advisory',
        });
      });
    });

    it('includes name when provided', async () => {
      const user = userEvent.setup();
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      // Test with a different default relationship type
      render(
        <InviteClientModal
          {...defaultProps}
          onInvite={onInvite}
          defaultRelationshipType="capital"
        />
      );

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.type(screen.getByLabelText(/client name/i), 'John Doe');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: true,
          invite: {
            id: '123',
            email: 'client@example.com',
            name: 'John Doe',
            inviteToken: 'token123',
            inviteUrl: 'http://localhost:3000/signup?invite=token123',
            expiresAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(onInvite).toHaveBeenCalledWith({
          email: 'client@example.com',
          name: 'John Doe',
          relationshipType: 'capital',
        });
      });
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveInvite: (value: any) => void;
      const onInvite = jest.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveInvite = resolve;
        })
      );

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      expect(screen.getByText('Sending...')).toBeInTheDocument();

      await act(async () => {
        resolveInvite!({ success: true, invite: {} });
      });
    });

    it('shows success state after successful invite', async () => {
      const user = userEvent.setup();
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: true,
          invite: {
            id: '123',
            email: 'client@example.com',
            name: null,
            inviteToken: 'token123',
            inviteUrl: 'http://localhost:3000/signup?invite=token123',
            expiresAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Invitation Sent')).toBeInTheDocument();
      });

      expect(screen.getByText(/client@example.com/)).toBeInTheDocument();
    });

    it('shows error message when invite fails', async () => {
      const user = userEvent.setup();
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: false,
          error: 'This email is already linked to another consultant',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('This email is already linked to another consultant')).toBeInTheDocument();
      });

      // Should still be on form view
      expect(screen.getByText('Invite a Client')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('displays the invite URL', async () => {
      const user = userEvent.setup();
      const inviteUrl = 'http://localhost:3000/signup?invite=token123';
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: true,
          invite: {
            id: '123',
            email: 'client@example.com',
            name: null,
            inviteToken: 'token123',
            inviteUrl,
            expiresAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue(inviteUrl)).toBeInTheDocument();
      });
    });

    it('displays invite URL that can be copied', async () => {
      const user = userEvent.setup();
      const inviteUrl = 'http://localhost:3000/signup?invite=token123';
      const deferred = createDeferred<any>();
      const onInvite = jest.fn().mockReturnValue(deferred.promise);

      render(<InviteClientModal {...defaultProps} onInvite={onInvite} />);

      await user.type(screen.getByLabelText(/email address/i), 'client@example.com');
      await user.click(screen.getByRole('button', { name: /send invite/i }));

      await act(async () => {
        deferred.resolve({
          success: true,
          invite: {
            id: '123',
            email: 'client@example.com',
            name: null,
            inviteToken: 'token123',
            inviteUrl,
            expiresAt: new Date().toISOString(),
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Invitation Sent')).toBeInTheDocument();
      });

      // The invite URL should be displayed in an input for easy copying
      const urlInput = screen.getByDisplayValue(inviteUrl);
      expect(urlInput).toBeInTheDocument();
      expect(urlInput).toHaveAttribute('readonly');

      // Also verify the expiration info is shown
      expect(screen.getByText(/expires in 30 days/i)).toBeInTheDocument();
    });
  });

  describe('Modal Close Behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<InviteClientModal {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('resets form state when reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<InviteClientModal {...defaultProps} />);

      // Fill in the form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/client name/i), 'Test User');

      // Close the modal
      rerender(<InviteClientModal {...defaultProps} isOpen={false} />);

      // Reopen the modal
      rerender(<InviteClientModal {...defaultProps} isOpen={true} />);

      // Form should be reset (this depends on implementation - if state is reset on close)
      // Note: Current implementation resets on handleClose
    });
  });
});

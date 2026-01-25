'use client';

/**
 * Impersonation Context
 *
 * Provides impersonation state and controls for admin users.
 * Enables "view as user" functionality with read-only restrictions.
 *
 * @story US-A03
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

interface ImpersonatedUser {
  id: string;
  email: string;
  role: string;
}

interface ImpersonationSession {
  id: string;
  targetUser: ImpersonatedUser;
  reason: string;
  expiresAt: string;
  createdAt: string;
}

interface ImpersonationContextValue {
  /** Whether impersonation is currently active */
  isImpersonating: boolean;
  /** The currently impersonated user (if any) */
  impersonatedUser: ImpersonatedUser | null;
  /** Full session details */
  session: ImpersonationSession | null;
  /** Whether we're loading impersonation state */
  isLoading: boolean;
  /** Start impersonating a user */
  startImpersonation: (userId: string, reason: string) => Promise<boolean>;
  /** End the current impersonation session */
  endImpersonation: () => Promise<boolean>;
  /** Refresh impersonation status */
  refreshStatus: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/_/impersonate');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.active) {
          setIsImpersonating(true);
          setImpersonatedUser(data.data.session.targetUser);
          setSession(data.data.session);
        } else {
          setIsImpersonating(false);
          setImpersonatedUser(null);
          setSession(null);
        }
      }
    } catch (error) {
      console.error('[ImpersonationContext] Failed to check status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    // Set up periodic refresh to handle expiration
    const interval = setInterval(refreshStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const startImpersonation = useCallback(async (userId: string, reason: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        setIsImpersonating(true);
        setImpersonatedUser(data.data.targetUser);
        setSession({
          id: 'active',
          targetUser: data.data.targetUser,
          reason,
          expiresAt: data.data.expiresAt,
          createdAt: new Date().toISOString(),
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ImpersonationContext] Failed to start impersonation:', error);
      return false;
    }
  }, []);

  const endImpersonation = useCallback(async (): Promise<boolean> => {
    if (!impersonatedUser) return false;

    try {
      const response = await fetch(`/api/admin/users/${impersonatedUser.id}/impersonate`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setIsImpersonating(false);
        setImpersonatedUser(null);
        setSession(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ImpersonationContext] Failed to end impersonation:', error);
      return false;
    }
  }, [impersonatedUser]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        session,
        isLoading,
        startImpersonation,
        endImpersonation,
        refreshStatus,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonationContext() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonationContext must be used within ImpersonationProvider');
  }
  return context;
}

// Export hook alias for convenience
export { useImpersonationContext as useImpersonation };

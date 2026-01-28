/**
 * @story US-AU01, US-AU02
 */
/**
 * Authentication Hooks (Client-Side)
 *
 * React hooks for authentication state in Client Components.
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { UserRole } from '@/db/schema';
import {
  deriveRole,
  isTrialReadonly,
  canAccessConsultantExperience,
  canAccessFounderExperience,
} from './roles';

/**
 * Hook to get current user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}

/**
 * Hook to get current session
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { session, loading };
}

/**
 * Hook for authentication state
 */
export function useAuth() {
  const { user, loading: userLoading } = useUser();
  const { session, loading: sessionLoading } = useSession();

  return {
    user,
    session,
    loading: userLoading || sessionLoading,
    isAuthenticated: !!user,
  };
}

type RoleInfoState = {
  loading: boolean;
  role: UserRole | null;
  planStatus: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function useRoleInfo() {
  const supabase = createClient();
  const [state, setState] = useState<RoleInfoState>({
    loading: true,
    role: null,
    planStatus: null,
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    let isMounted = true;

    const resolveRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setState({
            loading: false,
            role: null,
            planStatus: null,
            isAuthenticated: false,
            userId: null,
          });
        }
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, plan_status, subscription_status')
        .eq('id', user.id)
        .maybeSingle();

      const role = deriveRole({
        profileRole: (profile?.role as string | null) ?? null,
        appRole: (user.app_metadata?.role as string | null) ?? null,
      });

      const planStatus =
        (profile?.plan_status as string | null) ??
        (profile?.subscription_status as string | null) ??
        null;

      if (isMounted) {
        setState({
          loading: false,
          role,
          planStatus,
          isAuthenticated: true,
          userId: user.id,
        });
      }
    };

    resolveRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      resolveRole();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const canConsultant = canAccessConsultantExperience(state.role ?? undefined);
  const canFounder = canAccessFounderExperience(state.role ?? undefined);
  const trialReadonly = isTrialReadonly(state.planStatus);

  return {
    ...state,
    canAccessConsultant: canConsultant,
    canAccessFounder: canFounder,
    trialReadonly,
    isTrial: state.role === 'founder_trial' || state.role === 'consultant_trial',
  };
}

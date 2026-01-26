import type { UserRole } from '@/db/schema';

type PlanStatus = 'active' | 'trialing' | 'paused' | 'canceled' | string;

type RedirectOptions = {
  role?: UserRole | null;
  planStatus?: PlanStatus | null;
  next?: string | null;
};

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/admin',
  consultant: '/consultant-dashboard',
  founder: '/founder-dashboard',
  founder_trial: '/onboarding/founder',
  consultant_trial: '/onboarding/consultant'
};

export function getRedirectForRole({ role, planStatus, next }: RedirectOptions): string {
  const safeNext = sanitizePath(next);
  if (safeNext) {
    return safeNext;
  }

  const resolvedRole: UserRole = (role ?? 'founder_trial') as UserRole;

  // Trial users get redirected to onboarding
  if ((resolvedRole === 'founder_trial' || resolvedRole === 'consultant_trial') && isTrialReadonly(planStatus)) {
    return ROLE_REDIRECTS[resolvedRole];
  }

  return ROLE_REDIRECTS[resolvedRole] ?? '/dashboard';
}

export function isTrialReadonly(planStatus?: PlanStatus | null): boolean {
  return !planStatus || planStatus === 'trialing';
}

export function canAccessFounderExperience(role?: UserRole | null): boolean {
  return role === 'founder' || role === 'founder_trial' || role === 'admin';
}

export function canAccessConsultantExperience(role?: UserRole | null): boolean {
  return role === 'consultant' || role === 'consultant_trial' || role === 'admin';
}

export function deriveRole({
  profileRole,
  appRole,
}: {
  profileRole?: string | null;
  appRole?: string | null;
}): UserRole {
  const candidate = (profileRole ?? appRole ?? 'founder_trial') as UserRole;
  if (['admin', 'founder', 'consultant', 'founder_trial', 'consultant_trial'].includes(candidate)) {
    return candidate;
  }
  return 'founder_trial';
}

export function sanitizePath(path?: string | null): string | null {
  if (!path) {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      return url.pathname + url.search + url.hash;
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith('//')) {
    return null;
  }

  if (!trimmed.startsWith('/')) {
    return null;
  }

  return trimmed || null;
}

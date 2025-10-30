import type { UserRole } from '@/db/schema';

type PlanStatus = 'active' | 'trialing' | 'paused' | 'canceled' | string;

type RedirectOptions = {
  role?: UserRole | null;
  planStatus?: PlanStatus | null;
  next?: string | null;
};

const ROLE_REDIRECTS: Record<UserRole, string> = {
  admin: '/onboarding',
  consultant: '/onboarding',
  founder: '/onboarding',
  trial: '/onboarding'
};

export function getRedirectForRole({ role, planStatus, next }: RedirectOptions): string {
  const safeNext = sanitizePath(next);
  if (safeNext) {
    return safeNext;
  }

  const resolvedRole: UserRole = (role ?? 'trial') as UserRole;

  if (resolvedRole === 'trial' && isTrialReadonly(planStatus)) {
    return ROLE_REDIRECTS.trial;
  }

  return ROLE_REDIRECTS[resolvedRole] ?? '/dashboard';
}

export function isTrialReadonly(planStatus?: PlanStatus | null): boolean {
  return !planStatus || planStatus === 'trialing';
}

export function canAccessFounderExperience(role?: UserRole | null): boolean {
  return role === 'founder' || role === 'admin';
}

export function canAccessConsultantExperience(role?: UserRole | null): boolean {
  return role === 'consultant' || role === 'admin';
}

export function deriveRole({
  profileRole,
  appRole,
}: {
  profileRole?: string | null;
  appRole?: string | null;
}): UserRole {
  const candidate = (profileRole ?? appRole ?? 'trial') as UserRole;
  if (['admin', 'founder', 'consultant', 'trial'].includes(candidate)) {
    return candidate;
  }
  return 'trial';
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

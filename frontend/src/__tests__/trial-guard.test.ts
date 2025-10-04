import { assertTrialAllowance } from '@/lib/auth/trial-guard';

const mockGetUserProfile = jest.fn();
const mockFindTrialUsageCounter = jest.fn();
const mockUpsertTrialUsageCounter = jest.fn();

jest.mock('@/db/queries/users', () => ({
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
}));

jest.mock('@/db/repositories/trialUsage', () => ({
  findTrialUsageCounter: (...args: unknown[]) => mockFindTrialUsageCounter(...args),
  upsertTrialUsageCounter: (...args: unknown[]) => mockUpsertTrialUsageCounter(...args),
}));

describe('assertTrialAllowance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows non-trial users without touching counters', async () => {
    mockGetUserProfile.mockResolvedValue({
      id: 'user-1',
      role: 'founder',
      planStatus: 'active',
      subscriptionStatus: 'active',
    });

    const result = await assertTrialAllowance({ userId: 'user-1', action: 'projects.create' });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Number.POSITIVE_INFINITY);
    expect(mockFindTrialUsageCounter).not.toHaveBeenCalled();
    expect(mockUpsertTrialUsageCounter).not.toHaveBeenCalled();
  });

  it('allows unknown actions by default', async () => {
    mockGetUserProfile.mockResolvedValue({ id: 'user-2', role: 'trial', planStatus: 'trial', subscriptionStatus: 'trial' });

    const result = await assertTrialAllowance({ userId: 'user-2', action: 'unknown.action' });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Number.POSITIVE_INFINITY);
    expect(mockFindTrialUsageCounter).not.toHaveBeenCalled();
  });

  it('increments usage when under the limit', async () => {
    mockGetUserProfile.mockResolvedValue({ id: 'user-3', role: 'trial', planStatus: 'trial', subscriptionStatus: 'trial' });
    mockFindTrialUsageCounter.mockResolvedValue({ count: 1 });

    const now = new Date('2025-10-04T12:00:00Z');
    const result = await assertTrialAllowance({ userId: 'user-3', action: 'projects.create', now });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1); // limit 3 -> current 1 -> remaining 1 after increment
    expect(mockUpsertTrialUsageCounter).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-3',
        action: 'projects.create',
        count: 2,
        now,
      })
    );
  });

  it('blocks when limit exhausted', async () => {
    mockGetUserProfile.mockResolvedValue({ id: 'user-4', role: 'trial', planStatus: 'trial', subscriptionStatus: 'trial' });
    mockFindTrialUsageCounter.mockResolvedValue({ count: 3 });

    const result = await assertTrialAllowance({ userId: 'user-4', action: 'projects.create' });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(mockUpsertTrialUsageCounter).not.toHaveBeenCalled();
  });
});

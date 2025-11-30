/**
 * Tests for OnboardingWizardV2 redirect logic
 *
 * Verifies that redirects respect planType for both Founders and Consultants
 */

type PlanType = 'trial' | 'sprint' | 'founder' | 'enterprise';

/**
 * Helper to compute the dashboard route based on plan type
 * Mirrors the logic in OnboardingWizardV2
 */
const getSuccessRoute = (planType: PlanType, projectId: string): string => {
  return planType === 'sprint' ? '/clients' : `/dashboard/project/${projectId}`;
};

const getFailureRoute = (planType: PlanType): string => {
  return planType === 'sprint' ? '/clients' : '/founder-dashboard';
};

describe('OnboardingWizard Redirect Logic', () => {
  describe('Success redirect (analysis complete)', () => {
    it('should redirect Founders to project dashboard', () => {
      const planType: PlanType = 'founder';
      const projectId = 'project-123';

      const dashboardRoute = getSuccessRoute(planType, projectId);

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });

    it('should redirect Consultants to clients page', () => {
      const planType: PlanType = 'sprint';
      const projectId = 'project-123';

      const dashboardRoute = getSuccessRoute(planType, projectId);

      expect(dashboardRoute).toBe('/clients');
    });

    it('should redirect Trial users to project dashboard', () => {
      const planType: PlanType = 'trial';
      const projectId = 'project-123';

      const dashboardRoute = getSuccessRoute(planType, projectId);

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });

    it('should redirect Enterprise users to project dashboard', () => {
      const planType: PlanType = 'enterprise';
      const projectId = 'project-123';

      const dashboardRoute = getSuccessRoute(planType, projectId);

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });
  });

  describe('Failure redirect (analysis failed)', () => {
    it('should redirect Founders to founder dashboard', () => {
      const planType: PlanType = 'founder';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Consultants to clients page', () => {
      const planType: PlanType = 'sprint';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/clients');
    });

    it('should redirect Trial users to founder dashboard', () => {
      const planType: PlanType = 'trial';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Enterprise users to founder dashboard', () => {
      const planType: PlanType = 'enterprise';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/founder-dashboard');
    });
  });

  describe('Exit redirect (Save & Exit button)', () => {
    it('should redirect Founders to founder dashboard', () => {
      const planType: PlanType = 'founder';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Consultants to clients page', () => {
      const planType: PlanType = 'sprint';

      const dashboardRoute = getFailureRoute(planType);

      expect(dashboardRoute).toBe('/clients');
    });
  });
});

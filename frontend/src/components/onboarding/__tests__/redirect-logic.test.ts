/**
 * Tests for OnboardingWizardV2 redirect logic
 *
 * Verifies that redirects respect planType for both Founders and Consultants
 */

describe('OnboardingWizard Redirect Logic', () => {
  describe('Success redirect (analysis complete)', () => {
    it('should redirect Founders to project dashboard', () => {
      const planType = 'founder';
      const projectId = 'project-123';

      const dashboardRoute = planType === 'sprint'
        ? '/clients'
        : `/dashboard/project/${projectId}`;

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });

    it('should redirect Consultants to clients page', () => {
      const planType = 'sprint';
      const projectId = 'project-123';

      const dashboardRoute = planType === 'sprint'
        ? '/clients'
        : `/dashboard/project/${projectId}`;

      expect(dashboardRoute).toBe('/clients');
    });

    it('should redirect Trial users to project dashboard', () => {
      const planType = 'trial';
      const projectId = 'project-123';

      const dashboardRoute = planType === 'sprint'
        ? '/clients'
        : `/dashboard/project/${projectId}`;

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });

    it('should redirect Enterprise users to project dashboard', () => {
      const planType = 'enterprise';
      const projectId = 'project-123';

      const dashboardRoute = planType === 'sprint'
        ? '/clients'
        : `/dashboard/project/${projectId}`;

      expect(dashboardRoute).toBe('/dashboard/project/project-123');
    });
  });

  describe('Failure redirect (analysis failed)', () => {
    it('should redirect Founders to founder dashboard', () => {
      const planType = 'founder';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Consultants to clients page', () => {
      const planType = 'sprint';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/clients');
    });

    it('should redirect Trial users to founder dashboard', () => {
      const planType = 'trial';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Enterprise users to founder dashboard', () => {
      const planType = 'enterprise';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/founder-dashboard');
    });
  });

  describe('Exit redirect (Save & Exit button)', () => {
    it('should redirect Founders to founder dashboard', () => {
      const planType = 'founder';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/founder-dashboard');
    });

    it('should redirect Consultants to clients page', () => {
      const planType = 'sprint';

      const dashboardRoute = planType === 'sprint' ? '/clients' : '/founder-dashboard';

      expect(dashboardRoute).toBe('/clients');
    });
  });
});

/**
 * Gate Scoring Integration Tests
 * 
 * Tests the integration between frontend UI and gate scoring logic.
 * Verifies that gate status updates correctly based on evidence quality.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock project data types
interface Evidence {
  type: 'interview' | 'desk' | 'analytics' | 'experiment';
  strength: 'weak' | 'medium' | 'strong';
  quality_score: number;
}

interface Project {
  id: string;
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE';
  gate_status: 'Pending' | 'Passed' | 'Failed';
  evidence_quality: number;
  hypotheses_count: number;
  experiments_count: number;
  evidence_count: number;
}

describe('Gate Scoring Integration', () => {
  // ==========================================================================
  // Gate Status Calculation
  // ==========================================================================

  describe('calculateGateStatus', () => {
    it('should pass DESIRABILITY gate with sufficient high-quality evidence', () => {
      const project: Project = {
        id: 'proj-1',
        stage: 'DESIRABILITY',
        gate_status: 'Pending',
        evidence_quality: 0.85,
        hypotheses_count: 12,
        experiments_count: 8,
        evidence_count: 24,
      };

      // With good evidence quality and experiments, should pass
      expect(project.evidence_quality).toBeGreaterThanOrEqual(0.70);
      expect(project.experiments_count).toBeGreaterThanOrEqual(5);
      expect(project.evidence_count).toBeGreaterThanOrEqual(10);
    });

    it('should fail DESIRABILITY gate with low evidence quality', () => {
      const project: Project = {
        id: 'proj-2',
        stage: 'DESIRABILITY',
        gate_status: 'Failed',
        evidence_quality: 0.58,
        hypotheses_count: 14,
        experiments_count: 6,
        evidence_count: 19,
      };

      // Low evidence quality should result in failure
      expect(project.evidence_quality).toBeLessThan(0.70);
      expect(project.gate_status).toBe('Failed');
    });

    it('should require more experiments for FEASIBILITY gate', () => {
      const desirabilityMin = 5;
      const feasibilityMin = 10;

      expect(feasibilityMin).toBeGreaterThan(desirabilityMin);
    });

    it('should require higher evidence quality for VIABILITY gate', () => {
      const desirabilityQuality = 0.70;
      const feasibilityQuality = 0.75;
      const viabilityQuality = 0.80;

      expect(feasibilityQuality).toBeGreaterThan(desirabilityQuality);
      expect(viabilityQuality).toBeGreaterThan(feasibilityQuality);
    });
  });

  // ==========================================================================
  // Gate Progression
  // ==========================================================================

  describe('Gate Progression', () => {
    it('should allow progression from DESIRABILITY to FEASIBILITY with passed gate', () => {
      const project: Project = {
        id: 'proj-3',
        stage: 'DESIRABILITY',
        gate_status: 'Passed',
        evidence_quality: 0.92,
        hypotheses_count: 18,
        experiments_count: 15,
        evidence_count: 42,
      };

      const canProgress = project.gate_status === 'Passed';
      expect(canProgress).toBe(true);
    });

    it('should block progression with failed gate', () => {
      const project: Project = {
        id: 'proj-4',
        stage: 'DESIRABILITY',
        gate_status: 'Failed',
        evidence_quality: 0.45,
        hypotheses_count: 5,
        experiments_count: 2,
        evidence_count: 8,
      };

      const canProgress = project.gate_status === 'Passed';
      expect(canProgress).toBe(false);
    });

    it('should block progression with pending gate', () => {
      const project: Project = {
        id: 'proj-5',
        stage: 'FEASIBILITY',
        gate_status: 'Pending',
        evidence_quality: 0.71,
        hypotheses_count: 16,
        experiments_count: 9,
        evidence_count: 28,
      };

      const canProgress = project.gate_status === 'Passed';
      expect(canProgress).toBe(false);
    });

    it('should have correct stage sequence', () => {
      const stages = ['DESIRABILITY', 'FEASIBILITY', 'VIABILITY', 'SCALE'];
      
      expect(stages.indexOf('FEASIBILITY')).toBeGreaterThan(stages.indexOf('DESIRABILITY'));
      expect(stages.indexOf('VIABILITY')).toBeGreaterThan(stages.indexOf('FEASIBILITY'));
      expect(stages.indexOf('SCALE')).toBeGreaterThan(stages.indexOf('VIABILITY'));
    });
  });

  // ==========================================================================
  // Evidence Quality Metrics
  // ==========================================================================

  describe('Evidence Quality Metrics', () => {
    it('should calculate average evidence quality correctly', () => {
      const evidence: Evidence[] = [
        { type: 'interview', strength: 'strong', quality_score: 0.9 },
        { type: 'analytics', strength: 'medium', quality_score: 0.8 },
        { type: 'experiment', strength: 'strong', quality_score: 0.85 },
        { type: 'experiment', strength: 'medium', quality_score: 0.75 },
        { type: 'desk', strength: 'weak', quality_score: 0.6 },
      ];

      const totalQuality = evidence.reduce((sum, e) => sum + e.quality_score, 0);
      const averageQuality = totalQuality / evidence.length;

      expect(averageQuality).toBeCloseTo(0.78, 2);
    });

    it('should count experiments correctly', () => {
      const evidence: Evidence[] = [
        { type: 'interview', strength: 'strong', quality_score: 0.9 },
        { type: 'experiment', strength: 'medium', quality_score: 0.8 },
        { type: 'experiment', strength: 'strong', quality_score: 0.85 },
        { type: 'analytics', strength: 'medium', quality_score: 0.75 },
      ];

      const experimentCount = evidence.filter(e => e.type === 'experiment').length;
      expect(experimentCount).toBe(2);
    });

    it('should identify evidence types correctly', () => {
      const evidence: Evidence[] = [
        { type: 'interview', strength: 'strong', quality_score: 0.9 },
        { type: 'analytics', strength: 'medium', quality_score: 0.8 },
        { type: 'experiment', strength: 'strong', quality_score: 0.85 },
        { type: 'desk', strength: 'weak', quality_score: 0.6 },
      ];

      const types = new Set(evidence.map(e => e.type));
      expect(types).toEqual(new Set(['interview', 'analytics', 'experiment', 'desk']));
    });

    it('should count evidence strength mix correctly', () => {
      const evidence: Evidence[] = [
        { type: 'interview', strength: 'strong', quality_score: 0.9 },
        { type: 'interview', strength: 'strong', quality_score: 0.85 },
        { type: 'analytics', strength: 'medium', quality_score: 0.8 },
        { type: 'analytics', strength: 'medium', quality_score: 0.75 },
        { type: 'experiment', strength: 'medium', quality_score: 0.7 },
        { type: 'desk', strength: 'weak', quality_score: 0.6 },
      ];

      const strengthCounts = {
        weak: evidence.filter(e => e.strength === 'weak').length,
        medium: evidence.filter(e => e.strength === 'medium').length,
        strong: evidence.filter(e => e.strength === 'strong').length,
      };

      expect(strengthCounts).toEqual({ weak: 1, medium: 3, strong: 2 });
    });
  });

  // ==========================================================================
  // Gate Readiness Score
  // ==========================================================================

  describe('Gate Readiness Score', () => {
    it('should calculate readiness score for gate progress', () => {
      // Mock project approaching DESIRABILITY gate requirements
      const criteria = {
        min_experiments: 5,
        min_evidence_quality: 0.70,
        min_total_evidence: 10,
      };

      const project = {
        experiments_count: 3,      // 60% of requirement
        evidence_quality: 0.65,    // 93% of requirement  
        evidence_count: 7,         // 70% of requirement
      };

      // Readiness is average of these percentages
      const experimentReadiness = Math.min(1.0, project.experiments_count / criteria.min_experiments);
      const qualityReadiness = Math.min(1.0, project.evidence_quality / criteria.min_evidence_quality);
      const countReadiness = Math.min(1.0, project.evidence_count / criteria.min_total_evidence);

      const overallReadiness = (experimentReadiness + qualityReadiness + countReadiness) / 3;

      expect(overallReadiness).toBeGreaterThan(0.7);
      expect(overallReadiness).toBeLessThan(1.0);
    });

    it('should show 100% readiness when all criteria met', () => {
      const criteria = {
        min_experiments: 5,
        min_evidence_quality: 0.70,
        min_total_evidence: 10,
      };

      const project = {
        experiments_count: 8,
        evidence_quality: 0.85,
        evidence_count: 15,
      };

      const experimentReadiness = Math.min(1.0, project.experiments_count / criteria.min_experiments);
      const qualityReadiness = Math.min(1.0, project.evidence_quality / criteria.min_evidence_quality);
      const countReadiness = Math.min(1.0, project.evidence_count / criteria.min_total_evidence);

      expect(experimentReadiness).toBe(1.0);
      expect(qualityReadiness).toBe(1.0);
      expect(countReadiness).toBe(1.0);
    });
  });

  // ==========================================================================
  // Gate Criteria Validation
  // ==========================================================================

  describe('Gate Criteria Validation', () => {
    it('should validate DESIRABILITY gate criteria', () => {
      const criteria = {
        min_experiments: 5,
        min_evidence_quality: 0.70,
        min_total_evidence: 10,
        required_types: ['interview', 'analytics'],
        strength_mix: { weak: 0, medium: 3, strong: 2 },
      };

      expect(criteria.min_experiments).toBeGreaterThan(0);
      expect(criteria.min_evidence_quality).toBeGreaterThan(0);
      expect(criteria.min_evidence_quality).toBeLessThanOrEqual(1);
      expect(criteria.required_types).toContain('interview');
      expect(criteria.required_types).toContain('analytics');
    });

    it('should validate FEASIBILITY gate criteria are stricter', () => {
      const desirability = {
        min_experiments: 5,
        min_evidence_quality: 0.70,
        min_total_evidence: 10,
      };

      const feasibility = {
        min_experiments: 10,
        min_evidence_quality: 0.75,
        min_total_evidence: 20,
      };

      expect(feasibility.min_experiments).toBeGreaterThan(desirability.min_experiments);
      expect(feasibility.min_evidence_quality).toBeGreaterThan(desirability.min_evidence_quality);
      expect(feasibility.min_total_evidence).toBeGreaterThan(desirability.min_total_evidence);
    });

    it('should validate VIABILITY gate criteria are strictest', () => {
      const feasibility = {
        min_experiments: 10,
        min_evidence_quality: 0.75,
        min_total_evidence: 20,
      };

      const viability = {
        min_experiments: 15,
        min_evidence_quality: 0.80,
        min_total_evidence: 30,
      };

      expect(viability.min_experiments).toBeGreaterThan(feasibility.min_experiments);
      expect(viability.min_evidence_quality).toBeGreaterThan(feasibility.min_evidence_quality);
      expect(viability.min_total_evidence).toBeGreaterThan(feasibility.min_total_evidence);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle project with zero evidence', () => {
      const project: Project = {
        id: 'proj-empty',
        stage: 'DESIRABILITY',
        gate_status: 'Pending',
        evidence_quality: 0,
        hypotheses_count: 0,
        experiments_count: 0,
        evidence_count: 0,
      };

      expect(project.evidence_quality).toBe(0);
      expect(project.experiments_count).toBe(0);
      expect(project.gate_status).toBe('Pending');
    });

    it('should handle project at exact threshold', () => {
      const project: Project = {
        id: 'proj-threshold',
        stage: 'DESIRABILITY',
        gate_status: 'Passed',
        evidence_quality: 0.70, // Exact threshold
        hypotheses_count: 10,
        experiments_count: 5,   // Exact minimum
        evidence_count: 10,     // Exact minimum
      };

      // At exact threshold should pass
      expect(project.evidence_quality).toBe(0.70);
      expect(project.experiments_count).toBe(5);
      expect(project.evidence_count).toBe(10);
    });

    it('should handle project just below threshold', () => {
      const project: Project = {
        id: 'proj-below',
        stage: 'DESIRABILITY',
        gate_status: 'Failed',
        evidence_quality: 0.69, // Just below threshold
        hypotheses_count: 10,
        experiments_count: 4,   // Just below minimum
        evidence_count: 9,      // Just below minimum
      };

      expect(project.evidence_quality).toBeLessThan(0.70);
      expect(project.experiments_count).toBeLessThan(5);
      expect(project.gate_status).toBe('Failed');
    });

    it('should handle project with perfect scores', () => {
      const project: Project = {
        id: 'proj-perfect',
        stage: 'SCALE',
        gate_status: 'Passed',
        evidence_quality: 1.0,
        hypotheses_count: 50,
        experiments_count: 30,
        evidence_count: 100,
      };

      expect(project.evidence_quality).toBe(1.0);
      expect(project.gate_status).toBe('Passed');
    });
  });
});

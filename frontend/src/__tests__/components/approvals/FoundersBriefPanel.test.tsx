/**
 * FoundersBriefPanel Unit Tests
 *
 * Tests the read-only brief display panel for approval modals.
 * @story US-AH01
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FoundersBriefPanel } from '@/components/approvals/FoundersBriefPanel';
import type { ModalFoundersBrief } from '@/types/crewai';

const fullBrief: ModalFoundersBrief = {
  version: 1,
  the_idea: {
    one_liner: 'AI-powered marketplace for local artisans',
    description: 'A platform connecting local artisans with consumers',
    inspiration: 'Farmers markets are limited by geography',
    unique_insight: 'Artisans lack digital skills but have amazing products',
  },
  problem_hypothesis: {
    problem_statement: 'Artisans cannot reach customers beyond their local market',
    who_has_this_problem: 'Independent craftspeople and small producers',
    frequency: 'Daily',
    current_alternatives: 'Etsy, local farmers markets, social media',
    why_alternatives_fail: 'Etsy is oversaturated, markets are geographically limited',
    evidence_of_problem: 'Interviews with 20 local artisans confirmed the pain',
    validation_status: 'validated',
  },
  customer_hypothesis: {
    primary_segment: 'Urban millennials who value artisan goods',
    segment_description: 'Ages 25-40, sustainability-conscious, willing to pay premium',
    characteristics: ['Tech-savvy', 'Value authenticity', 'Disposable income'],
    where_to_find_them: 'Instagram, farmers markets, craft fairs',
    estimated_size: '5M potential customers in US',
    validation_status: 'untested',
  },
  solution_hypothesis: {
    proposed_solution: 'Curated marketplace with AI-powered matching',
    key_features: ['AI matching', 'Quality curation', 'Story-based profiles'],
    differentiation: 'Focus on local and artisan, not mass-produced',
    unfair_advantage: 'Exclusive partnerships with artisan guilds',
    validation_status: 'untested',
  },
  key_assumptions: [
    {
      assumption: 'Artisans will adopt digital platform',
      category: 'desirability',
      risk_level: 'high',
      testable: true,
      tested: false,
      validated: null,
      how_to_test: 'Onboard 10 artisans and measure engagement',
    },
    {
      assumption: 'Consumers will pay premium for artisan goods',
      category: 'viability',
      risk_level: 'medium',
      testable: true,
      tested: true,
      validated: true,
      how_to_test: 'Run pricing experiment with landing page',
    },
  ],
  success_criteria: {
    target_metrics: {
      'Monthly Active Artisans': '50+ within 3 months',
      'Customer Retention': '40% month-over-month',
    },
    fit_score_target: 0.7,
    zombie_ratio_max: 0.3,
    problem_resonance_target: 0.6,
    minimum_viable_signal: '10 paying customers in first month',
    deal_breakers: ['Less than 5 artisans onboarded', 'Zero repeat purchases'],
  },
  founder_context: {
    motivation: 'Grew up in artisan family, want to help them thrive',
    time_commitment: 'Full-time',
    founder_background: '10 years in e-commerce',
    resources_available: '$50K bootstrapped',
  },
  qa_status: {
    legitimacy_check: 'passed',
    legitimacy_notes: 'Clear problem and founder-market fit',
    intent_verification: 'passed',
    intent_notes: 'Genuine commitment demonstrated',
    overall_status: 'passed',
  },
  metadata: {
    interview_turns: 12,
    confidence_score: 0.85,
    followup_questions_asked: 5,
    interview_duration_minutes: 18,
  },
};

describe('FoundersBriefPanel', () => {
  it('renders all 8 sections when full brief data is provided', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByTestId('founders-brief-panel')).toBeInTheDocument();
    expect(screen.getByText("Founder's Brief")).toBeInTheDocument();

    // Section headers
    expect(screen.getByText('1. The Idea')).toBeInTheDocument();
    expect(screen.getByText('2. The Problem')).toBeInTheDocument();
    expect(screen.getByText(/3\. Who You're Building For/)).toBeInTheDocument();
    expect(screen.getByText('4. Your Proposed Solution')).toBeInTheDocument();
    expect(screen.getByText('5. Key Assumptions')).toBeInTheDocument();
    expect(screen.getByText('6. Success Criteria')).toBeInTheDocument();
    expect(screen.getByText('7. Founder Context')).toBeInTheDocument();

    // QA status bar
    expect(screen.getByTestId('qa-status-bar')).toBeInTheDocument();

    // Metadata footer
    expect(screen.getByTestId('brief-metadata')).toBeInTheDocument();
  });

  it('renders THE IDEA with one_liner, description, inspiration, unique_insight', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('AI-powered marketplace for local artisans')).toBeInTheDocument();
    expect(screen.getByText('A platform connecting local artisans with consumers')).toBeInTheDocument();
    expect(screen.getByText('Farmers markets are limited by geography')).toBeInTheDocument();
    expect(screen.getByText('Artisans lack digital skills but have amazing products')).toBeInTheDocument();
  });

  it('renders THE PROBLEM with problem_statement, evidence_of_problem, and validation_status badge', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('Artisans cannot reach customers beyond their local market')).toBeInTheDocument();
    expect(screen.getByText('Interviews with 20 local artisans confirmed the pain')).toBeInTheDocument();
    // validation_status badge
    expect(screen.getAllByText('validated').length).toBeGreaterThanOrEqual(1);
  });

  it("renders WHO YOU'RE BUILDING FOR with primary_segment, characteristics, and where_to_find_them", () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('Urban millennials who value artisan goods')).toBeInTheDocument();
    expect(screen.getByText('Tech-savvy')).toBeInTheDocument();
    expect(screen.getByText('Value authenticity')).toBeInTheDocument();
    expect(screen.getByText('Disposable income')).toBeInTheDocument();
    expect(screen.getByText('Instagram, farmers markets, craft fairs')).toBeInTheDocument();
  });

  it('renders YOUR PROPOSED SOLUTION with proposed_solution, key_features, differentiation, and unfair_advantage', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('Curated marketplace with AI-powered matching')).toBeInTheDocument();
    expect(screen.getByText('AI matching')).toBeInTheDocument();
    expect(screen.getByText('Quality curation')).toBeInTheDocument();
    expect(screen.getByText('Story-based profiles')).toBeInTheDocument();
    expect(screen.getByText('Focus on local and artisan, not mass-produced')).toBeInTheDocument();
    expect(screen.getByText('Exclusive partnerships with artisan guilds')).toBeInTheDocument();
  });

  it('renders KEY ASSUMPTIONS with risk_level color-coded badges, tested/validated indicators', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('Artisans will adopt digital platform')).toBeInTheDocument();
    expect(screen.getByText('Consumers will pay premium for artisan goods')).toBeInTheDocument();

    // Risk badges
    expect(screen.getByText('high risk')).toBeInTheDocument();
    expect(screen.getByText('medium risk')).toBeInTheDocument();

    // Category badges
    expect(screen.getByText('desirability')).toBeInTheDocument();
    expect(screen.getByText('viability')).toBeInTheDocument();

    // Tested/validated indicators
    expect(screen.getAllByText('Testable').length).toBe(2);
    expect(screen.getByText('Not tested')).toBeInTheDocument();
    expect(screen.getByText('Tested')).toBeInTheDocument();
    expect(screen.getByText('Validated')).toBeInTheDocument();
  });

  it('renders SUCCESS CRITERIA with target_metrics, deal_breakers, fit_score_target, zombie_ratio_max, problem_resonance_target', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('10 paying customers in first month')).toBeInTheDocument();
    expect(screen.getByText('Monthly Active Artisans')).toBeInTheDocument();
    expect(screen.getByText('50+ within 3 months')).toBeInTheDocument();
    expect(screen.getByText('Customer Retention')).toBeInTheDocument();
    expect(screen.getByText('40% month-over-month')).toBeInTheDocument();
    expect(screen.getByText('Less than 5 artisans onboarded')).toBeInTheDocument();
    expect(screen.getByText('Zero repeat purchases')).toBeInTheDocument();
    expect(screen.getByText('0.7')).toBeInTheDocument();
    expect(screen.getByText('0.3')).toBeInTheDocument();
    expect(screen.getByText('0.6')).toBeInTheDocument();
  });

  it('renders FOUNDER CONTEXT with motivation, time_commitment, founder_background, resources_available', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    expect(screen.getByText('Grew up in artisan family, want to help them thrive')).toBeInTheDocument();
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('10 years in e-commerce')).toBeInTheDocument();
    expect(screen.getByText('$50K bootstrapped')).toBeInTheDocument();
  });

  it('renders QA STATUS with overall_status, legitimacy_check/notes, intent_verification/notes', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    const qaBar = screen.getByTestId('qa-status-bar');
    expect(qaBar).toHaveTextContent('QA Status: passed');
    expect(qaBar).toHaveTextContent('Legitimacy:');
    expect(qaBar).toHaveTextContent('Clear problem and founder-market fit');
    expect(qaBar).toHaveTextContent('Intent:');
    expect(qaBar).toHaveTextContent('Genuine commitment demonstrated');
  });

  it('renders METADATA footer with interview_turns, confidence_score, followup_questions_asked, interview_duration_minutes', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    const metadata = screen.getByTestId('brief-metadata');
    expect(metadata).toHaveTextContent('12 turns');
    expect(metadata).toHaveTextContent('85% confidence');
    expect(metadata).toHaveTextContent('5 follow-ups');
    expect(metadata).toHaveTextContent('18min');
  });

  it('returns null when brief prop is undefined', () => {
    const { container } = render(<FoundersBriefPanel brief={undefined} />);
    expect(container.innerHTML).toBe('');
  });

  it('handles partial data gracefully without crashing', () => {
    const partialBrief: ModalFoundersBrief = {
      the_idea: { one_liner: 'Just an idea' },
    };

    render(<FoundersBriefPanel brief={partialBrief} />);

    expect(screen.getByTestId('founders-brief-panel')).toBeInTheDocument();
    expect(screen.getByText('Just an idea')).toBeInTheDocument();
    // Should not crash on missing sections
    expect(screen.getByText('1. The Idea')).toBeInTheDocument();
  });

  it('uses where_to_find_them field (not where_to_find)', () => {
    render(<FoundersBriefPanel brief={fullBrief} />);

    // The canonical field name is where_to_find_them
    expect(screen.getByText('Instagram, farmers markets, craft fairs')).toBeInTheDocument();
    expect(screen.getByText('Where to Find Them')).toBeInTheDocument();
  });
});

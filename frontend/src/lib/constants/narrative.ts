/**
 * Narrative Layer Constants
 *
 * User-facing copy, configuration values, and slide definitions.
 *
 * @story US-NL01
 */

// --- Slide Framework ---

export const SLIDE_ORDER = [
  'cover',
  'overview',
  'opportunity',
  'problem',
  'solution',
  'traction',
  'customer',
  'competition',
  'business_model',
  'team',
  'use_of_funds',
] as const;

export const SLIDE_LABELS: Record<string, string> = {
  cover: 'Cover',
  overview: 'Overview',
  opportunity: 'Opportunity',
  problem: 'Problem',
  solution: 'Solution',
  traction: 'Traction',
  customer: 'Customer',
  competition: 'Competition',
  business_model: 'Business Model',
  team: 'Team',
  use_of_funds: 'Use of Funds',
};

export const SLIDE_DESCRIPTIONS: Record<string, string> = {
  cover: 'Your title card — capture attention and set the tone.',
  overview: 'Your elevator pitch — the 15-second version of the deck.',
  opportunity: 'The 40,000-foot picture of your market space.',
  problem: 'Make investors feel the injustice. Be specific and personal.',
  solution: 'Show your magic, one-of-a-kind solution.',
  traction: 'Prove your assumptions are true and momentum is growing.',
  customer: 'Describe your customer so vividly they remind listeners of someone they know.',
  competition: 'Show you know your competitors and can beat them.',
  business_model: 'Answer three questions: CAC, LTV, and unit economics.',
  team: 'Build rapport and confidence the team can accomplish the mission.',
  use_of_funds: 'Clear ask + what you\'ll accomplish with the investment.',
};

// --- Generation Copy ---

export const GENERATION_LOADING_MESSAGES = [
  'Analyzing your validation evidence...',
  'Mapping customer insights to narrative...',
  'Synthesizing traction data...',
  'Crafting your competitive positioning...',
  'Building your pitch storyline...',
  'Aligning claims with evidence strength...',
  'Generating your 10-slide narrative...',
  'Running Guardian alignment checks...',
  'Finalizing your pitch deck...',
];

export const EMPTY_STATE_COPY = {
  title: 'Your pitch narrative is almost ready',
  description: 'Complete these validation steps to unlock your AI-generated pitch narrative.',
  cta: 'Generate My Pitch Narrative',
};

export const FIRST_RUN_COPY = {
  title: 'Your pitch narrative is ready to generate',
  description: 'Based on your validation evidence, we can create an investor-ready 10-slide pitch narrative using the Get Backed framework.',
  cta: 'Generate My Pitch Narrative',
  subtitle: 'Takes about 30 seconds',
};

// --- Prerequisite Copy ---

export const PREREQUISITE_LABELS: Record<string, string> = {
  project: 'Project with company name and industry',
  hypothesis: 'At least one hypothesis',
  customer_profile: 'Customer profile completed',
  vpc: 'Value Proposition Canvas populated',
};

export const PREREQUISITE_HELP: Record<string, string> = {
  project: 'Update your project settings to add your company name and industry.',
  hypothesis: 'Create a testable hypothesis about your target customers.',
  customer_profile: 'Run validation to generate a customer profile.',
  vpc: 'Complete your Value Proposition Canvas with customer jobs, pains, and gains.',
};

// --- Evidence Category ---

export const EVIDENCE_CATEGORY_LABELS: Record<string, string> = {
  'DO-direct': 'Direct Behavioral',
  'DO-indirect': 'Indirect Behavioral',
  'SAY': 'Stated',
};

export const EVIDENCE_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'DO-direct': 'Paying customers, signed contracts, usage metrics — what customers actually do.',
  'DO-indirect': 'LOIs, waitlist signups, prototype usage — actions that signal intent.',
  'SAY': 'Interview responses, survey data — what customers say they want.',
};

export const EVIDENCE_WEIGHTS: Record<string, number> = {
  'DO-direct': 1.0,
  'DO-indirect': 0.8,
  'SAY': 0.3,
};

// --- Staleness Copy ---

export const STALENESS_COPY = {
  soft: {
    badge: 'Updates available',
    description: 'New evidence has been collected since your narrative was last generated.',
    action: 'Regenerate to include latest evidence',
  },
  hard: {
    badge: 'Outdated',
    description: 'Significant changes to your validation data may affect your narrative.',
    action: 'Regenerate required before publishing',
  },
};

// --- Alignment Status Copy ---

export const ALIGNMENT_STATUS_COPY = {
  verified: {
    badge: 'Verified',
    description: 'All claims are supported by your evidence.',
  },
  pending: {
    badge: 'Checking...',
    description: 'Guardian is verifying your edits against the evidence.',
  },
  flagged: {
    badge: 'Review needed',
    description: 'Some claims may not be fully supported by your evidence.',
  },
};

// --- Publication Copy ---

export const PUBLICATION_COPY = {
  publish_title: 'Publish your narrative',
  publish_description: 'Publishing makes your narrative eligible for the Founder Directory and allows Portfolio Holders to discover your venture.',
  hitl_checklist: {
    reviewed_slides: 'I have reviewed all 10 slides for accuracy',
    verified_traction: 'Traction data reflects current evidence',
    added_context: 'I have added any missing context or corrections',
    confirmed_ask: 'My funding ask and use of funds are accurate',
  },
  unpublish_warning: 'Unpublishing removes your narrative from the Founder Directory. Existing shared links will still work.',
};

// --- Export Copy ---

export const EXPORT_COPY = {
  pdf_title: 'Export as PDF',
  pdf_description: 'Generate a branded PDF with verification QR code.',
  qr_code_option: 'Include verification QR code',
  qr_code_help: 'Adds a QR code to the footer of each slide linking to a verification page that confirms the evidence backing your claims.',
};

// --- Verification Copy ---

export const VERIFICATION_COPY = {
  verified: {
    title: 'Verified',
    description: 'This pitch narrative matches the evidence on record.',
  },
  outdated: {
    title: 'Outdated',
    description: 'This export was generated from an earlier version. The founder\'s narrative has been updated since this PDF was created.',
  },
  not_found: {
    title: 'Not Found',
    description: 'This verification token is not recognized.',
  },
};

// --- Feature Flags ---

export const NARRATIVE_FEATURE_FLAG = 'NEXT_PUBLIC_NARRATIVE_LAYER_ENABLED';

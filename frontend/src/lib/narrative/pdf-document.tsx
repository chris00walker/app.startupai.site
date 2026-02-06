/**
 * PDF Document Component for Narrative Export
 *
 * Renders a pitch narrative as a multi-slide PDF using @react-pdf/renderer.
 * Cover slide + 10 content slides with branded styling and verification footer.
 *
 * @story US-NL01
 * @see docs/specs/narrative-layer-spec.md :3196-3199
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { PitchNarrativeContent, MarketSize } from './types';

// Ensure fonts are registered before any rendering
import './pdf-fonts';

// --- Brand Colors ---

const BRAND = {
  primary: '#2563EB',       // Blue-600
  primaryDark: '#1E40AF',   // Blue-800
  secondary: '#0F172A',     // Slate-900
  accent: '#3B82F6',        // Blue-500
  muted: '#64748B',         // Slate-500
  mutedLight: '#94A3B8',    // Slate-400
  background: '#FFFFFF',
  surfaceLight: '#F8FAFC',  // Slate-50
  surfaceMid: '#F1F5F9',    // Slate-100
  border: '#E2E8F0',        // Slate-200
  success: '#16A34A',       // Green-600
  warning: '#CA8A04',       // Yellow-600
  textPrimary: '#0F172A',   // Slate-900
  textSecondary: '#475569',  // Slate-600
  white: '#FFFFFF',
} as const;

// --- Shared Styles ---

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    backgroundColor: BRAND.background,
    padding: 48,
    paddingBottom: 72,
    position: 'relative',
  },
  coverPage: {
    fontFamily: 'Inter',
    backgroundColor: BRAND.primary,
    padding: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // Slide header
  slideHeader: {
    fontSize: 32,
    fontWeight: 600,
    color: BRAND.secondary,
    marginBottom: 24,
  },
  // Subheading
  subheading: {
    fontSize: 24,
    fontWeight: 500,
    color: BRAND.secondary,
    marginBottom: 12,
  },
  // Body text
  body: {
    fontSize: 18,
    fontWeight: 400,
    color: BRAND.textSecondary,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  // Small text
  small: {
    fontSize: 14,
    fontWeight: 400,
    color: BRAND.muted,
    lineHeight: 1.4,
  },
  // Section card
  card: {
    backgroundColor: BRAND.surfaceLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  // Bullet point
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.primary,
    marginRight: 10,
    marginTop: 7,
  },
  bulletText: {
    fontSize: 16,
    fontWeight: 400,
    color: BRAND.textSecondary,
    flex: 1,
    lineHeight: 1.4,
  },
  // Metric box
  metricBox: {
    backgroundColor: BRAND.surfaceMid,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: BRAND.muted,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 600,
    color: BRAND.secondary,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: 400,
    color: BRAND.mutedLight,
  },
  footerCenter: {
    fontSize: 12,
    fontWeight: 400,
    color: BRAND.mutedLight,
  },
  // Two-column layout
  columns: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 12,
  },
  // Tag/badge
  badge: {
    backgroundColor: BRAND.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 600,
    color: BRAND.white,
  },
  // Score display
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.surfaceMid,
    flex: 1,
    marginLeft: 8,
  },
  scoreFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.primary,
  },
});

// --- Helper Components ---

interface BulletProps {
  items: string[];
  maxItems?: number;
}

function BulletList({ items, maxItems }: BulletProps) {
  const displayed = maxItems ? items.slice(0, maxItems) : items;
  return (
    <View>
      {displayed.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMarketSize(ms: MarketSize | undefined): string {
  if (!ms) return 'N/A';
  if (ms.unit === 'USD') return formatCurrency(ms.value);
  return `${ms.value.toLocaleString()} ${ms.unit}`;
}

function scorePercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

interface SlideFooterProps {
  pageNumber: number;
  verificationShort: string;
  qrDataUrl: string | null;
}

function SlideFooter({ pageNumber, verificationShort, qrDataUrl }: SlideFooterProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{verificationShort}</Text>
      <Text style={styles.footerCenter}>{pageNumber}</Text>
      {qrDataUrl ? (
        <Image src={qrDataUrl} style={{ width: 48, height: 48 }} />
      ) : (
        <Text style={styles.footerText}> </Text>
      )}
    </View>
  );
}

// --- Slide Components ---

interface SlideProps {
  content: PitchNarrativeContent;
  verificationShort: string;
  qrDataUrl: string | null;
}

function CoverSlide({ content }: { content: PitchNarrativeContent }) {
  const cover = content.cover;
  return (
    <Page size="LETTER" style={styles.coverPage}>
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Text style={{ fontSize: 18, fontWeight: 600, color: BRAND.white, opacity: 0.8, marginBottom: 16 }}>
          StartupAI
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 42, fontWeight: 700, color: BRAND.white, textAlign: 'center', marginBottom: 16 }}>
          {cover?.venture_name ?? 'Untitled Venture'}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: 400, color: BRAND.white, opacity: 0.9, textAlign: 'center', marginBottom: 32 }}>
          {cover?.tagline ?? ''}
        </Text>
        {cover?.document_type && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: BRAND.white }}>
              {cover.document_type}
            </Text>
          </View>
        )}
        {cover?.contact && (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 500, color: BRAND.white, opacity: 0.9 }}>
              {cover.contact.founder_name}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 400, color: BRAND.white, opacity: 0.7, marginTop: 4 }}>
              {cover.contact.email}
            </Text>
          </View>
        )}
      </View>
      <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: 400, color: BRAND.white, opacity: 0.6 }}>
          Powered by StartupAI
        </Text>
      </View>
    </Page>
  );
}

function OverviewSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const ov = content.overview;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Overview</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{ov?.thesis ?? ''}</Text>
      <View style={styles.card}>
        <Text style={[styles.small, { fontWeight: 500, color: BRAND.primary, marginBottom: 4 }]}>One-Liner</Text>
        <Text style={[styles.body, { marginBottom: 0 }]}>{ov?.one_liner ?? ''}</Text>
      </View>
      <View style={[styles.columns, { marginTop: 8 }]}>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Industry</Text>
          <Text style={styles.body}>{ov?.industry ?? 'N/A'}</Text>
        </View>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Novel Insight</Text>
          <Text style={styles.body}>{ov?.novel_insight ?? 'N/A'}</Text>
        </View>
      </View>
      {ov?.key_metrics && ov.key_metrics.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subheading, { fontSize: 18 }]}>Key Metrics</Text>
          {ov.key_metrics.slice(0, 4).map((m, i) => (
            <MetricRow key={i} label={m.label} value={m.value} />
          ))}
        </View>
      )}
      <SlideFooter pageNumber={2} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function ProblemSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const prob = content.problem;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Problem</Text>
      <Text style={[styles.body, { fontSize: 20, fontWeight: 500, marginBottom: 16, color: BRAND.secondary }]}>
        {prob?.primary_pain ?? ''}
      </Text>
      <Text style={styles.body}>{prob?.pain_narrative ?? ''}</Text>
      {prob?.customer_story && (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={[styles.small, { fontWeight: 600, color: BRAND.primary, marginBottom: 6 }]}>Customer Story</Text>
          <Text style={[styles.small, { fontWeight: 500 }]}>{prob.customer_story.name} - {prob.customer_story.context}</Text>
          <Text style={[styles.body, { fontSize: 14, marginTop: 4 }]}>{prob.customer_story.struggle}</Text>
        </View>
      )}
      <View style={[styles.columns, { marginTop: 12 }]}>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Affected Population</Text>
          <Text style={styles.body}>{prob?.affected_population ?? 'N/A'}</Text>
        </View>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Status Quo</Text>
          <Text style={styles.body}>{prob?.status_quo ?? 'N/A'}</Text>
        </View>
      </View>
      {prob?.evidence_quotes && prob.evidence_quotes.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 6 }]}>Evidence Quotes</Text>
          {prob.evidence_quotes.slice(0, 3).map((q, i) => (
            <Text key={i} style={[styles.small, { fontStyle: 'italic', marginBottom: 4 }]}>
              &quot;{q}&quot;
            </Text>
          ))}
        </View>
      )}
      <SlideFooter pageNumber={3} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function SolutionSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const sol = content.solution;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Solution</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{sol?.value_proposition ?? ''}</Text>
      <View style={styles.card}>
        <Text style={[styles.small, { fontWeight: 500, color: BRAND.primary, marginBottom: 4 }]}>How It Works</Text>
        <Text style={styles.body}>{sol?.how_it_works ?? ''}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Key Differentiator</Text>
        <Text style={styles.body}>{sol?.key_differentiator ?? 'N/A'}</Text>
      </View>
      {sol?.use_cases && sol.use_cases.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 6 }]}>Use Cases</Text>
          <BulletList items={sol.use_cases} maxItems={5} />
        </View>
      )}
      {sol?.fit_score !== undefined && (
        <View style={[styles.metricBox, { marginTop: 12 }]}>
          <Text style={styles.metricLabel}>Fit Score</Text>
          <Text style={styles.metricValue}>{scorePercent(sol.fit_score)}</Text>
        </View>
      )}
      <SlideFooter pageNumber={4} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function TractionSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const tr = content.traction;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Traction</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{tr?.evidence_summary ?? ''}</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          <MetricRow label="Interviews" value={String(tr?.interview_count ?? 0)} />
          <MetricRow label="Experiments" value={String(tr?.experiment_count ?? 0)} />
        </View>
        <View style={styles.column}>
          <MetricRow label="HITL Completion" value={tr?.hitl_completion_rate !== undefined ? scorePercent(tr.hitl_completion_rate) : 'N/A'} />
          <MetricRow label="DO-direct Evidence" value={String(tr?.do_direct?.length ?? 0)} />
        </View>
      </View>
      {tr?.assumptions_validated && tr.assumptions_validated.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Assumptions Validated</Text>
          {tr.assumptions_validated.slice(0, 4).map((a, i) => (
            <View key={i} style={[styles.card, { padding: 10, marginBottom: 6 }]}>
              <Text style={[styles.small, { fontWeight: 500 }]}>{a.assumption}</Text>
              <Text style={[styles.small, { marginTop: 2 }]}>{a.evidence}</Text>
              <Text style={[styles.small, { color: BRAND.primary, marginTop: 2 }]}>
                Confidence: {scorePercent(a.confidence)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <SlideFooter pageNumber={5} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function CustomerSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const cust = content.customer;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Customer &amp; Market</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{cust?.persona_summary ?? ''}</Text>
      {cust?.segments && cust.segments.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Target Segments</Text>
          {cust.segments.slice(0, 3).map((seg, i) => (
            <View key={i} style={[styles.card, { padding: 10, marginBottom: 6 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[styles.small, { fontWeight: 600 }]}>{seg.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{seg.priority}</Text>
                </View>
              </View>
              <Text style={styles.small}>{seg.description}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Target Segment</Text>
          <Text style={styles.body}>{cust?.target_first ?? 'N/A'}</Text>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4, marginTop: 8 }]}>Acquisition Channel</Text>
          <Text style={styles.body}>{cust?.acquisition_channel ?? 'N/A'}</Text>
        </View>
        <View style={styles.column}>
          <MetricRow label="Market Size" value={cust?.market_size ? formatCurrency(cust.market_size) : 'N/A'} />
          <MetricRow label="Willingness to Pay" value={cust?.willingness_to_pay ?? 'N/A'} />
        </View>
      </View>
      <SlideFooter pageNumber={6} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function OpportunitySlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const opp = content.opportunity;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Opportunity</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{opp?.why_now ?? ''}</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          <MetricRow label="TAM" value={formatMarketSize(opp?.tam)} />
          <MetricRow label="SAM" value={formatMarketSize(opp?.sam)} />
          <MetricRow label="SOM" value={formatMarketSize(opp?.som)} />
        </View>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Growth Trajectory</Text>
          <Text style={styles.body}>{opp?.growth_trajectory ?? 'N/A'}</Text>
        </View>
      </View>
      {opp?.market_tailwinds && opp.market_tailwinds.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Market Tailwinds</Text>
          <BulletList items={opp.market_tailwinds} maxItems={5} />
        </View>
      )}
      <SlideFooter pageNumber={7} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function CompetitionSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const comp = content.competition;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Competition</Text>
      <Text style={[styles.body, { marginBottom: 16 }]}>{comp?.landscape_summary ?? ''}</Text>
      {comp?.primary_competitors && comp.primary_competitors.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Primary Competitors</Text>
          {comp.primary_competitors.slice(0, 4).map((c, i) => (
            <View key={i} style={[styles.card, { padding: 10, marginBottom: 6 }]}>
              <Text style={[styles.small, { fontWeight: 600, marginBottom: 4 }]}>{c.name}</Text>
              <Text style={styles.small}>{c.how_they_compete}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Unfair Advantage</Text>
          <Text style={styles.body}>{comp?.unfair_advantage ?? 'N/A'}</Text>
        </View>
        <View style={styles.column}>
          <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Differentiators</Text>
          {comp?.differentiators && <BulletList items={comp.differentiators} maxItems={4} />}
        </View>
      </View>
      <SlideFooter pageNumber={8} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function BusinessModelSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const bm = content.business_model;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Business Model</Text>
      <View style={styles.card}>
        <Text style={[styles.small, { fontWeight: 500, color: BRAND.primary, marginBottom: 4 }]}>Revenue Model</Text>
        <Text style={styles.body}>{bm?.revenue_model ?? 'N/A'}</Text>
      </View>
      <View style={[styles.columns, { marginTop: 8 }]}>
        <View style={styles.column}>
          <MetricRow label="CAC" value={bm?.cac !== undefined ? formatCurrency(bm.cac) : 'N/A'} />
          <MetricRow label="LTV" value={bm?.ltv !== undefined ? formatCurrency(bm.ltv) : 'N/A'} />
          <MetricRow label="LTV:CAC" value={bm?.ltv_cac_ratio !== undefined ? `${bm.ltv_cac_ratio.toFixed(1)}x` : 'N/A'} />
        </View>
        <View style={styles.column}>
          {bm?.unit_economics && (
            <View>
              <MetricRow label="Revenue / Unit" value={formatCurrency(bm.unit_economics.revenue_per_unit)} />
              <MetricRow label="Cost / Unit" value={formatCurrency(bm.unit_economics.cost_per_unit)} />
              <MetricRow label="Margin / Unit" value={formatCurrency(bm.unit_economics.margin_per_unit)} />
            </View>
          )}
        </View>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={[styles.small, { fontWeight: 500, marginBottom: 4 }]}>Pricing Strategy</Text>
        <Text style={styles.body}>{bm?.pricing_strategy ?? 'N/A'}</Text>
      </View>
      <SlideFooter pageNumber={9} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function TeamSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const team = content.team;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Team</Text>
      {team?.members && team.members.length > 0 && (
        <View>
          {team.members.slice(0, 4).map((member, i) => (
            <View key={i} style={[styles.card, { padding: 12, marginBottom: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.body, { fontWeight: 600, fontSize: 16, marginBottom: 0 }]}>{member.name}</Text>
                <Text style={[styles.small, { color: BRAND.primary }]}>{member.current_role}</Text>
              </View>
              <Text style={[styles.small, { marginBottom: 4 }]}>{member.bio}</Text>
              <Text style={[styles.small, { fontWeight: 500, marginBottom: 2 }]}>Domain: {member.domain_expertise}</Text>
              {member.prior_experience.length > 0 && (
                <Text style={styles.small}>Experience: {member.prior_experience.slice(0, 3).join(', ')}</Text>
              )}
            </View>
          ))}
        </View>
      )}
      {team?.advisors && team.advisors.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Advisors</Text>
          {team.advisors.slice(0, 3).map((a, i) => (
            <Text key={i} style={styles.small}>{a.name} - {a.title} ({a.relevance})</Text>
          ))}
        </View>
      )}
      {team?.coachability_score !== undefined && (
        <MetricRow label="Coachability Score" value={scorePercent(team.coachability_score)} />
      )}
      <SlideFooter pageNumber={10} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

function UseOfFundsSlide({ content, verificationShort, qrDataUrl }: SlideProps) {
  const uof = content.use_of_funds;
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.slideHeader}>Use of Funds</Text>
      {uof?.ask_amount !== undefined && (
        <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={[styles.small, { fontWeight: 500, color: BRAND.primary }]}>Funding Ask</Text>
            <Text style={[styles.body, { fontSize: 28, fontWeight: 700, color: BRAND.secondary, marginBottom: 0 }]}>
              {formatCurrency(uof.ask_amount)}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{uof?.ask_type ?? 'SAFE'}</Text>
          </View>
        </View>
      )}
      {uof?.allocations && uof.allocations.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Allocation</Text>
          {uof.allocations.slice(0, 6).map((alloc, i) => (
            <View key={i} style={[styles.metricBox, { marginBottom: 4 }]}>
              <Text style={styles.metricLabel}>{alloc.category} ({alloc.percentage}%)</Text>
              <Text style={styles.metricValue}>{formatCurrency(alloc.amount)}</Text>
            </View>
          ))}
        </View>
      )}
      {uof?.milestones && uof.milestones.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.subheading, { fontSize: 16 }]}>Key Milestones</Text>
          {uof.milestones.slice(0, 4).map((ms, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>
                {ms.description} (by {ms.target_date})
              </Text>
            </View>
          ))}
        </View>
      )}
      {uof?.timeline_weeks !== undefined && (
        <MetricRow label="Timeline" value={`${uof.timeline_weeks} weeks`} />
      )}
      <SlideFooter pageNumber={11} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Page>
  );
}

// --- Main Document ---

export interface NarrativePdfProps {
  content: PitchNarrativeContent;
  verificationShort: string;
  qrDataUrl: string | null;
}

export function NarrativePdfDocument({ content, verificationShort, qrDataUrl }: NarrativePdfProps) {
  return (
    <Document
      title={`${content.cover?.venture_name ?? 'Pitch Narrative'} - StartupAI`}
      author="StartupAI"
      subject="Pitch Narrative Export"
      creator="StartupAI Platform"
    >
      <CoverSlide content={content} />
      <OverviewSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <ProblemSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <SolutionSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <TractionSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <CustomerSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <OpportunitySlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <CompetitionSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <BusinessModelSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <TeamSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
      <UseOfFundsSlide content={content} verificationShort={verificationShort} qrDataUrl={qrDataUrl} />
    </Document>
  );
}

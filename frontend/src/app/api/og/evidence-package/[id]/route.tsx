/**
 * OG Image Generator for Evidence Packages
 *
 * GET /api/og/evidence-package/:id
 *
 * Generates 1200x630 PNG Open Graph images for social sharing.
 * Public endpoint (no auth) -- OG images must be accessible by crawlers.
 * Uses satori + @resvg/resvg-js for Netlify compatibility (NOT @vercel/og).
 *
 * @story US-NL01
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@/lib/supabase/admin';
import type { PitchNarrativeContent } from '@/lib/narrative/types';

// ---------------------------------------------------------------------------
// Font cache -- load once per cold start, reused across requests
// ---------------------------------------------------------------------------

let fontCache: { regular: Buffer; semiBold: Buffer } | null = null;

async function loadFonts(): Promise<{ regular: Buffer; semiBold: Buffer }> {
  if (fontCache) return fontCache;
  const [regular, semiBold] = await Promise.all([
    readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf')),
    readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-SemiBold.ttf')),
  ]);
  fontCache = { regular, semiBold };
  return fontCache;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate text to a maximum length, adding ellipsis if needed. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026';
}

/** Map a numeric score (0-1) to a hex color. */
function scoreColor(score: number): string {
  if (score >= 0.7) return '#22C55E'; // green-500
  if (score >= 0.4) return '#EAB308'; // yellow-500
  return '#EF4444'; // red-500
}

/** Format validation stage for display. */
function formatStage(stage: string | null | undefined): string {
  if (!stage) return 'Validating';
  const labels: Record<string, string> = {
    DESIRABILITY: 'Problem Validated',
    FEASIBILITY: 'Solution Validated',
    VIABILITY: 'Business Validated',
    SCALE: 'Growth Ready',
  };
  return labels[stage] ?? stage;
}

// ---------------------------------------------------------------------------
// Image renderers
// ---------------------------------------------------------------------------

function renderFallbackImage(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        fontFamily: 'Inter',
      }}
    >
      <span
        style={{
          fontSize: 56,
          fontWeight: 600,
          color: '#FFFFFF',
          letterSpacing: '-0.025em',
        }}
      >
        StartupAI
      </span>
      <span
        style={{
          fontSize: 22,
          color: '#94A3B8',
          marginTop: 16,
        }}
      >
        Evidence-Backed Startup Validation
      </span>
    </div>
  );
}

function renderEvidenceImage(params: {
  ventureName: string;
  tagline: string;
  fitScore: number;
  stage: string;
}): React.ReactElement {
  const { ventureName, tagline, fitScore, stage } = params;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        fontFamily: 'Inter',
        padding: '48px 64px',
      }}
    >
      {/* Top row: logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '-0.025em',
          }}
        >
          StartupAI
        </span>
      </div>

      {/* Center: venture name + tagline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <span
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#FFFFFF',
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            maxWidth: '100%',
          }}
        >
          {truncate(ventureName, 50)}
        </span>
        {tagline && (
          <span
            style={{
              fontSize: 24,
              color: '#94A3B8',
              marginTop: 16,
              lineHeight: 1.4,
              maxWidth: '100%',
            }}
          >
            {truncate(tagline, 90)}
          </span>
        )}
      </div>

      {/* Bottom row: fit score, stage badge, evidence-backed badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        {/* Fit Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${scoreColor(fitScore)}`,
              marginRight: 14,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: scoreColor(fitScore),
              }}
            >
              {Math.round(fitScore * 100)}
            </span>
          </div>
          <span style={{ fontSize: 16, color: '#94A3B8' }}>Fit Score</span>
        </div>

        {/* Validation Stage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderRadius: 24,
            padding: '10px 24px',
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#818CF8',
            }}
          >
            {stage}
          </span>
        </div>

        {/* Evidence-Backed badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Checkmark circle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              marginRight: 10,
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
                lineHeight: 1,
              }}
            >
              {'\u2713'}
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#94A3B8',
            }}
          >
            Evidence-Backed
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fonts = await loadFonts();
    const supabase = createClient();

    // 1. Look up evidence package
    const { data: pkg, error: pkgError } = await supabase
      .from('evidence_packages')
      .select('id, project_id, pitch_narrative_id, is_public')
      .eq('id', id)
      .single();

    // If not found or not public, return generic fallback
    if (pkgError || !pkg || !pkg.is_public) {
      return renderPng(renderFallbackImage(), fonts);
    }

    // 2. Fetch pitch narrative content
    let narrativeContent: PitchNarrativeContent | null = null;
    if (pkg.pitch_narrative_id) {
      const { data: narrative } = await supabase
        .from('pitch_narratives')
        .select('narrative_data')
        .eq('id', pkg.pitch_narrative_id)
        .single();

      if (narrative?.narrative_data) {
        narrativeContent = narrative.narrative_data as PitchNarrativeContent;
      }
    }

    // 3. Fetch project details
    const { data: project } = await supabase
      .from('projects')
      .select('name, validation_stage')
      .eq('id', pkg.project_id)
      .single();

    // If we don't have enough data to render, fall back
    if (!narrativeContent && !project) {
      return renderPng(renderFallbackImage(), fonts);
    }

    // 4. Extract display values with safe fallbacks
    const ventureName =
      narrativeContent?.cover?.venture_name ?? project?.name ?? 'Untitled Venture';
    const tagline =
      narrativeContent?.overview?.one_liner ?? '';
    const fitScore =
      narrativeContent?.metadata?.overall_fit_score ??
      narrativeContent?.solution?.fit_score ??
      0;
    const stage = formatStage(
      narrativeContent?.metadata?.validation_stage ?? project?.validation_stage
    );

    // 5. Render OG image
    return renderPng(
      renderEvidenceImage({ ventureName, tagline, fitScore, stage }),
      fonts
    );
  } catch (error) {
    console.error('[og/evidence-package] Rendering error:', error);
    return new Response('Internal server error generating OG image', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ---------------------------------------------------------------------------
// PNG rendering pipeline
// ---------------------------------------------------------------------------

async function renderPng(
  element: React.ReactElement,
  fonts: { regular: Buffer; semiBold: Buffer }
): Promise<Response> {
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fonts.regular, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: fonts.semiBold, weight: 600 as const, style: 'normal' as const },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: 1200 },
  });
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}

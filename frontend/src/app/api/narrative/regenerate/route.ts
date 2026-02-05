/**
 * Narrative Regeneration API
 *
 * POST /api/narrative/regenerate - Regenerate pitch narrative
 *
 * Dedicated endpoint per spec :4463.
 * Internally calls same logic as generate with force_regenerate: true.
 *
 * @story US-NL01
 */

import { NextRequest } from 'next/server';
import { POST as generateHandler } from '../generate/route';

export async function POST(request: NextRequest) {
  // Clone request with force_regenerate: true
  const body = await request.json();
  const modifiedBody = {
    ...body,
    force_regenerate: true,
  };

  // Create new request with modified body
  const modifiedRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(modifiedBody),
  });

  return generateHandler(modifiedRequest);
}

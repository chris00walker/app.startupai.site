/**
 * Logout API
 *
 * @story US-AU01
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Get the origin from the request to redirect back to the same host
  const url = new URL(request.url);
  const redirectUrl = `${url.origin}/login`;

  // Redirect to login page
  return NextResponse.redirect(redirectUrl);
}

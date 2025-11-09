import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  // Sign out from Supabase
  await supabase.auth.signOut();

  // Determine the marketing site URL based on environment
  const marketingSiteUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000';

  // Redirect to marketing site homepage
  return NextResponse.redirect(marketingSiteUrl);
}

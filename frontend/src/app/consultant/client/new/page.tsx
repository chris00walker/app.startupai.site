import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientOnboardingWizard } from '@/components/onboarding/ClientOnboardingWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, ArrowRight } from 'lucide-react';

/**
 * Client Project Start Page (Quick Start - ADR-006)
 *
 * If clientId is provided in URL, shows Quick Start form for that client.
 * Otherwise, shows a list of active clients to choose from.
 *
 * @story US-C07
 */

export const metadata = {
  title: 'Start Client Project | StartupAI',
  description: 'Start a new validation project for one of your clients',
};

interface PageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function ClientOnboardingPage({ searchParams }: PageProps) {
  const { clientId } = await searchParams;
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?returnUrl=/consultant/client/new');
  }

  // Check if user has consultant role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'consultant') {
    redirect('/founder-dashboard');
  }

  // If clientId provided, show Quick Start form
  if (clientId) {
    // Verify this client belongs to the consultant (via SECURITY DEFINER function)
    const { data: hasAccess } = await supabase.rpc('check_consultant_client_access', {
      p_client_id: clientId,
    });

    if (!hasAccess) {
      redirect('/consultant/clients?error=client_not_found');
    }

    // Get client name from user_profiles if available
    const { data: clientProfile } = await supabase
      .from('user_profiles')
      .select('full_name, company')
      .eq('id', clientId)
      .single();

    const clientName = clientProfile?.full_name || clientProfile?.company || 'Client';

    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-12 px-4">
          <ClientOnboardingWizard
            consultantId={user.id}
            clientId={clientId}
            clientName={clientName}
          />
        </div>
      </main>
    );
  }

  // No clientId - show client selection (via SECURITY DEFINER function)
  const { data: clients } = await supabase.rpc('get_consultant_active_clients');

  // Get client profile info for active clients
  const clientIds = clients?.map(c => c.client_id).filter((id): id is string => Boolean(id)) || [];
  const { data: clientProfiles } = clientIds.length > 0
    ? await supabase
        .from('user_profiles')
        .select('id, full_name, company')
        .in('id', clientIds)
    : { data: [] as { id: string; full_name: string | null; company: string | null }[] };

  const profileMap = new Map(
    (clientProfiles || []).map(p => [p.id, p] as [string, typeof p])
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Start Client Project</CardTitle>
            <CardDescription>
              Select a client to start a new validation project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clients && clients.length > 0 ? (
              <div className="space-y-3">
                {clients.map((client) => {
                  const profile = client.client_id ? profileMap.get(client.client_id) : null;
                  const displayName = profile?.full_name || profile?.company || client.client_name || client.invite_email;

                  return (
                    <Link
                      key={client.client_id || client.invite_email}
                      href={`/consultant/client/new?clientId=${client.client_id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground">{client.invite_email}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No active clients yet. Invite clients to get started.
                </p>
                <Link
                  href="/consultant/clients"
                  className="text-primary hover:underline"
                >
                  Manage Clients
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

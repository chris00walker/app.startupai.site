/**
 * ConnectionRequestCard Component
 *
 * Dashboard notification card showing pending connection requests.
 * Used on both founder and consultant dashboards.
 *
 * @story US-FM04, US-PH04
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowRight } from 'lucide-react';

export interface ConnectionRequestCardProps {
  /** Number of pending connection requests */
  count: number;
  /** Whether the user is a founder or consultant */
  role: 'founder' | 'consultant';
  /** Optional className for styling */
  className?: string;
}

export function ConnectionRequestCard({
  count,
  role,
  className,
}: ConnectionRequestCardProps) {
  // Don't show if no pending requests
  if (count === 0) {
    return null;
  }

  const requestsPath = role === 'founder' ? '/founder/connections' : '/consultant/connections';
  const fromLabel = role === 'founder' ? 'consultants' : 'founders';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Connection Requests
          </CardTitle>
          <Badge variant="secondary" className="font-bold">
            {count}
          </Badge>
        </div>
        <CardDescription>
          {count === 1
            ? `You have 1 pending connection request from a ${fromLabel.slice(0, -1)}.`
            : `You have ${count} pending connection requests from ${fromLabel}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full justify-between"
          asChild
        >
          <Link href={requestsPath}>
            View Requests
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default ConnectionRequestCard;

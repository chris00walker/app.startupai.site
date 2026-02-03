/**
 * Consultant RFQ Board Page
 *
 * @story US-PH05, US-PH06
 */

import { RFQBoard } from '@/components/consultant/RFQBoard';

export const metadata = {
  title: 'Request Board | StartupAI',
  description: 'Browse founder requests for quotes and expertise',
};

export default function RFQBoardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Founder Requests</h1>
        <p className="text-muted-foreground mt-2">
          Browse requests from founders looking for your expertise. Respond to connect with qualified opportunities.
        </p>
      </div>
      <RFQBoard />
    </div>
  );
}

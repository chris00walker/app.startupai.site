/**
 * Consultant Founder Directory Page
 *
 * @story US-PH01, US-PH02
 */

import { FounderDirectory } from '@/components/consultant/FounderDirectory';

export const metadata = {
  title: 'Founder Directory | StartupAI',
  description: 'Browse validated founders looking for expert guidance',
};

export default function FounderDirectoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Founder Directory</h1>
        <p className="text-muted-foreground mt-2">
          Browse founders who have opted in to the marketplace. View their validation progress and request connections.
        </p>
      </div>
      <FounderDirectory />
    </div>
  );
}

/**
 * Founder Consultant Directory Page
 *
 * @story US-FM01, US-FM02
 */

import { ConsultantDirectory } from '@/components/founder/ConsultantDirectory';

export const metadata = {
  title: 'Find Consultants | StartupAI',
  description: 'Browse verified consultants to help grow your startup',
};

export default function ConsultantDirectoryPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Consultants</h1>
        <p className="text-muted-foreground mt-2">
          Browse verified consultants who can help with advisory, funding, programs, services, and more.
        </p>
      </div>
      <ConsultantDirectory />
    </div>
  );
}

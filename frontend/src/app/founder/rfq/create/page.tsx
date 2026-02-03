/**
 * Create RFQ Page
 *
 * @story US-FM07
 */

import { RFQForm } from '@/components/founder/RFQForm';

export const metadata = {
  title: 'Post a Request | StartupAI',
  description: 'Post a request for quotes from verified consultants',
};

export default function CreateRFQPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Post a Request</h1>
        <p className="text-muted-foreground mt-2">
          Describe what you're looking for and verified consultants will be able to respond.
        </p>
      </div>
      <RFQForm />
    </div>
  );
}

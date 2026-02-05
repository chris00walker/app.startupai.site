/**
 * Verification Page
 *
 * Public page for verifying an exported pitch narrative's integrity.
 * No authentication required.
 *
 * @story US-NL01
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { VerificationPageContent } from '@/components/verification/VerificationPage';
import type { VerificationResponse } from '@/lib/narrative/types';

export default function VerifyPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const response = await fetch(`/api/verify/${token}`);
        const result = await response.json();
        setData(result);
      } catch {
        setData({ status: 'not_found' });
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      verify();
    }
  }, [token]);

  if (isLoading || !data) {
    return (
      <VerificationPageContent
        data={{ status: 'not_found' }}
        isLoading={true}
      />
    );
  }

  return <VerificationPageContent data={data} />;
}

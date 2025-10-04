/**
 * Analytics Provider
 * 
 * Wraps the application to provide analytics functionality.
 * Handles initialization, page tracking, and user identification.
 */

'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';
import { usePageTracking, useUserIdentification } from '@/lib/analytics/hooks';
import { ConsentBanner } from './ConsentBanner';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  /**
   * Whether to show the consent banner
   * @default true
   */
  showConsentBanner?: boolean;
  /**
   * Whether to auto-consent in development
   * @default true
   */
  autoConsentInDev?: boolean;
}

export function AnalyticsProvider({
  children,
  showConsentBanner = true,
  autoConsentInDev = true,
}: AnalyticsProviderProps) {
  // Initialize analytics
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const autoConsent = isDev && autoConsentInDev;
    
    initAnalytics(autoConsent);
  }, [autoConsentInDev]);
  
  // Track page views automatically
  usePageTracking();
  
  // Identify users automatically when logged in
  useUserIdentification();
  
  return (
    <>
      {children}
      {showConsentBanner && <ConsentBanner />}
    </>
  );
}

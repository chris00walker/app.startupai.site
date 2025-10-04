/**
 * Analytics Consent Banner
 * 
 * GDPR-compliant cookie consent banner for analytics tracking.
 * Follows WCAG 2.2 accessibility standards.
 */

'use client';

import { useState, useEffect } from 'react';
import { setAnalyticsConsent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CONSENT_STORAGE_KEY = 'analytics-consent';
const CONSENT_EXPIRY_DAYS = 365;

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already given/denied consent
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    
    if (!storedConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 2000);
    } else {
      // Apply stored consent
      const { consent, expiry } = JSON.parse(storedConsent);
      
      if (new Date().getTime() < expiry) {
        setAnalyticsConsent(consent === 'accepted');
      } else {
        // Consent expired, show banner again
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        setShowBanner(true);
      }
    }
  }, []);

  const handleAccept = () => {
    saveConsent('accepted');
    setAnalyticsConsent(true);
    hideBanner();
  };

  const handleDecline = () => {
    saveConsent('declined');
    setAnalyticsConsent(false);
    hideBanner();
  };

  const saveConsent = (consent: 'accepted' | 'declined') => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CONSENT_EXPIRY_DAYS);
    
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        consent,
        expiry: expiry.getTime(),
        timestamp: new Date().toISOString(),
      })
    );
  };

  const hideBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-describedby="consent-description"
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <Card className="mx-auto max-w-4xl border-border/40 bg-background/95 p-6 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="mb-2 text-lg font-semibold">
              🍪 We use analytics to improve your experience
            </h2>
            <p id="consent-description" className="text-sm text-muted-foreground">
              We use privacy-friendly analytics to understand how you use our platform and make it better.
              We don't sell your data or use it for advertising. You can change your preference anytime in settings.
              {' '}
              <a
                href="/privacy"
                className="underline hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Learn more
              </a>
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="min-w-[120px]"
              aria-label="Decline analytics cookies"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="min-w-[120px]"
              aria-label="Accept analytics cookies"
            >
              Accept
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Consent Settings Component
 * 
 * For use in settings/privacy pages to manage consent.
 */
export function ConsentSettings() {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (storedConsent) {
      const { consent: consentValue } = JSON.parse(storedConsent);
      setConsent(consentValue);
    }
    setLoading(false);
  }, []);

  const updateConsent = (newConsent: 'accepted' | 'declined') => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CONSENT_EXPIRY_DAYS);
    
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        consent: newConsent,
        expiry: expiry.getTime(),
        timestamp: new Date().toISOString(),
      })
    );
    
    setConsent(newConsent);
    setAnalyticsConsent(newConsent === 'accepted');
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Analytics Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Control how we collect and use analytics data about your usage.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex-1">
          <div className="font-medium">Analytics Cookies</div>
          <div className="text-sm text-muted-foreground">
            Help us improve by allowing anonymous usage analytics
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={consent === 'declined' ? 'default' : 'outline'}
            onClick={() => updateConsent('declined')}
            size="sm"
          >
            Off
          </Button>
          <Button
            variant={consent === 'accepted' ? 'default' : 'outline'}
            onClick={() => updateConsent('accepted')}
            size="sm"
          >
            On
          </Button>
        </div>
      </div>

      {consent && (
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

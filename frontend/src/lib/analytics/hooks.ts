/**
 * Analytics React Hooks
 * 
 * Custom hooks for using analytics in React components.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/lib/auth/hooks';
import {
  trackEvent,
  trackPageView,
  trackError,
  trackPerformance,
  identifyUser,
} from './index';

/**
 * Track page views automatically on route changes
 */
export function usePageTracking() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    
    // Skip if same pathname
    if (pathname === prevPathname.current) return;
    
    prevPathname.current = pathname;
    trackPageView(pathname);
  }, [pathname]);
}

/**
 * Identify user automatically when authenticated
 */
export function useUserIdentification() {
  const { user, loading } = useUser();
  const identifiedUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user && user.id !== identifiedUser.current) {
      identifiedUser.current = user.id;
      identifyUser(user);
    }
  }, [user, loading]);
}

/**
 * Track performance metrics
 */
export function usePerformanceTracking(metricName: string, dependencies: any[] = []) {
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      if (startTime.current !== null) {
        const duration = performance.now() - startTime.current;
        trackPerformance(metricName, duration);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

/**
 * Track component mount/unmount
 */
export function useComponentTracking(componentName: string) {
  useEffect(() => {
    trackEvent('component_mounted', {
      component: componentName,
      category: 'component_lifecycle',
    });

    return () => {
      trackEvent('component_unmounted', {
        component: componentName,
        category: 'component_lifecycle',
      });
    };
  }, [componentName]);
}

/**
 * Track errors in component
 */
export function useErrorTracking(componentName: string) {
  const trackComponentError = useCallback(
    (error: Error | string, context?: Record<string, any>) => {
      trackError(error, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  return trackComponentError;
}

/**
 * Track button clicks
 */
export function useButtonTracking(buttonName: string, location: string) {
  const trackClick = useCallback(() => {
    trackEvent('button_clicked', {
      button_name: buttonName,
      location,
      category: 'ui_interaction',
    });
  }, [buttonName, location]);

  return trackClick;
}

/**
 * Track form submissions
 */
export function useFormTracking(formName: string) {
  const trackSubmit = useCallback(
    (success: boolean, error?: string) => {
      trackEvent('form_submitted', {
        form_name: formName,
        success,
        error,
        category: 'form_interaction',
      });
    },
    [formName]
  );

  return trackSubmit;
}

/**
 * Track API calls
 */
export function useAPITracking(endpoint: string) {
  const trackAPICall = useCallback(
    (method: string, status: number, duration: number) => {
      trackEvent('api_call', {
        endpoint,
        method,
        status,
        duration_ms: duration,
        category: 'api_interaction',
      });
    },
    [endpoint]
  );

  return trackAPICall;
}

/**
 * Track feature usage
 */
export function useFeatureTracking(featureName: string) {
  const trackFeatureUse = useCallback(
    (action: string, properties?: Record<string, any>) => {
      trackEvent('feature_used', {
        feature: featureName,
        action,
        ...properties,
        category: 'feature_usage',
      });
    },
    [featureName]
  );

  return trackFeatureUse;
}

/**
 * Track time on page
 */
export function useTimeOnPage(pageName?: string) {
  const startTime = useRef<number | undefined>(undefined);
  const pathname = usePathname();

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      if (startTime.current) {
        const timeSpent = Date.now() - startTime.current;
        trackEvent('time_on_page', {
          page: pageName || pathname,
          duration_seconds: Math.floor(timeSpent / 1000),
          category: 'engagement',
        });
      }
    };
  }, [pageName, pathname]);
}

/**
 * Track scroll depth
 */
export function useScrollDepth(pageName: string) {
  const maxScrollDepth = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollDepth = ((scrollTop + windowHeight) / documentHeight) * 100;

      if (scrollDepth > maxScrollDepth.current) {
        maxScrollDepth.current = Math.floor(scrollDepth);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      
      if (maxScrollDepth.current > 0) {
        trackEvent('scroll_depth', {
          page: pageName || pathname || undefined,
          max_depth_percent: maxScrollDepth.current,
          category: 'engagement',
        });
      }
    };
  }, [pageName, pathname]);
}

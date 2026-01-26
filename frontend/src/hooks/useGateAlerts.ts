/**
 * useGateAlerts Hook
 *
 * Monitors gate readiness and triggers alerts when close to passing.
 * Provides notifications when projects reach 90%+ readiness.
 *
 * @story US-F15
 */

'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface GateAlert {
  id: string;
  projectId: string;
  stage: string;
  readinessScore: number;
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

interface UseGateAlertsOptions {
  projectId: string;
  stage: string;
  readinessScore: number;
  threshold?: number; // Alert threshold (default 0.9)
}

const ALERT_STORAGE_KEY = 'gate-alerts';
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useGateAlerts({
  projectId,
  stage,
  readinessScore,
  threshold = 0.9,
}: UseGateAlertsOptions) {
  const [alerts, setAlerts] = useState<GateAlert[]>([]);

  // Load alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ALERT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAlerts(parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })));
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = (newAlerts: GateAlert[]) => {
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(newAlerts));
    setAlerts(newAlerts);
  };

  // Check if should create alert
  useEffect(() => {
    // Only alert if readiness is at or above threshold
    if (readinessScore < threshold) return;

    // Check if we've already alerted for this project/stage recently
    const existingAlert = alerts.find(
      (a) => a.projectId === projectId && a.stage === stage && !a.dismissed
    );

    if (existingAlert) {
      // Check if alert is still within cooldown period
      const timeSinceAlert = Date.now() - existingAlert.timestamp.getTime();
      if (timeSinceAlert < ALERT_COOLDOWN_MS) {
        return; // Don't create duplicate alert
      }
    }

    // Create new alert
    const newAlert: GateAlert = {
      id: `${projectId}-${stage}-${Date.now()}`,
      projectId,
      stage,
      readinessScore,
      message: `Your ${stage} gate is ${Math.round(readinessScore * 100)}% ready to pass!`,
      timestamp: new Date(),
      dismissed: false,
    };

    const updatedAlerts = [...alerts.filter(a => a.id !== existingAlert?.id), newAlert];
    saveAlerts(updatedAlerts);

    // Track alert creation
    trackEvent('gate_alert_created', {
      project_id: projectId,
      stage,
      readiness_score: readinessScore,
      category: 'gate_scoring',
    });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Gate Almost Ready!', {
        body: newAlert.message,
        icon: '/favicon.ico',
        tag: newAlert.id,
      });
    }
  }, [projectId, stage, readinessScore, threshold, alerts]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Dismiss an alert
  const dismissAlert = (alertId: string) => {
    const updated = alerts.map(a =>
      a.id === alertId ? { ...a, dismissed: true } : a
    );
    saveAlerts(updated);

    trackEvent('gate_alert_dismissed', {
      alert_id: alertId,
      category: 'gate_scoring',
    });
  };

  // Clear old alerts (older than 7 days)
  const clearOldAlerts = () => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filtered = alerts.filter(a => a.timestamp.getTime() > sevenDaysAgo);
    saveAlerts(filtered);
  };

  // Get active (non-dismissed) alerts for current project
  const activeAlerts = alerts.filter(
    a => a.projectId === projectId && !a.dismissed
  );

  return {
    alerts: activeAlerts,
    dismissAlert,
    clearOldAlerts,
    requestNotificationPermission,
  };
}

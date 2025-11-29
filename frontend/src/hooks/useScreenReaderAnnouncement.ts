import { useCallback, useRef, useEffect } from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

interface UseScreenReaderAnnouncementOptions {
  /**
   * Default priority for announcements
   * - 'polite': Waits for current speech to finish (default)
   * - 'assertive': Interrupts current speech immediately
   */
  defaultPriority?: AnnouncementPriority;
  /**
   * Time in ms before removing the announcement element (default: 1000)
   */
  clearDelay?: number;
}

interface ScreenReaderAnnouncement {
  /**
   * Announce a message to screen readers
   */
  announce: (message: string, priority?: AnnouncementPriority) => void;
  /**
   * Announce that content is loading
   */
  announceLoading: (context?: string) => void;
  /**
   * Announce that an operation completed successfully
   */
  announceSuccess: (message: string) => void;
  /**
   * Announce an error (uses assertive priority)
   */
  announceError: (message: string) => void;
}

/**
 * Hook for announcing messages to screen readers using ARIA live regions
 *
 * Creates temporary live region elements that are announced by screen readers,
 * then automatically cleaned up. This is useful for dynamic content changes
 * that need to be communicated to users of assistive technology.
 *
 * @example
 * ```tsx
 * function AIChat() {
 *   const { announce, announceLoading, announceSuccess, announceError } = useScreenReaderAnnouncement();
 *
 *   const handleSubmit = async () => {
 *     announceLoading('Processing your request');
 *     try {
 *       await sendMessage();
 *       announceSuccess('Response received');
 *     } catch (error) {
 *       announceError('Failed to send message');
 *     }
 *   };
 * }
 * ```
 */
export function useScreenReaderAnnouncement(
  options: UseScreenReaderAnnouncementOptions = {}
): ScreenReaderAnnouncement {
  const { defaultPriority = 'polite', clearDelay = 1000 } = options;
  const cleanupTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = cleanupTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const announce = useCallback(
    (message: string, priority: AnnouncementPriority = defaultPriority) => {
      if (!message.trim()) return;

      // Create a visually hidden live region element
      const el = document.createElement('div');
      el.setAttribute('aria-live', priority);
      el.setAttribute('aria-atomic', 'true');
      el.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');

      // Screen reader only styles (visually hidden but accessible)
      el.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;

      el.textContent = message;
      document.body.appendChild(el);

      // Remove after delay to allow screen reader to announce
      const timer = setTimeout(() => {
        if (document.body.contains(el)) {
          document.body.removeChild(el);
        }
        cleanupTimers.current.delete(timer);
      }, clearDelay);

      cleanupTimers.current.add(timer);
    },
    [defaultPriority, clearDelay]
  );

  const announceLoading = useCallback(
    (context?: string) => {
      const message = context ? `Loading ${context}...` : 'Loading...';
      announce(message, 'polite');
    },
    [announce]
  );

  const announceSuccess = useCallback(
    (message: string) => {
      announce(message, 'polite');
    },
    [announce]
  );

  const announceError = useCallback(
    (message: string) => {
      announce(message, 'assertive');
    },
    [announce]
  );

  return {
    announce,
    announceLoading,
    announceSuccess,
    announceError,
  };
}

/**
 * Simple function to make a one-off screen reader announcement
 * Use the hook for repeated announcements to properly manage cleanup
 */
export function announceToScreenReader(
  message: string,
  priority: AnnouncementPriority = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const el = document.createElement('div');
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => {
    if (document.body.contains(el)) {
      document.body.removeChild(el);
    }
  }, 1000);
}

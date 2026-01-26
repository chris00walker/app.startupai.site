/**
 * Email Sending Module
 *
 * Sends transactional emails via Resend.
 * Used for approval escalations, notifications, and system alerts.
 *
 * @story US-AA03
 */

import { Resend } from 'resend';

// Lazy-initialize Resend client (only when API key is available)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Email sender configuration
 */
const FROM_ADDRESS = process.env.EMAIL_FROM || 'StartupAI <noreply@startupai.site>';

/**
 * Send result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: {
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    text?: string;
  }
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: options?.text,
      replyTo: options?.replyTo,
      cc: options?.cc,
      bcc: options?.bcc,
    });

    if (error) {
      console.error('[email] Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[email] Error sending email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

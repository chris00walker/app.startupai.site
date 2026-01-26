/**
 * Escalation Email Template
 *
 * HTML email template for approval escalation notifications.
 * Sent when an approval has been pending for over 24 hours.
 *
 * @story US-AA03
 */

export interface EscalationEmailData {
  recipientName: string;
  approvalTitle: string;
  approvalType: string;
  projectName: string;
  pendingHours: number;
  approvalUrl: string;
  dashboardUrl: string;
}

/**
 * Generate escalation email HTML
 */
export function generateEscalationEmail(data: EscalationEmailData): string {
  const {
    recipientName,
    approvalTitle,
    approvalType,
    projectName,
    pendingHours,
    approvalUrl,
    dashboardUrl,
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approval Required - ${approvalTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: #dc2626; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Urgent: Approval Needed
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${recipientName},
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                An approval request has been pending for <strong>${pendingHours} hours</strong> and requires your attention.
              </p>

              <!-- Approval Details Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${approvalType.replace(/_/g, ' ')}
                    </p>
                    <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      ${approvalTitle}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Project: ${projectName}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${approvalUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">
                      Review Approval
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Or view all pending approvals on your <a href="${dashboardUrl}" style="color: #2563eb; text-decoration: none;">dashboard</a>.
              </p>

              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                You're receiving this email because you're set as an escalation contact.
                <a href="${dashboardUrl}/settings?tab=ai-approvals" style="color: #6b7280; text-decoration: none;">Update your preferences</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                StartupAI - AI-Powered Startup Validation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generate plain text version of escalation email
 */
export function generateEscalationEmailText(data: EscalationEmailData): string {
  const {
    recipientName,
    approvalTitle,
    approvalType,
    projectName,
    pendingHours,
    approvalUrl,
  } = data;

  return `
Hi ${recipientName},

URGENT: Approval Needed

An approval request has been pending for ${pendingHours} hours and requires your attention.

${approvalType.replace(/_/g, ' ').toUpperCase()}
${approvalTitle}
Project: ${projectName}

Review the approval here: ${approvalUrl}

---
You're receiving this email because you're set as an escalation contact.
StartupAI - AI-Powered Startup Validation
`.trim();
}

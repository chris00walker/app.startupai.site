/**
 * Integration Types
 *
 * TypeScript types for external service integrations.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

/**
 * Supported integration types - matches the database enum
 */
export type IntegrationType =
  | 'slack'
  | 'lark'
  | 'notion'
  | 'google_drive'
  | 'dropbox'
  | 'linear'
  | 'airtable'
  | 'hubspot'
  | 'figma'
  | 'github';

/**
 * Integration connection status
 */
export type IntegrationStatus = 'active' | 'expired' | 'revoked' | 'error';

/**
 * Integration categories for grouping in UI
 */
export type IntegrationCategory =
  | 'collaboration'
  | 'storage'
  | 'project_management'
  | 'sales'
  | 'creation'
  | 'development';

/**
 * Preference field configuration for dynamic form rendering
 */
export interface PreferenceFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'boolean' | 'select';
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

/**
 * Integration configuration - static metadata for each integration
 */
export interface IntegrationConfig {
  type: IntegrationType;
  name: string;
  description: string;
  category: IntegrationCategory;
  logo?: string; // Path to logo SVG in public/integrations/
  fallbackIcon: string; // Lucide icon name
  color: string; // Brand color for styling
  oauthScopes: string[];
  preferenceFields: PreferenceFieldConfig[];
}

/**
 * User integration - represents a connected integration
 */
export interface UserIntegration {
  id: string;
  userId: string;
  integrationType: IntegrationType;
  status: IntegrationStatus;

  // Provider account info (tokens never exposed to client)
  providerAccountId?: string;
  providerAccountName?: string;
  providerAccountEmail?: string;

  // Token expiry for UI badge
  tokenExpiresAt?: string;

  // Sync tracking
  lastSyncAt?: string;

  // Timestamps
  connectedAt: string;
  updatedAt: string;
}

/**
 * User integration with preferences joined
 */
export interface UserIntegrationWithPreferences extends UserIntegration {
  preferences: Record<string, unknown>;
}

/**
 * API response for list integrations
 */
export interface IntegrationsListResponse {
  integrations: UserIntegration[];
}

/**
 * API response for update preferences
 */
export interface UpdatePreferencesResponse {
  success: boolean;
  integration: UserIntegrationWithPreferences;
}

/**
 * OAuth state token payload (decoded JWT)
 */
export interface OAuthStatePayload {
  userId: string;
  integrationType: IntegrationType;
  nonce: string;
  exp: number;
}

/**
 * OAuth callback result from provider
 */
export interface OAuthCallbackResult {
  success: boolean;
  integrationType?: IntegrationType;
  error?: string;
}

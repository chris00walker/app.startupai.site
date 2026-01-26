/**
 * Integration Configuration
 *
 * Static configuration for all supported external integrations.
 * Includes OAuth settings, preference fields, and UI metadata.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

import type { IntegrationConfig, IntegrationType, IntegrationCategory } from '@/types/integrations';

/**
 * Category labels for grouping integrations in the UI
 */
export const INTEGRATION_CATEGORIES: Record<IntegrationCategory, { label: string; description: string }> = {
  collaboration: {
    label: 'Collaboration',
    description: 'Team communication and documentation tools',
  },
  storage: {
    label: 'Storage',
    description: 'Cloud storage and file management',
  },
  project_management: {
    label: 'Project Management',
    description: 'Task tracking and project organization',
  },
  sales: {
    label: 'Sales & CRM',
    description: 'Customer relationship management',
  },
  creation: {
    label: 'Creation',
    description: 'Design and creative tools',
  },
  development: {
    label: 'Development',
    description: 'Code repositories and development tools',
  },
};

/**
 * All integration configurations
 */
export const INTEGRATIONS: IntegrationConfig[] = [
  // Collaboration
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send workflow notifications and updates to Slack channels',
    category: 'collaboration',
    logo: '/integrations/slack.svg',
    fallbackIcon: 'MessageSquare',
    color: '#4A154B',
    oauthScopes: ['chat:write', 'channels:read', 'users:read'],
    preferenceFields: [
      {
        key: 'defaultChannel',
        label: 'Default Channel',
        type: 'text',
        placeholder: '#general',
        description: 'Channel for StartupAI notifications',
      },
      {
        key: 'notifyOnComplete',
        label: 'Notify on Workflow Completion',
        type: 'boolean',
        defaultValue: true,
      },
      {
        key: 'notifyOnApproval',
        label: 'Notify on Approval Required',
        type: 'boolean',
        defaultValue: true,
      },
    ],
  },
  {
    type: 'lark',
    name: 'Lark',
    description: 'Connect with Lark for team collaboration and notifications',
    category: 'collaboration',
    logo: '/integrations/lark.svg',
    fallbackIcon: 'Bird',
    color: '#00D6B9',
    oauthScopes: ['im:message', 'contact:user.id:readonly'],
    preferenceFields: [
      {
        key: 'defaultChat',
        label: 'Default Chat/Group',
        type: 'text',
        placeholder: 'Group name or chat ID',
        description: 'Default destination for notifications',
      },
    ],
  },
  {
    type: 'notion',
    name: 'Notion',
    description: 'Export validation reports and canvases to Notion',
    category: 'collaboration',
    logo: '/integrations/notion.svg',
    fallbackIcon: 'FileText',
    color: '#000000',
    oauthScopes: ['read_content', 'update_content', 'insert_content'],
    preferenceFields: [
      {
        key: 'workspaceId',
        label: 'Workspace',
        type: 'text',
        placeholder: 'Workspace name or ID',
      },
      {
        key: 'parentPageId',
        label: 'Parent Page',
        type: 'text',
        placeholder: 'Page ID or URL',
        description: 'Exports will be created under this page',
      },
      {
        key: 'autoExport',
        label: 'Auto-export Reports',
        type: 'boolean',
        defaultValue: false,
        description: 'Automatically export new reports to Notion',
      },
    ],
  },

  // Storage
  {
    type: 'google_drive',
    name: 'Google Drive',
    description: 'Store exports and backups in Google Drive',
    category: 'storage',
    logo: '/integrations/google-drive.svg',
    fallbackIcon: 'HardDrive',
    color: '#4285F4',
    oauthScopes: ['https://www.googleapis.com/auth/drive.readonly'],
    preferenceFields: [
      {
        key: 'defaultFolder',
        label: 'Default Folder',
        type: 'text',
        placeholder: '/StartupAI/Exports',
        description: 'Folder path for exports',
      },
    ],
  },
  {
    type: 'dropbox',
    name: 'Dropbox',
    description: 'Store exports and backups in Dropbox',
    category: 'storage',
    logo: '/integrations/dropbox.svg',
    fallbackIcon: 'Box',
    color: '#0061FF',
    oauthScopes: ['files.content.write', 'files.content.read'],
    preferenceFields: [
      {
        key: 'defaultFolder',
        label: 'Default Folder',
        type: 'text',
        placeholder: '/StartupAI/Exports',
        description: 'Folder path for exports',
      },
    ],
  },

  // Project Management
  {
    type: 'linear',
    name: 'Linear',
    description: 'Create and sync tasks with Linear',
    category: 'project_management',
    logo: '/integrations/linear.svg',
    fallbackIcon: 'CheckSquare',
    color: '#5E6AD2',
    oauthScopes: ['read', 'write', 'issues:create'],
    preferenceFields: [
      {
        key: 'teamId',
        label: 'Team',
        type: 'text',
        placeholder: 'Team name or ID',
      },
      {
        key: 'projectId',
        label: 'Project',
        type: 'text',
        placeholder: 'Project name or ID',
        description: 'Default project for new issues',
      },
    ],
  },
  {
    type: 'airtable',
    name: 'Airtable',
    description: 'Sync data with Airtable bases',
    category: 'project_management',
    logo: '/integrations/airtable.svg',
    fallbackIcon: 'Table',
    color: '#18BFFF',
    oauthScopes: ['data.records:read', 'data.records:write', 'schema.bases:read'],
    preferenceFields: [
      {
        key: 'baseId',
        label: 'Base',
        type: 'text',
        placeholder: 'Base name or ID',
      },
      {
        key: 'tableId',
        label: 'Table',
        type: 'text',
        placeholder: 'Table name or ID',
        description: 'Default table for syncing data',
      },
    ],
  },

  // Sales
  {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals with HubSpot CRM',
    category: 'sales',
    logo: '/integrations/hubspot.svg',
    fallbackIcon: 'Target',
    color: '#FF7A59',
    oauthScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read'],
    preferenceFields: [
      {
        key: 'pipelineId',
        label: 'Pipeline',
        type: 'text',
        placeholder: 'Pipeline name or ID (optional)',
        description: 'Default pipeline for new deals',
      },
    ],
  },

  // Creation
  {
    type: 'figma',
    name: 'Figma',
    description: 'Access Figma files and design assets',
    category: 'creation',
    logo: '/integrations/figma.svg',
    fallbackIcon: 'Palette',
    color: '#F24E1E',
    oauthScopes: ['files:read'],
    preferenceFields: [
      {
        key: 'teamId',
        label: 'Team',
        type: 'text',
        placeholder: 'Team name or ID',
      },
      {
        key: 'projectId',
        label: 'Project',
        type: 'text',
        placeholder: 'Project name or ID (optional)',
      },
    ],
  },

  // Development
  {
    type: 'github',
    name: 'GitHub',
    description: 'Connect to GitHub for code and issue tracking',
    category: 'development',
    logo: '/integrations/github.svg',
    fallbackIcon: 'Github',
    color: '#181717',
    oauthScopes: ['repo', 'read:user'],
    preferenceFields: [
      {
        key: 'repository',
        label: 'Repository',
        type: 'text',
        placeholder: 'owner/repo',
        description: 'Default repository for integrations',
      },
      {
        key: 'branch',
        label: 'Branch',
        type: 'text',
        placeholder: 'main',
        defaultValue: 'main',
        description: 'Default branch for operations',
      },
    ],
  },
];

/**
 * Get integration config by type
 */
export function getIntegrationConfig(type: IntegrationType): IntegrationConfig | undefined {
  return INTEGRATIONS.find((i) => i.type === type);
}

/**
 * Get integrations grouped by category
 */
export function getIntegrationsByCategory(): Map<IntegrationCategory, IntegrationConfig[]> {
  const grouped = new Map<IntegrationCategory, IntegrationConfig[]>();

  for (const integration of INTEGRATIONS) {
    const existing = grouped.get(integration.category) || [];
    existing.push(integration);
    grouped.set(integration.category, existing);
  }

  return grouped;
}

/**
 * Category display order for consistent UI rendering
 */
export const CATEGORY_ORDER: IntegrationCategory[] = [
  'collaboration',
  'storage',
  'project_management',
  'sales',
  'creation',
  'development',
];

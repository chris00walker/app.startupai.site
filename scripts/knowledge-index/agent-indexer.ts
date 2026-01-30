/**
 * Unified Knowledge Index System - Agent Indexer
 *
 * Parses agent context.md files and team-config.json to generate per-agent indexes.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PROJECT_ROOT,
  resolveAgentsRoot,
  isAgentExcluded,
  getApisForTool,
  extractTopics,
  AGENT_INDEXES_DIR,
} from './config';
import type {
  AgentIndexEntry,
  TeamConfig,
  TeamConfigAgent,
  DocRegistryEntry,
} from './types';

// =============================================================================
// Team Config Loading
// =============================================================================

/**
 * Load team-config.json from agents root
 */
export function loadTeamConfig(agentsRoot: string): TeamConfig | null {
  const configPath = path.join(agentsRoot, 'teams/startupai/team-config.json');

  if (!fs.existsSync(configPath)) {
    console.warn(`Warning: team-config.json not found at ${configPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as TeamConfig;
  } catch (error) {
    console.error(`Error loading team-config.json: ${error}`);
    return null;
  }
}

// =============================================================================
// Context.md Parsing
// =============================================================================

interface ParsedAgentContext {
  /** Agent name from directory */
  name: string;

  /** Path to context.md */
  contextPath: string;

  /** Domain keywords extracted from content */
  domainKeywords: string[];

  /** Tool references found */
  tools: string[];

  /** File/path patterns mentioned */
  filePatterns: string[];

  /** Skills mentioned (advisory only) */
  mentionedSkills: string[];

  /** Topics extracted from content */
  topics: string[];

  /** Relevant codebase areas section (if present) */
  relevantCodebaseAreas: string[];
}

/**
 * Parse an agent's context.md file
 */
export function parseAgentContext(contextPath: string): ParsedAgentContext | null {
  if (!fs.existsSync(contextPath)) {
    return null;
  }

  const content = fs.readFileSync(contextPath, 'utf-8');
  const contentNoCode = content.replace(/```[\s\S]*?```/g, '');
  const dirName = path.basename(path.dirname(contextPath));

  // Extract domain keywords from headers and emphasized text
  const domainKeywords: Set<string> = new Set();
  const headers = content.match(/^#{1,3}\s+(.+)$/gm) || [];
  for (const header of headers) {
    const headerText = header.replace(/^#+\s+/, '').toLowerCase();
    domainKeywords.add(headerText);
  }

  // Extract bold/emphasized terms
  const emphasized = content.match(/\*\*([^*]+)\*\*/g) || [];
  for (const term of emphasized) {
    const cleanTerm = term.replace(/\*\*/g, '').toLowerCase();
    if (cleanTerm.length > 2 && cleanTerm.length < 50) {
      domainKeywords.add(cleanTerm);
    }
  }

  // Extract tool references from "Tools Available" section
  const tools: string[] = [];
  const toolsMatch = content.match(/## Tools Available\n([\s\S]*?)(?=\n##|$)/);
  if (toolsMatch) {
    const toolLines = toolsMatch[1].match(/- \*\*(\w+)\*\*/g) || [];
    for (const line of toolLines) {
      const tool = line.replace(/- \*\*/, '').replace(/\*\*/, '');
      tools.push(tool);
    }
  }

  // Extract file patterns mentioned
  const filePatterns: string[] = [];
  const pathMatches = contentNoCode.match(/`([^`]*(?:\/[^`]+)+)`/g) || [];
  for (const match of pathMatches) {
    const cleanPath = match.replace(/`/g, '');
    if (cleanPath.includes('/') && !cleanPath.startsWith('http')) {
      filePatterns.push(cleanPath);
    }
  }

  // Extract skills from "Skill Ownership" section
  const mentionedSkills: string[] = [];
  const skillsMatch = content.match(/## Skill Ownership\n([\s\S]*?)(?=\n##|$)/);
  if (skillsMatch) {
    const skillLines = skillsMatch[1].match(/`\/[^`]+`/g) || [];
    for (const line of skillLines) {
      const skill = line.replace(/`/g, '');
      mentionedSkills.push(skill);
    }
  }

  // Extract topics from full content
  const topics = extractTopics(content);

  // Extract "Relevant Codebase Areas" section
  const relevantCodebaseAreas: string[] = [];
  const areasMatch = content.match(/## Relevant Codebase Areas\n([\s\S]*?)(?=\n##|$)/);
  if (areasMatch) {
    const areaLines = areasMatch[1].match(/- `[^`]+`/g) || [];
    for (const line of areaLines) {
      const area = line.replace(/- `/, '').replace(/`.*$/, '');
      relevantCodebaseAreas.push(area);
    }
  }

  return {
    name: dirName,
    contextPath,
    domainKeywords: Array.from(domainKeywords),
    tools,
    filePatterns,
    mentionedSkills,
    topics,
    relevantCodebaseAreas,
  };
}

// =============================================================================
// Agent Discovery
// =============================================================================

/**
 * Discover all agent context files
 */
export function discoverAgents(agentsRoot: string): ParsedAgentContext[] {
  const agentsDir = path.join(agentsRoot, 'agents');

  if (!fs.existsSync(agentsDir)) {
    console.warn(`Warning: Agents directory not found at ${agentsDir}`);
    return [];
  }

  const agents: ParsedAgentContext[] = [];
  const entries = fs.readdirSync(agentsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const agentDir = path.join(agentsDir, entry.name);

    // Check exclusion patterns
    if (isAgentExcluded(agentDir)) {
      console.log(`   Skipping excluded agent: ${entry.name}`);
      continue;
    }

    const contextPath = path.join(agentDir, 'context.md');
    const parsed = parseAgentContext(contextPath);

    if (parsed) {
      agents.push(parsed);
    }
  }

  return agents;
}

// =============================================================================
// Agent Index Generation
// =============================================================================

/**
 * Match agent topics to docs
 */
function matchAgentToDocs(
  agent: ParsedAgentContext,
  docsRegistry: DocRegistryEntry[],
  topicIndex: Record<string, string[]>
): string[] {
  const matchedDocs = new Set<string>();

  // Match via topics
  for (const topic of agent.topics) {
    const docs = topicIndex[topic] || [];
    for (const doc of docs) {
      matchedDocs.add(doc);
    }
  }

  // Match via domain keywords
  for (const keyword of agent.domainKeywords) {
    for (const entry of docsRegistry) {
      const searchText = `${entry.title} ${entry.topics.join(' ')}`.toLowerCase();
      if (searchText.includes(keyword.toLowerCase())) {
        matchedDocs.add(`${entry.repo}:${entry.path}`);
      }
    }
  }

  return Array.from(matchedDocs);
}

/**
 * Match agent tools to APIs
 */
function matchAgentToApis(
  agent: ParsedAgentContext,
  teamConfigAgent: TeamConfigAgent | null,
  apiInventory: { routes?: Array<{ path: string }> } | null
): string[] {
  const matchedApis = new Set<string>();

  // Get tools from team config (authoritative) or context
  const tools = teamConfigAgent?.tools || agent.tools;

  // Use tool-API mappings
  for (const tool of tools) {
    const apis = getApisForTool(tool);
    for (const api of apis) {
      matchedApis.add(api);
    }
  }

  // Also match based on domain keywords if API inventory available
  if (apiInventory?.routes) {
    for (const keyword of agent.domainKeywords) {
      for (const route of apiInventory.routes) {
        if (route.path.toLowerCase().includes(keyword.toLowerCase())) {
          matchedApis.add(route.path);
        }
      }
    }
  }

  return Array.from(matchedApis);
}

/**
 * Schema coverage report structure
 */
interface SchemaCoverageReport {
  stats?: { tables_in_drizzle?: number };
  missing_in_drizzle?: Array<{ tableName: string }>;
  unused_in_code?: Array<{ tableName: string; drizzleFile: string }>;
}

/**
 * Extract all known table names from schema coverage report
 */
function extractTableNamesFromCoverage(schemaCoverage: SchemaCoverageReport | null): Set<string> {
  const tableNames = new Set<string>();

  if (!schemaCoverage) {
    return tableNames;
  }

  // Tables missing in Drizzle (used in code but not in schema)
  if (schemaCoverage.missing_in_drizzle) {
    for (const entry of schemaCoverage.missing_in_drizzle) {
      tableNames.add(entry.tableName);
    }
  }

  // Tables unused in code (in Drizzle but not referenced)
  if (schemaCoverage.unused_in_code) {
    for (const entry of schemaCoverage.unused_in_code) {
      tableNames.add(entry.tableName);
    }
  }

  return tableNames;
}

/**
 * Match agent to schemas using schema-coverage-report.json
 */
function matchAgentToSchemas(
  agent: ParsedAgentContext,
  schemaCoverage: SchemaCoverageReport | null
): string[] {
  const matchedSchemas = new Set<string>();

  // Get all known table names from schema coverage report
  const knownTables = extractTableNamesFromCoverage(schemaCoverage);

  // Match file patterns to schema files
  for (const pattern of agent.filePatterns) {
    if (pattern.includes('db/schema') || pattern.includes('schema')) {
      // Extract potential table names from path
      const tableName = path.basename(pattern, path.extname(pattern));
      matchedSchemas.add(tableName);
    }
  }

  // Match domain keywords to known tables from schema coverage
  for (const keyword of agent.domainKeywords) {
    const keywordLower = keyword.toLowerCase();
    for (const tableName of knownTables) {
      // Match if keyword is contained in table name or vice versa
      const tableNameLower = tableName.toLowerCase();
      if (tableNameLower.includes(keywordLower) || keywordLower.includes(tableNameLower)) {
        matchedSchemas.add(tableName);
      }
    }
  }

  // Also match against common schema topic keywords for agents without direct matches
  const schemaKeywordMap: Record<string, string[]> = {
    auth: ['users', 'sessions'],
    evidence: ['evidence', 'validation_evidence'],
    validation: ['validation_runs', 'validation_progress'],
    approval: ['approval_requests', 'approval_history', 'approval_preferences'],
    brief: ['entrepreneur_briefs', 'founders_briefs'],
    consultant: ['consultant_profiles', 'consultant_onboarding_sessions', 'clients'],
    onboarding: ['onboarding_sessions', 'entrepreneur_briefs'],
    project: ['projects'],
    hypothesis: ['hypotheses'],
    experiment: ['experiments', 'test_cards', 'learning_cards'],
  };

  for (const topic of agent.topics) {
    const relatedTables = schemaKeywordMap[topic.toLowerCase()];
    if (relatedTables) {
      for (const table of relatedTables) {
        matchedSchemas.add(table);
      }
    }
  }

  return Array.from(matchedSchemas);
}

/**
 * Match agent to user stories
 */
function matchAgentToStories(
  agent: ParsedAgentContext,
  storyCodeMap: { stories?: Record<string, { title: string }> } | null
): string[] {
  const matchedStories = new Set<string>();

  if (!storyCodeMap?.stories) {
    return [];
  }

  // Match based on agent topics and story titles
  for (const [storyId, story] of Object.entries(storyCodeMap.stories)) {
    const storyText = `${storyId} ${story.title}`.toLowerCase();

    for (const topic of agent.topics) {
      if (storyText.includes(topic.toLowerCase())) {
        matchedStories.add(storyId);
        break;
      }
    }

    for (const keyword of agent.domainKeywords) {
      if (storyText.includes(keyword.toLowerCase())) {
        matchedStories.add(storyId);
        break;
      }
    }
  }

  return Array.from(matchedStories);
}

/**
 * Generate agent index entry
 */
export function generateAgentIndex(
  agent: ParsedAgentContext,
  teamConfig: TeamConfig | null,
  docsRegistry: DocRegistryEntry[],
  topicIndex: Record<string, string[]>,
  storyCodeMap: unknown,
  apiInventory: unknown,
  schemaCoverage: unknown
): AgentIndexEntry {
  const teamConfigAgent = teamConfig?.agents[agent.name] || null;

  // Get skills from team-config.json (authoritative)
  const skills = teamConfigAgent?.skills || [];

  // Check for skill conflicts with context.md
  if (agent.mentionedSkills.length > 0 && skills.length > 0) {
    const contextSkills = new Set(agent.mentionedSkills);
    const configSkills = new Set(skills);

    const inContextNotConfig = agent.mentionedSkills.filter((s) => !configSkills.has(s));
    const inConfigNotContext = skills.filter((s) => !contextSkills.has(s));

    if (inContextNotConfig.length > 0) {
      console.warn(
        `   Warning: ${agent.name} context.md mentions skills not in team-config: ${inContextNotConfig.join(', ')}`
      );
    }
    if (inConfigNotContext.length > 0) {
      console.warn(
        `   Warning: ${agent.name} team-config has skills not in context.md: ${inConfigNotContext.join(', ')}`
      );
    }
  }

  // Generate matches
  const relevant_docs = matchAgentToDocs(agent, docsRegistry, topicIndex);
  const relevant_apis = matchAgentToApis(
    agent,
    teamConfigAgent,
    apiInventory as { routes?: Array<{ path: string }> } | null
  );
  const relevant_schemas = matchAgentToSchemas(
    agent,
    schemaCoverage as { stats?: { tables_in_drizzle?: number } } | null
  );
  const relevant_stories = matchAgentToStories(
    agent,
    storyCodeMap as { stories?: Record<string, { title: string }> } | null
  );

  // Dedupe with curated areas (context.md entries first)
  const deduped_docs = dedupeWithCurated(relevant_docs, agent.relevantCodebaseAreas);

  return {
    generated_from: agent.contextPath,
    relevant_docs: deduped_docs,
    relevant_schemas,
    relevant_apis,
    relevant_stories,
    skills,
  };
}

/**
 * Dedupe generated matches with curated entries from context.md
 */
function dedupeWithCurated(generated: string[], curated: string[]): string[] {
  // Normalize paths for comparison
  const normalize = (p: string) => p.replace(/^~\//, '').replace(/\/+/g, '/').toLowerCase();

  const curatedNormalized = new Set(curated.map(normalize));
  const result = [...curated]; // Curated first

  for (const item of generated) {
    const normalized = normalize(item);
    if (!curatedNormalized.has(normalized)) {
      result.push(item);
    }
  }

  return result;
}

// =============================================================================
// Index File Writing
// =============================================================================

/**
 * Write per-agent index file
 */
export function writeAgentIndex(
  agentName: string,
  index: AgentIndexEntry
): string {
  const indexDir = path.join(PROJECT_ROOT, AGENT_INDEXES_DIR);

  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  const indexPath = path.join(indexDir, `${agentName}.json`);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  return indexPath;
}

/**
 * Optionally inject pointer into context.md (if KNOWLEDGE_INDEX_UPDATE_CONTEXT=1)
 */
export function injectContextPointer(
  contextPath: string,
  agentName: string
): boolean {
  if (process.env.KNOWLEDGE_INDEX_UPDATE_CONTEXT !== '1') {
    return false;
  }

  if (!fs.existsSync(contextPath)) {
    return false;
  }

  const content = fs.readFileSync(contextPath, 'utf-8');
  const pointerLine = `Docs Index: docs/traceability/agent-indexes/${agentName}.json`;

  // Check if pointer already exists
  if (content.includes('Docs Index:')) {
    // Update existing pointer
    const updated = content.replace(
      /Docs Index:.*$/m,
      pointerLine
    );
    fs.writeFileSync(contextPath, updated);
    return true;
  }

  // Add pointer at the end
  const updated = content.trimEnd() + '\n\n' + pointerLine + '\n';
  fs.writeFileSync(contextPath, updated);
  return true;
}

// =============================================================================
// Main Export
// =============================================================================

export interface AgentIndexingResult {
  agents: Record<string, AgentIndexEntry>;
  summary: {
    total_agents: number;
    indexed_agents: number;
    skipped_agents: number;
    context_pointers_added: number;
  };
}

/**
 * Check if an agent is archived via team-config.json
 */
function isAgentArchivedInConfig(agentName: string, teamConfig: TeamConfig | null): boolean {
  if (!teamConfig) {
    return false;
  }
  const agentConfig = teamConfig.agents[agentName];
  return agentConfig?.archived === true;
}

/**
 * Index all agents and return results
 */
export function indexAllAgents(
  docsRegistry: DocRegistryEntry[],
  topicIndex: Record<string, string[]>,
  storyCodeMap: unknown,
  apiInventory: unknown,
  schemaCoverage: unknown
): AgentIndexingResult {
  const agentsRoot = resolveAgentsRoot();
  const teamConfig = loadTeamConfig(agentsRoot);
  const agents = discoverAgents(agentsRoot);

  const result: AgentIndexingResult = {
    agents: {},
    summary: {
      total_agents: agents.length,
      indexed_agents: 0,
      skipped_agents: 0,
      context_pointers_added: 0,
    },
  };

  for (const agent of agents) {
    // Check if agent is archived in team-config.json
    if (isAgentArchivedInConfig(agent.name, teamConfig)) {
      console.log(`   Skipping archived agent (team-config): ${agent.name}`);
      result.summary.skipped_agents++;
      continue;
    }

    console.log(`   Indexing: ${agent.name}`);

    const index = generateAgentIndex(
      agent,
      teamConfig,
      docsRegistry,
      topicIndex,
      storyCodeMap,
      apiInventory,
      schemaCoverage
    );

    result.agents[agent.name] = index;
    result.summary.indexed_agents++;

    // Write per-agent file
    writeAgentIndex(agent.name, index);

    // Optionally inject pointer
    if (injectContextPointer(agent.contextPath, agent.name)) {
      result.summary.context_pointers_added++;
    }
  }

  return result;
}

/**
 * CrewAI Enterprise Integration Types
 *
 * Type definitions for interacting with CrewAI AMP via the Enterprise API.
 */

/**
 * Entrepreneur input format expected by StartupAI CrewAI crew
 */
export interface EntrepreneurInput {
  target_customer: string;
  problem_description: string;
  pain_level?: number;
  solution_description: string;
  key_differentiators?: string[];
  competitors?: string[];
  available_channels?: string[];
  budget_range?: string;
  business_stage?: string;
  goals?: string;
}

/**
 * Response from CrewAI kickoff endpoint
 */
export interface KickoffResponse {
  kickoff_id: string;
  status?: string;
}

/**
 * CrewAI workflow execution status
 */
export type CrewStatus = {
  state: 'STARTED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  status: string;
  result?: any;
  result_json?: any;
  last_step?: any;
  last_executed_task?: any;
  source?: string;
  progress?: number;
  current_agent?: string;
};

/**
 * Entrepreneur brief data from database
 */
export interface EntrepreneurBrief {
  id?: string;
  session_id?: string;
  user_id?: string;
  customer_segments?: any[];
  primary_customer_segment?: any;
  problem_description?: string;
  problem_pain_level?: number;
  solution_description?: string;
  unique_value_proposition?: string;
  differentiation_factors?: any[];
  competitors?: any[];
  competitive_alternatives?: any[];
  budget_range?: string;
  available_channels?: any[];
  business_stage?: string;
  three_month_goals?: any[];
  created_at?: string;
  updated_at?: string;
}

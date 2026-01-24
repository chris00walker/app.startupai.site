CREATE TYPE "public"."integration_status" AS ENUM('active', 'expired', 'revoked', 'error');--> statement-breakpoint
CREATE TYPE "public"."integration_type" AS ENUM('slack', 'lark', 'notion', 'google_drive', 'dropbox', 'linear', 'airtable', 'hubspot', 'figma', 'github');--> statement-breakpoint
CREATE TABLE "learning_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"experiment_id" uuid,
	"observations" text,
	"insights" text,
	"decision" text,
	"owner" text,
	"decision_date" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crewai_validation_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text,
	"kickoff_id" text,
	"iteration" integer DEFAULT 1 NOT NULL,
	"phase" text DEFAULT 'ideation' NOT NULL,
	"current_risk_axis" text DEFAULT 'desirability',
	"problem_fit" text DEFAULT 'unknown',
	"current_segment" text,
	"current_value_prop" text,
	"vpc_document_url" text,
	"bmc_document_url" text,
	"desirability_signal" text DEFAULT 'no_signal' NOT NULL,
	"feasibility_signal" text DEFAULT 'unknown' NOT NULL,
	"viability_signal" text DEFAULT 'unknown' NOT NULL,
	"last_pivot_type" text DEFAULT 'none',
	"pending_pivot_type" text DEFAULT 'none',
	"pivot_recommendation" text,
	"human_approval_status" text DEFAULT 'not_required',
	"human_comment" text,
	"human_input_required" boolean DEFAULT false,
	"human_input_reason" text,
	"desirability_evidence" jsonb,
	"feasibility_evidence" jsonb,
	"viability_evidence" jsonb,
	"customer_profiles" jsonb,
	"value_maps" jsonb,
	"competitor_report" jsonb,
	"assumptions" jsonb,
	"desirability_experiments" jsonb,
	"downgrade_active" boolean DEFAULT false,
	"last_feasibility_artifact" jsonb,
	"last_viability_metrics" jsonb,
	"qa_reports" jsonb,
	"current_qa_status" text,
	"framework_compliance" boolean DEFAULT false,
	"logical_consistency" boolean DEFAULT false,
	"completeness" boolean DEFAULT false,
	"business_idea" text,
	"entrepreneur_input" text,
	"target_segments" jsonb,
	"problem_statement" text,
	"solution_description" text,
	"revenue_model" text,
	"segment_fit_scores" jsonb,
	"analysis_insights" jsonb,
	"ad_impressions" integer DEFAULT 0,
	"ad_clicks" integer DEFAULT 0,
	"ad_signups" integer DEFAULT 0,
	"ad_spend" numeric(12, 2) DEFAULT 0,
	"api_costs" jsonb,
	"infra_costs" jsonb,
	"total_monthly_cost" numeric(12, 2) DEFAULT 0,
	"cac" numeric(12, 2) DEFAULT 0,
	"ltv" numeric(12, 2) DEFAULT 0,
	"ltv_cac_ratio" numeric(6, 2) DEFAULT 0,
	"gross_margin" numeric(5, 4) DEFAULT 0,
	"tam" numeric(15, 2) DEFAULT 0,
	"synthesis_confidence" numeric(4, 3) DEFAULT 0,
	"evidence_summary" text,
	"final_recommendation" text,
	"next_steps" jsonb,
	"daily_spend_usd" numeric(12, 2) DEFAULT 0,
	"campaign_spend_usd" numeric(12, 2) DEFAULT 0,
	"budget_status" text DEFAULT 'ok',
	"budget_escalation_triggered" boolean DEFAULT false,
	"budget_kill_triggered" boolean DEFAULT false,
	"business_model_type" text,
	"business_model_inferred_from" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_model_canvas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"source" text DEFAULT 'crewai' NOT NULL,
	"kickoff_id" text,
	"customer_segments" jsonb DEFAULT '[]'::jsonb,
	"value_propositions" jsonb DEFAULT '[]'::jsonb,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"customer_relationships" jsonb DEFAULT '[]'::jsonb,
	"revenue_streams" jsonb DEFAULT '[]'::jsonb,
	"key_resources" jsonb DEFAULT '[]'::jsonb,
	"key_activities" jsonb DEFAULT '[]'::jsonb,
	"key_partners" jsonb DEFAULT '[]'::jsonb,
	"cost_structure" jsonb DEFAULT '[]'::jsonb,
	"original_crewai_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "value_proposition_canvas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"segment_key" text NOT NULL,
	"segment_name" text NOT NULL,
	"source" text DEFAULT 'crewai' NOT NULL,
	"kickoff_id" text,
	"jobs" jsonb DEFAULT '[]'::jsonb,
	"pains" jsonb DEFAULT '[]'::jsonb,
	"gains" jsonb DEFAULT '[]'::jsonb,
	"resonance_score" numeric(3, 2),
	"products_and_services" jsonb DEFAULT '[]'::jsonb,
	"pain_relievers" jsonb DEFAULT '[]'::jsonb,
	"gain_creators" jsonb DEFAULT '[]'::jsonb,
	"differentiators" jsonb DEFAULT '[]'::jsonb,
	"original_crewai_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"project_id" uuid,
	"kickoff_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultant_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultant_id" uuid NOT NULL,
	"client_id" uuid,
	"invite_email" text NOT NULL,
	"invite_token" text NOT NULL,
	"invite_expires_at" timestamp with time zone NOT NULL,
	"client_name" text,
	"status" text DEFAULT 'invited' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"linked_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"archived_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultant_clients_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "user_integration_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"provider_account_id" text,
	"provider_account_name" text,
	"provider_account_email" text,
	"last_sync_at" timestamp with time zone,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "risk_budget_planned" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "risk_budget_actual" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "risk_budget_delta" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "evidence_quality" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "experiments" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "raw_idea" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hints" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "additional_context" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "hypothesis" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "test_method" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "metric" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "success_criteria" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "expected_outcome" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "cost_time" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "cost_money" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "actual_outcome" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "actual_metric_value" text;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "learning_card_id" uuid;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "owner" text;--> statement-breakpoint
ALTER TABLE "learning_cards" ADD CONSTRAINT "learning_cards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_cards" ADD CONSTRAINT "learning_cards_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crewai_validation_states" ADD CONSTRAINT "crewai_validation_states_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crewai_validation_states" ADD CONSTRAINT "crewai_validation_states_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_model_canvas" ADD CONSTRAINT "business_model_canvas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_model_canvas" ADD CONSTRAINT "business_model_canvas_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_proposition_canvas" ADD CONSTRAINT "value_proposition_canvas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_proposition_canvas" ADD CONSTRAINT "value_proposition_canvas_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultant_clients" ADD CONSTRAINT "consultant_clients_consultant_id_user_profiles_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultant_clients" ADD CONSTRAINT "consultant_clients_client_id_user_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_public_activity_log_founder_id" ON "public_activity_log" USING btree ("founder_id");--> statement-breakpoint
CREATE INDEX "idx_public_activity_log_activity_type" ON "public_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_public_activity_log_created_at" ON "public_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_public_activity_log_kickoff_id" ON "public_activity_log" USING btree ("kickoff_id");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_consultant" ON "consultant_clients" USING btree ("consultant_id");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_client" ON "consultant_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_token" ON "consultant_clients" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_status" ON "consultant_clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_invite_email" ON "consultant_clients" USING btree ("invite_email");--> statement-breakpoint
CREATE INDEX "idx_consultant_clients_consultant_status" ON "consultant_clients" USING btree ("consultant_id","status");--> statement-breakpoint
CREATE INDEX "user_integration_prefs_user_id_idx" ON "user_integration_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_integration_prefs_user_type_unique" ON "user_integration_preferences" USING btree ("user_id","integration_type");--> statement-breakpoint
CREATE INDEX "user_integrations_user_id_idx" ON "user_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_integrations_status_idx" ON "user_integrations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_integrations_user_type_unique" ON "user_integrations" USING btree ("user_id","integration_type");--> statement-breakpoint

-- RLS Policies for Integration Tables
-- Users can only access their own integrations

ALTER TABLE "user_integrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "user_integrations_select_own" ON "user_integrations"
  FOR SELECT USING (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integrations_insert_own" ON "user_integrations"
  FOR INSERT WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integrations_update_own" ON "user_integrations"
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integrations_delete_own" ON "user_integrations"
  FOR DELETE USING (user_id = auth.uid());--> statement-breakpoint

ALTER TABLE "user_integration_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "user_integration_preferences_select_own" ON "user_integration_preferences"
  FOR SELECT USING (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integration_preferences_insert_own" ON "user_integration_preferences"
  FOR INSERT WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integration_preferences_update_own" ON "user_integration_preferences"
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint

CREATE POLICY "user_integration_preferences_delete_own" ON "user_integration_preferences"
  FOR DELETE USING (user_id = auth.uid());
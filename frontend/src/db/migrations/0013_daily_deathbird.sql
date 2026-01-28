CREATE TYPE "public"."confidence_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "ad_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"platform_campaign_id" text,
	"platform_ad_set_id" text,
	"platform_ad_id" text,
	"metric_date" date NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"frequency" numeric(8, 4) DEFAULT 0,
	"clicks" integer DEFAULT 0 NOT NULL,
	"unique_clicks" integer DEFAULT 0 NOT NULL,
	"ctr" numeric(8, 6) DEFAULT 0,
	"spend_cents" integer DEFAULT 0 NOT NULL,
	"cpc_cents" integer DEFAULT 0,
	"cpm_cents" integer DEFAULT 0,
	"landing_page_views" integer DEFAULT 0 NOT NULL,
	"form_submissions" integer DEFAULT 0 NOT NULL,
	"conversion_rate" numeric(8, 6) DEFAULT 0,
	"cost_per_conversion_cents" integer DEFAULT 0,
	"conversion_actions" jsonb,
	"desirability_score" integer DEFAULT 0 NOT NULL,
	"confidence_level" "confidence_level" DEFAULT 'low' NOT NULL,
	"benchmark_comparison" jsonb,
	"raw_insights" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_performance_metrics_campaign_id_metric_date_unique" UNIQUE("campaign_id","metric_date")
);
--> statement-breakpoint
CREATE TABLE "copy_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vpc_id" uuid,
	"vpc_version" integer DEFAULT 1 NOT NULL,
	"segment_key" text,
	"headlines" jsonb NOT NULL,
	"primary_texts" jsonb NOT NULL,
	"pains" jsonb NOT NULL,
	"gains" jsonb NOT NULL,
	"product" jsonb NOT NULL,
	"image_keywords" jsonb NOT NULL,
	"ctas" jsonb NOT NULL,
	"model_used" text,
	"prompt_version" text,
	"generation_cost" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"imported_data" jsonb NOT NULL,
	"mapping_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"integration_type" "integration_type" NOT NULL,
	"source_schema" jsonb DEFAULT '[]' NOT NULL,
	"mappings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unmapped_fields" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"integration_type" "integration_type" NOT NULL,
	"target_id" text,
	"target_url" text,
	"synced_data" jsonb NOT NULL,
	"status" text DEFAULT 'pending',
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "validation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"run_id" text,
	"session_id" text,
	"provider" text DEFAULT 'modal',
	"status" text DEFAULT 'pending' NOT NULL,
	"current_phase" integer DEFAULT 0 NOT NULL,
	"phase_name" text DEFAULT 'Onboarding',
	"phase_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hitl_state" text,
	"hitl_checkpoint" jsonb,
	"hitl_checkpoint_at" timestamp with time zone,
	"modal_function_id" text,
	"inputs" jsonb DEFAULT '{}'::jsonb,
	"outputs" jsonb DEFAULT '{}'::jsonb,
	"progress" jsonb DEFAULT '{}'::jsonb,
	"error" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" text NOT NULL,
	"phase" integer NOT NULL,
	"crew" text NOT NULL,
	"task" text,
	"agent" text,
	"status" text NOT NULL,
	"progress_pct" integer,
	"output" jsonb,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founders_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"session_id" text,
	"user_id" uuid,
	"idea_one_liner" text,
	"idea_description" text,
	"idea_inspiration" text,
	"idea_unique_insight" text,
	"problem_statement" text,
	"problem_who_has_this" text,
	"problem_frequency" text,
	"problem_current_alternatives" text,
	"problem_why_alternatives_fail" text,
	"problem_evidence" text,
	"customer_primary_segment" text,
	"customer_segment_description" text,
	"customer_characteristics" jsonb DEFAULT '[]'::jsonb,
	"customer_where_to_find" text,
	"customer_estimated_size" text,
	"solution_proposed" text,
	"solution_key_features" jsonb DEFAULT '[]'::jsonb,
	"solution_differentiation" text,
	"solution_unfair_advantage" text,
	"key_assumptions" jsonb DEFAULT '[]'::jsonb,
	"problem_resonance_target" numeric(3, 2) DEFAULT '0.50',
	"zombie_ratio_max" numeric(3, 2) DEFAULT '0.30',
	"fit_score_target" integer DEFAULT 70,
	"qa_legitimacy_check" text DEFAULT 'pending',
	"qa_legitimacy_notes" text,
	"qa_intent_verification" text DEFAULT 'pending',
	"qa_intent_notes" text,
	"qa_overall_status" text DEFAULT 'pending',
	"qa_issues" jsonb,
	"interview_duration_minutes" integer DEFAULT 0,
	"interview_turns" integer DEFAULT 0,
	"interview_followup_questions" integer DEFAULT 0,
	"interview_confidence_score" numeric(3, 2) DEFAULT '0',
	"approval_status" text DEFAULT 'pending',
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "founders_briefs_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DEFAULT 'founder_trial'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'founder', 'consultant', 'founder_trial', 'consultant_trial');--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DEFAULT 'founder_trial'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "trial_intent" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "plan_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultant_clients" ADD COLUMN "is_mock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ad_performance_metrics" ADD CONSTRAINT "ad_performance_metrics_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_performance_metrics" ADD CONSTRAINT "ad_performance_metrics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_performance_metrics" ADD CONSTRAINT "ad_performance_metrics_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_banks" ADD CONSTRAINT "copy_banks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copy_banks" ADD CONSTRAINT "copy_banks_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_runs" ADD CONSTRAINT "validation_runs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founders_briefs" ADD CONSTRAINT "founders_briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founders_briefs" ADD CONSTRAINT "founders_briefs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founders_briefs" ADD CONSTRAINT "founders_briefs_approved_by_user_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_history_user_id_idx" ON "import_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "import_history_project_id_idx" ON "import_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "import_history_type_idx" ON "import_history" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX "import_history_created_idx" ON "import_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "field_mappings_user_id_idx" ON "field_mappings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "field_mappings_type_idx" ON "field_mappings" USING btree ("integration_type");--> statement-breakpoint
CREATE UNIQUE INDEX "field_mappings_user_name_unique" ON "field_mappings" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "sync_history_user_id_idx" ON "sync_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sync_history_project_id_idx" ON "sync_history" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "sync_history_type_idx" ON "sync_history" USING btree ("integration_type");--> statement-breakpoint
CREATE INDEX "sync_history_status_idx" ON "sync_history" USING btree ("status");
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"company" text,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"subscription_status" text DEFAULT 'trial',
	"trial_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"stage" text DEFAULT 'DESIRABILITY' NOT NULL,
	"gate_status" text DEFAULT 'Pending',
	"risk_budget_planned" numeric(10, 2) DEFAULT 0,
	"risk_budget_actual" numeric(10, 2) DEFAULT 0,
	"risk_budget_delta" numeric(10, 2) DEFAULT 0,
	"assigned_consultant" text,
	"last_activity" timestamp with time zone DEFAULT now(),
	"next_gate_date" date,
	"evidence_quality" numeric(3, 2) DEFAULT 0,
	"hypotheses_count" integer DEFAULT 0,
	"experiments_count" integer DEFAULT 0,
	"evidence_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text,
	"category" text,
	"summary" text,
	"full_text" text,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"strength" text,
	"is_contradiction" boolean DEFAULT false,
	"fit_type" text,
	"source_type" text,
	"source_url" text,
	"author" text,
	"source" text,
	"occurred_on" date,
	"linked_assumptions" text[],
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"model" text,
	"tokens_used" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hypotheses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"statement" text NOT NULL,
	"type" text NOT NULL,
	"importance" text NOT NULL,
	"evidence_strength" text NOT NULL,
	"status" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"hypothesis_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"fit_type" text,
	"evidence_strength" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"progress" integer DEFAULT 0,
	"estimated_time" text,
	"potential_impact" text,
	"steps" text[],
	"results_quantitative" text,
	"results_qualitative" text,
	"results_submitted_at" timestamp with time zone,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hypotheses" ADD CONSTRAINT "hypotheses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_hypothesis_id_hypotheses_id_fk" FOREIGN KEY ("hypothesis_id") REFERENCES "public"."hypotheses"("id") ON DELETE set null ON UPDATE no action;
CREATE TYPE "public"."ad_platform" AS ENUM('meta', 'google', 'tiktok', 'linkedin', 'x', 'pinterest');--> statement-breakpoint
CREATE TYPE "public"."ad_platform_status" AS ENUM('active', 'paused', 'error', 'expired');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'pending_approval', 'pending_deployment', 'active', 'paused', 'completed', 'error', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('landing_page_traffic', 'signup_conversion', 'survey_response', 'brand_awareness', 'price_test');--> statement-breakpoint
CREATE TABLE "ad_platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"account_id" text NOT NULL,
	"account_name" text,
	"credentials_encrypted" text NOT NULL,
	"business_manager_id" text,
	"agency_account_id" text,
	"webhook_url" text,
	"webhook_secret" text,
	"status" "ad_platform_status" DEFAULT 'active' NOT NULL,
	"last_health_check" timestamp with time zone,
	"last_successful_call" timestamp with time zone,
	"error_message" text,
	"error_code" text,
	"rate_limit_remaining" text,
	"rate_limit_reset_at" timestamp with time zone,
	"token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_budget_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_allocated" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total_spent" numeric(12, 2) DEFAULT 0 NOT NULL,
	"last_allocation_amount" numeric(12, 2) DEFAULT 0,
	"last_allocation_at" timestamp with time zone,
	"subscription_tier" text,
	"per_campaign_limit" numeric(12, 2) DEFAULT 50,
	"daily_spend_limit" numeric(12, 2) DEFAULT 25,
	"rollover_enabled" text DEFAULT 'true',
	"rollover_expires_days" integer DEFAULT 90,
	"status" text DEFAULT 'active' NOT NULL,
	"total_campaigns" integer DEFAULT 0,
	"active_campaigns" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_budget_pools_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "ad_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"hypothesis_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"campaign_type" "campaign_type" DEFAULT 'landing_page_traffic' NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"platform_campaign_id" text,
	"platform_ad_set_id" text,
	"platform_ad_id" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"status_reason" text,
	"budget_allocated" numeric(12, 2) NOT NULL,
	"budget_spent" numeric(12, 2) DEFAULT 0 NOT NULL,
	"daily_budget" numeric(12, 2),
	"scheduled_start_at" timestamp with time zone,
	"scheduled_end_at" timestamp with time zone,
	"actual_start_at" timestamp with time zone,
	"actual_end_at" timestamp with time zone,
	"template_id" text,
	"creative_data" jsonb,
	"targeting_data" jsonb,
	"performance_data" jsonb,
	"approved_at" timestamp with time zone,
	"approved_by" uuid,
	"rejection_reason" text,
	"created_by_agent" text,
	"last_updated_by_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_performance_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"spend" numeric(12, 2) DEFAULT 0 NOT NULL,
	"reach_unique" integer DEFAULT 0,
	"frequency" numeric(6, 3) DEFAULT 0,
	"video_views" integer DEFAULT 0,
	"video_views_p25" integer DEFAULT 0,
	"video_views_p50" integer DEFAULT 0,
	"video_views_p75" integer DEFAULT 0,
	"video_views_p100" integer DEFAULT 0,
	"signups" integer DEFAULT 0,
	"survey_responses" integer DEFAULT 0,
	"page_views" integer DEFAULT 0,
	"time_on_site_avg" integer DEFAULT 0,
	"ctr" numeric(8, 6) DEFAULT 0,
	"cpc" numeric(12, 4) DEFAULT 0,
	"cpa" numeric(12, 2) DEFAULT 0,
	"cpm" numeric(12, 4) DEFAULT 0,
	"impressions_delta" integer DEFAULT 0,
	"clicks_delta" integer DEFAULT 0,
	"conversions_delta" integer DEFAULT 0,
	"spend_delta" numeric(12, 2) DEFAULT 0,
	"relevance_score" numeric(4, 2),
	"quality_ranking" text,
	"engagement_rate_ranking" text,
	"conversion_rate_ranking" text,
	"platform_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ad_budget_pools" ADD CONSTRAINT "ad_budget_pools_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_hypothesis_id_hypotheses_id_fk" FOREIGN KEY ("hypothesis_id") REFERENCES "public"."hypotheses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_performance_snapshots" ADD CONSTRAINT "ad_performance_snapshots_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;
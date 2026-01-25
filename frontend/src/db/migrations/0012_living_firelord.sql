CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"action_description" text,
	"target_user_id" uuid,
	"target_resource_type" text,
	"target_resource_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"enabled_globally" boolean DEFAULT false NOT NULL,
	"percentage_rollout" integer DEFAULT 0 NOT NULL,
	"target_user_ids" text,
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"impersonating_user_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "enabled_integrations" jsonb DEFAULT '{"types":[],"skippedOnboarding":false,"lastConfiguredAt":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "show_integration_banner" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_user_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_target_user_id_user_profiles_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_created_by_id_user_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_id_user_profiles_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_user_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_impersonating_user_id_user_profiles_id_fk" FOREIGN KEY ("impersonating_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_audit_admin_id" ON "admin_audit_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_action_type" ON "admin_audit_log" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_target_user" ON "admin_audit_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_admin_audit_created_at" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_feature_flags_key" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_admin_sessions_token" ON "admin_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "idx_admin_sessions_admin" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_sessions_expires" ON "admin_sessions" USING btree ("expires_at");
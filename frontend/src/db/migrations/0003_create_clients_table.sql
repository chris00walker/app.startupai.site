-- Create clients table for consultant-managed clients
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"industry" text NOT NULL,
	"description" text,
	"business_model" text,
	"target_market" text,
	"current_challenges" text[] DEFAULT '{}',
	"goals" text[] DEFAULT '{}',
	"budget" numeric(12, 2),
	"timeline" text,
	"assigned_consultant" text,
	"status" text DEFAULT 'discovery' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add foreign key constraint to link clients to consultants (user_profiles)
ALTER TABLE "clients" ADD CONSTRAINT "clients_consultant_id_user_profiles_id_fk"
FOREIGN KEY ("consultant_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;

-- Create index on consultant_id for faster queries
CREATE INDEX IF NOT EXISTS "clients_consultant_id_idx" ON "clients" ("consultant_id");

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients" ("email");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS "clients_status_idx" ON "clients" ("status");

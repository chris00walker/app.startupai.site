CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"login_method" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_type" text,
	"browser" text,
	"operating_system" text,
	"location" text,
	"success" boolean DEFAULT true NOT NULL,
	"failure_reason" text,
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

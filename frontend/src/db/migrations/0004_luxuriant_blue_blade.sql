ALTER TABLE "user_profiles" ADD COLUMN "trial_intent" text DEFAULT 'founder_trial';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "timezone" text DEFAULT 'America/New_York';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "language" text DEFAULT 'English';--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "bio" text;
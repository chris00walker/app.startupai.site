-- Migration: Add Stripe-related fields to user_profiles
-- @story US-FT03

-- Add Stripe customer ID for linking to Stripe
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe subscription ID for tracking active subscriptions
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add plan_started_at for tracking when paid plan started
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;

-- Create indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription_id ON user_profiles(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN user_profiles.plan_started_at IS 'Timestamp when user started their paid plan';

-- Add avatar_url column if it doesn't exist
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Function to handle new user signup
-- This automatically creates a user_profile record when a user signs up via OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with data from OAuth provider (stored in raw_user_meta_data)
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    subscription_tier,
    plan_status
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'trial'::user_role),
    COALESCE(new.raw_user_meta_data->>'plan_type', 'trial'),
    'trialing'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  
  RETURN new;
END;
$$;

-- Create trigger that fires on user creation
-- This runs automatically whenever a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();;

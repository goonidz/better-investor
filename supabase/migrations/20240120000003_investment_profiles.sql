-- Create user investment profiles table
CREATE TABLE IF NOT EXISTS investment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  investment_horizon TEXT NOT NULL,
  risk_tolerance TEXT NOT NULL,
  investment_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE investment_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON investment_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON investment_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON investment_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_investment_profiles_user_id ON investment_profiles(user_id);

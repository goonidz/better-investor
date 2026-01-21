-- Projections table to save user simulations
CREATE TABLE IF NOT EXISTS projections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  current_age INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  return_rate DECIMAL NOT NULL,
  inflation_rate DECIMAL NOT NULL DEFAULT 0,
  initial_capital DECIMAL NOT NULL,
  annual_addition DECIMAL NOT NULL,
  annual_fees DECIMAL NOT NULL DEFAULT 0,
  final_balance DECIMAL,
  final_balance_real DECIMAL,
  monthly_income DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projections
CREATE POLICY "Users can view own projections" ON projections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projections" ON projections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projections" ON projections
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_projections_user_id ON projections(user_id);
CREATE INDEX idx_projections_created_at ON projections(created_at DESC);

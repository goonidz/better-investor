-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits table for monthly usage tracking
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  credits_used_cents DECIMAL(10,4) DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- RLS policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Chat messages: users can only see their own
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User credits: users can only see their own
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-reset credits monthly
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- If period_start is from a previous month, reset credits
  IF DATE_TRUNC('month', NEW.period_start) < DATE_TRUNC('month', NOW()) THEN
    NEW.credits_used_cents := 0;
    NEW.period_start := DATE_TRUNC('month', NOW());
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset on update
DROP TRIGGER IF EXISTS trigger_reset_monthly_credits ON user_credits;
CREATE TRIGGER trigger_reset_monthly_credits
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_credits();

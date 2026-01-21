-- Insider trading AI insights (generated once per day)
CREATE TABLE IF NOT EXISTS insider_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  notable_buys JSONB,
  notable_sells JSONB,
  sentiment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anyone can read (shared across all users)
ALTER TABLE insider_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read insider insights" ON insider_insights
  FOR SELECT USING (true);

-- Index for getting latest
CREATE INDEX idx_insider_insights_created_at ON insider_insights(created_at DESC);

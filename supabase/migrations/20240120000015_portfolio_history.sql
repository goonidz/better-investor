-- Portfolio value history for performance tracking
CREATE TABLE IF NOT EXISTS portfolio_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_value DECIMAL NOT NULL,
  total_cost DECIMAL,
  holdings_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own portfolio history" ON portfolio_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert portfolio history" ON portfolio_history
  FOR INSERT WITH CHECK (true);

-- Indexes for fast queries
CREATE INDEX idx_portfolio_history_user_date ON portfolio_history(user_id, date DESC);
CREATE INDEX idx_portfolio_history_date ON portfolio_history(date DESC);

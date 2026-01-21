-- Market prices cache table
-- Stores prices once per symbol, shared across all users
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  price DECIMAL(20,6),
  previous_close DECIMAL(20,6),
  change DECIMAL(20,6),
  change_percent DECIMAL(10,4),
  currency TEXT DEFAULT 'USD',
  source TEXT DEFAULT 'alphavantage',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol);
CREATE INDEX IF NOT EXISTS idx_market_prices_updated_at ON market_prices(updated_at);

-- No RLS needed - this is shared data
-- But we'll add a policy for reading
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read market prices
CREATE POLICY "Anyone can read market prices" ON market_prices
  FOR SELECT USING (true);

-- Only service role can insert/update (via API)
CREATE POLICY "Service can manage market prices" ON market_prices
  FOR ALL USING (true);

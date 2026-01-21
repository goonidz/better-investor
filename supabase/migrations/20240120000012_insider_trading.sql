-- Insider trading data from OpenInsider
CREATE TABLE IF NOT EXISTS insider_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filing_date TIMESTAMPTZ NOT NULL,
  trade_date DATE NOT NULL,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  insider_name TEXT NOT NULL,
  insider_title TEXT,
  trade_type TEXT NOT NULL, -- P (Purchase), S (Sale)
  price DECIMAL,
  quantity INTEGER,
  owned INTEGER,
  delta_own TEXT,
  value DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filing_date, ticker, insider_name, trade_type, quantity)
);

-- Index for faster lookups
CREATE INDEX idx_insider_trades_ticker ON insider_trades(ticker);
CREATE INDEX idx_insider_trades_trade_date ON insider_trades(trade_date DESC);
CREATE INDEX idx_insider_trades_trade_type ON insider_trades(trade_type);

-- Enable RLS (public read)
ALTER TABLE insider_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read insider trades" ON insider_trades
  FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage insider trades" ON insider_trades
  FOR ALL USING (auth.role() = 'service_role');

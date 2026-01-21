-- Add current price and value columns to holdings
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS current_price DECIMAL;
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS current_value DECIMAL;

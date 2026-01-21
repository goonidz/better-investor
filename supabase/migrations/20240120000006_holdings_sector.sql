-- Add sector column to holdings
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS sector TEXT;

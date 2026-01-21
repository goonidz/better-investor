-- Add recent_news column to insights table
ALTER TABLE insights ADD COLUMN IF NOT EXISTS recent_news JSONB;

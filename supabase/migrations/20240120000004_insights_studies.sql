-- Add scientific_studies and profile_note columns to insights table
ALTER TABLE insights ADD COLUMN IF NOT EXISTS scientific_studies JSONB;
ALTER TABLE insights ADD COLUMN IF NOT EXISTS profile_note TEXT;

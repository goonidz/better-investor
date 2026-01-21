-- Import history for backup/restore
CREATE TABLE IF NOT EXISTS import_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  source_type TEXT, -- 'csv', 'pdf', 'manual'
  source_name TEXT, -- filename
  holdings_snapshot JSONB NOT NULL, -- complete holdings data at time of import
  holdings_count INTEGER,
  total_value DECIMAL,
  note TEXT
);

ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own import history" ON import_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import history" ON import_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own import history" ON import_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_import_history_user ON import_history(user_id);
CREATE INDEX idx_import_history_date ON import_history(import_date DESC);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT,
    name TEXT NOT NULL,
    isin TEXT,
    quantity DECIMAL NOT NULL DEFAULT 0,
    avg_price DECIMAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    asset_type TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Imports table
CREATE TABLE IF NOT EXISTS imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import rows (for history and error tracking)
CREATE TABLE IF NOT EXISTS import_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id UUID REFERENCES imports(id) ON DELETE CASCADE NOT NULL,
    raw_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    error_message TEXT
);

-- RLS (Row Level Security)
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;

-- Policies for Portfolios
CREATE POLICY "Users can only see their own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for Holdings (via portfolio)
CREATE POLICY "Users can only see holdings of their own portfolios" ON holdings
    FOR SELECT USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert holdings to their own portfolios" ON holdings
    FOR INSERT WITH CHECK (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update holdings of their own portfolios" ON holdings
    FOR UPDATE USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can delete holdings of their own portfolios" ON holdings
    FOR DELETE USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );

-- Policies for Imports
CREATE POLICY "Users can only see their own imports" ON imports
    FOR SELECT USING (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert their own imports" ON imports
    FOR INSERT WITH CHECK (
        portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
    );

-- Policies for Import Rows
CREATE POLICY "Users can only see their own import rows" ON import_rows
    FOR SELECT USING (
        import_id IN (SELECT id FROM imports WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid()))
    );

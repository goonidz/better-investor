-- Performance indexes for scaling

-- Holdings
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

-- Portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);

-- Credits
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);

-- Investment profiles
CREATE INDEX IF NOT EXISTS idx_investment_profiles_user ON investment_profiles(user_id);

-- Market prices
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol);

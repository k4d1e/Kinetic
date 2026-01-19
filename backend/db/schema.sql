-- Kinetic SEO Database Schema
-- PostgreSQL Schema for OAuth, Users, and GSC Data

-- Users table: Store Google OAuth user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GSC Properties table: Store user's Search Console properties
CREATE TABLE IF NOT EXISTS gsc_properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  site_url VARCHAR(512) NOT NULL,
  permission_level VARCHAR(50),
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, site_url)
);

-- Sessions table: Store user sessions (used by connect-pg-simple)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_user_id ON gsc_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_gsc_properties_site_url ON gsc_properties(site_url);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Optional: GSC analytics cache table for storing fetched data
CREATE TABLE IF NOT EXISTS gsc_analytics_cache (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL, -- e.g., 'quick_wins', 'cannibalization', 'markets'
  data JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(property_id, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_property_id ON gsc_analytics_cache(property_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON gsc_analytics_cache(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores Google OAuth authenticated users';
COMMENT ON TABLE gsc_properties IS 'Stores Google Search Console properties linked to users';
COMMENT ON TABLE sessions IS 'Stores Express session data (managed by connect-pg-simple)';
COMMENT ON TABLE gsc_analytics_cache IS 'Caches fetched GSC analytics data to reduce API calls';

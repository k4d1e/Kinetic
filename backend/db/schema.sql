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

-- User Preferences: Store user-specific app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  preference_key VARCHAR(100) NOT NULL,
  preference_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
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
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);
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

-- Sprint Action Cards table: Store metadata about each type of action card
CREATE TABLE IF NOT EXISTS sprint_action_cards (
  id SERIAL PRIMARY KEY,
  card_type VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  total_steps INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Completed Sprint Cards table: Track user's completed action cards
CREATE TABLE IF NOT EXISTS completed_sprint_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  card_type_id INTEGER REFERENCES sprint_action_cards(id) ON DELETE CASCADE,
  sprint_index INTEGER NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration_ms INTEGER,
  progress_percentage INTEGER DEFAULT 95,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sprint Card Steps table: Track individual steps within completed cards
CREATE TABLE IF NOT EXISTS sprint_card_steps (
  id SERIAL PRIMARY KEY,
  completed_card_id INTEGER REFERENCES completed_sprint_cards(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_description TEXT,
  completed_at TIMESTAMP NOT NULL,
  UNIQUE(completed_card_id, step_number)
);

-- Create indexes for sprint card tables
CREATE INDEX IF NOT EXISTS idx_completed_cards_user_id ON completed_sprint_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_cards_property_id ON completed_sprint_cards(property_id);
CREATE INDEX IF NOT EXISTS idx_completed_cards_sprint_index ON completed_sprint_cards(sprint_index);
CREATE INDEX IF NOT EXISTS idx_sprint_steps_completed_card_id ON sprint_card_steps(completed_card_id);

-- Insert initial action card types
INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) VALUES
('meta_surgeon_protocol', 'Meta Surgeon Protocol', 4, 'Inject 4 Truth Layers to establish entity identity')
ON CONFLICT (card_type) DO NOTHING;

-- Module Card Types table: Store metadata for each calibration module type
CREATE TABLE IF NOT EXISTS module_card_types (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  card_template_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calibration Sessions table: Track calibration runs for user + property
CREATE TABLE IF NOT EXISTS calibration_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  calibrated_at TIMESTAMP DEFAULT NOW(),
  total_cards_generated INTEGER DEFAULT 0,
  UNIQUE(user_id, property_id)
);

-- Module Cards table: Store individual calibration cards
CREATE TABLE IF NOT EXISTS module_cards (
  id SERIAL PRIMARY KEY,
  calibration_session_id INTEGER REFERENCES calibration_sessions(id) ON DELETE CASCADE,
  module_card_type_id INTEGER REFERENCES module_card_types(id) ON DELETE CASCADE,
  card_data JSONB NOT NULL,
  card_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(calibration_session_id, module_card_type_id, card_index)
);

-- Create indexes for module card tables
CREATE INDEX IF NOT EXISTS idx_calibration_sessions_user_id ON calibration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_calibration_sessions_property_id ON calibration_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_module_cards_session_id ON module_cards(calibration_session_id);
CREATE INDEX IF NOT EXISTS idx_module_cards_type_id ON module_cards(module_card_type_id);

-- Insert module card types
INSERT INTO module_card_types (module_name, display_name, card_template_type) VALUES
('quick_wins', 'Quick Wins', 'quick_win_card'),
('cannibalization', 'Cannibalization', 'cannibalization_card'),
('untapped_markets', 'Untapped Markets', 'untapped_market_card'),
('ai_visibility', 'AI Visibility', 'ai_visibility_card'),
('local_seo', 'Local SEO', 'local_seo_card')
ON CONFLICT (module_name) DO NOTHING;

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

-- E.V.O. Analysis Cache table: Store complete dimensional synthesis results
CREATE TABLE IF NOT EXISTS evo_analysis_cache (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'full_synthesis', 'substrate', etc.
  dimensional_data JSONB NOT NULL,
  emergence_patterns JSONB,
  system_intelligence JSONB,
  analyzed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(property_id, analysis_type)
);

-- Dimensional health tracking over time
CREATE TABLE IF NOT EXISTS dimensional_health_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  dimension_name VARCHAR(50) NOT NULL,
  health_score INTEGER NOT NULL, -- 0-100
  metrics JSONB NOT NULL,
  measured_at TIMESTAMP DEFAULT NOW()
);

-- Emergence pattern detection history
CREATE TABLE IF NOT EXISTS emergence_patterns_history (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  pattern_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20),
  dimensions_affected TEXT[],
  insight TEXT,
  detected_at TIMESTAMP DEFAULT NOW()
);

-- E.V.O. action recommendations tracking
CREATE TABLE IF NOT EXISTS evo_recommendations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(100) NOT NULL,
  priority INTEGER,
  action_description TEXT,
  dimensions_affected TEXT[],
  estimated_impact JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for E.V.O. tables
CREATE INDEX IF NOT EXISTS idx_evo_cache_property_id ON evo_analysis_cache(property_id);
CREATE INDEX IF NOT EXISTS idx_evo_cache_expires_at ON evo_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_dimensional_health_property_id ON dimensional_health_history(property_id);
CREATE INDEX IF NOT EXISTS idx_dimensional_health_dimension ON dimensional_health_history(dimension_name);
CREATE INDEX IF NOT EXISTS idx_emergence_patterns_property_id ON emergence_patterns_history(property_id);
CREATE INDEX IF NOT EXISTS idx_emergence_patterns_type ON emergence_patterns_history(pattern_type);
CREATE INDEX IF NOT EXISTS idx_evo_recommendations_property_id ON evo_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_evo_recommendations_status ON evo_recommendations(status);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores Google OAuth authenticated users';
COMMENT ON TABLE gsc_properties IS 'Stores Google Search Console properties linked to users';
COMMENT ON TABLE sessions IS 'Stores Express session data (managed by connect-pg-simple)';
COMMENT ON TABLE gsc_analytics_cache IS 'Caches fetched GSC analytics data to reduce API calls';
COMMENT ON TABLE sprint_action_cards IS 'Metadata about different types of sprint action cards';
COMMENT ON TABLE completed_sprint_cards IS 'User-specific records of completed sprint cards';
COMMENT ON TABLE sprint_card_steps IS 'Individual steps completed within each sprint card';
COMMENT ON TABLE module_card_types IS 'Metadata about different types of calibration module cards';
COMMENT ON TABLE calibration_sessions IS 'Tracks calibration runs for each user + property combination';
COMMENT ON TABLE module_cards IS 'Stores individual calibration cards as JSONB for flexible schema';
COMMENT ON TABLE evo_analysis_cache IS 'Caches E.V.O. dimensional analysis results';
COMMENT ON TABLE dimensional_health_history IS 'Tracks dimensional health scores over time';
COMMENT ON TABLE emergence_patterns_history IS 'Records detected emergence patterns across dimensions';
COMMENT ON TABLE evo_recommendations IS 'Stores E.V.O. generated action recommendations';

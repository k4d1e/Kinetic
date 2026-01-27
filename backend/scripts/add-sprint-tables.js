// scripts/add-sprint-tables.js - Add missing sprint card tables
require('dotenv').config();
const { Pool } = require('pg');

async function addSprintTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('📦 Connecting to database...');
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    console.log('🔧 Creating sprint card tables...');
    
    // Create sprint_action_cards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprint_action_cards (
        id SERIAL PRIMARY KEY,
        card_type VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        total_steps INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created sprint_action_cards table');
    
    // Create completed_sprint_cards table
    await client.query(`
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
    `);
    console.log('✓ Created completed_sprint_cards table');
    
    // Create sprint_card_steps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sprint_card_steps (
        id SERIAL PRIMARY KEY,
        completed_card_id INTEGER REFERENCES completed_sprint_cards(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(255) NOT NULL,
        step_description TEXT,
        completed_at TIMESTAMP NOT NULL,
        UNIQUE(completed_card_id, step_number)
      );
    `);
    console.log('✓ Created sprint_card_steps table');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completed_cards_user_id ON completed_sprint_cards(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completed_cards_property_id ON completed_sprint_cards(property_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_completed_cards_sprint_index ON completed_sprint_cards(sprint_index);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sprint_steps_completed_card_id ON sprint_card_steps(completed_card_id);
    `);
    console.log('✓ Created indexes');
    
    // Insert initial action card type
    await client.query(`
      INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) 
      VALUES ('meta_surgeon_protocol', 'Meta Surgeon Protocol', 4, 'Inject 4 Truth Layers to establish entity identity')
      ON CONFLICT (card_type) DO NOTHING;
    `);
    console.log('✓ Inserted initial card type');
    
    // Create module_card_types table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS module_card_types (
        id SERIAL PRIMARY KEY,
        module_name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        card_template_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ Created module_card_types table');
    
    // Create calibration_sessions table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS calibration_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES gsc_properties(id) ON DELETE CASCADE,
        calibrated_at TIMESTAMP DEFAULT NOW(),
        total_cards_generated INTEGER DEFAULT 0,
        UNIQUE(user_id, property_id)
      );
    `);
    console.log('✓ Created calibration_sessions table');
    
    // Create module_cards table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS module_cards (
        id SERIAL PRIMARY KEY,
        calibration_session_id INTEGER REFERENCES calibration_sessions(id) ON DELETE CASCADE,
        module_card_type_id INTEGER REFERENCES module_card_types(id) ON DELETE CASCADE,
        card_data JSONB NOT NULL,
        card_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(calibration_session_id, module_card_type_id, card_index)
      );
    `);
    console.log('✓ Created module_cards table');
    
    // Create indexes for module tables
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_calibration_sessions_user_id ON calibration_sessions(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_calibration_sessions_property_id ON calibration_sessions(property_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_module_cards_session_id ON module_cards(calibration_session_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_module_cards_type_id ON module_cards(module_card_type_id);
    `);
    console.log('✓ Created module table indexes');
    
    // Insert module card types
    await client.query(`
      INSERT INTO module_card_types (module_name, display_name, card_template_type) VALUES
      ('quick_wins', 'Quick Wins', 'quick_win_card'),
      ('cannibalization', 'Cannibalization', 'cannibalization_card'),
      ('untapped_markets', 'Untapped Markets', 'untapped_market_card'),
      ('ai_visibility', 'AI Visibility', 'ai_visibility_card'),
      ('local_seo', 'Local SEO', 'local_seo_card')
      ON CONFLICT (module_name) DO NOTHING;
    `);
    console.log('✓ Inserted module card types');
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Sprint card tables added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sprint tables:', error);
    process.exit(1);
  }
}

addSprintTables();

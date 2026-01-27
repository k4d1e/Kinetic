// scripts/init-database.js - Initialize database schema
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('📦 Connecting to database...');
    const client = await pool.connect();
    
    console.log('✓ Connected to database');
    console.log('📄 Reading schema.sql...');
    
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Executing schema...');
    await client.query(schemaSql);
    
    console.log('✓ Database schema initialized successfully!');
    console.log('\nCreated tables:');
    console.log('  - users');
    console.log('  - gsc_properties');
    console.log('  - user_preferences');
    console.log('  - sessions');
    console.log('  - gsc_analytics_cache');
    console.log('  - sprint_action_cards');
    console.log('  - completed_sprint_cards');
    console.log('  - sprint_card_steps');
    console.log('  - module_card_types');
    console.log('  - calibration_sessions');
    console.log('  - module_cards');
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

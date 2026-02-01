// scripts/add-gsc-protocol-card.js - Add Index Diagnostic Protocol to sprint_action_cards
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function addGscProtocolCard() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'kinetic_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    console.log('🔧 Adding Index Diagnostic Protocol card type...');
    
    const result = await pool.query(
      `INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (card_type) DO UPDATE 
       SET display_name = EXCLUDED.display_name,
           total_steps = EXCLUDED.total_steps,
           description = EXCLUDED.description
       RETURNING id, card_type, display_name`,
      [
        'gsc_indexation_protocol',
        'Index Diagnostic Protocol',
        4,
        'Audit and optimize GSC indexation health: coverage, crawl stats, sitemaps, and redirects'
      ]
    );
    
    console.log('✓ Card type added/updated:', result.rows[0]);
    console.log('✓ Successfully added Index Diagnostic Protocol card type');
    
  } catch (error) {
    console.error('❌ Error adding card type:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  addGscProtocolCard()
    .then(() => {
      console.log('✓ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addGscProtocolCard };

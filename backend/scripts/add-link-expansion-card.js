// Script to add Internal Link Expansion Protocol card type to existing database
// Run this script to add the new card type without recreating the entire schema

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function addLinkExpansionCard() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding Internal Link Expansion Protocol card type...');
    
    const result = await client.query(`
      INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (card_type) DO NOTHING
      RETURNING id
    `, [
      'internal_link_expansion_protocol',
      'Link Architecture Protocol',
      4,
      'Optimize internal linking structure to distribute authority and guide users'
    ]);
    
    if (result.rows.length > 0) {
      console.log(`✓ Successfully added card type with ID: ${result.rows[0].id}`);
    } else {
      console.log('ℹ Card type already exists (no changes made)');
    }
    
    // Verify the card type exists
    const verifyResult = await client.query(
      'SELECT * FROM sprint_action_cards WHERE card_type = $1',
      ['internal_link_expansion_protocol']
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ Verification successful:');
      console.log('  Card Type:', verifyResult.rows[0].card_type);
      console.log('  Display Name:', verifyResult.rows[0].display_name);
      console.log('  Total Steps:', verifyResult.rows[0].total_steps);
      console.log('  Description:', verifyResult.rows[0].description);
    } else {
      console.error('❌ Verification failed - card type not found');
    }
    
  } catch (error) {
    console.error('❌ Error adding card type:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addLinkExpansionCard()
  .then(() => {
    console.log('\n✓ Migration complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

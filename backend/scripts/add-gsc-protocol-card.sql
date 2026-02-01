-- Add Index Diagnostic Protocol card type to sprint_action_cards table
-- Run this in pgAdmin or your PostgreSQL client

INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) 
VALUES (
  'gsc_indexation_protocol',
  'Index Diagnostic Protocol',
  4,
  'Audit and optimize GSC indexation health: coverage, crawl stats, sitemaps, and redirects'
)
ON CONFLICT (card_type) DO UPDATE 
SET 
  display_name = EXCLUDED.display_name,
  total_steps = EXCLUDED.total_steps,
  description = EXCLUDED.description;

-- Verify the insert
SELECT * FROM sprint_action_cards WHERE card_type = 'gsc_indexation_protocol';

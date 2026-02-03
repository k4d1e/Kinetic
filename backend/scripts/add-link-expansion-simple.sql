-- Simple SQL script to add internal_link_expansion_protocol card type
-- Run this directly in your PostgreSQL database

INSERT INTO sprint_action_cards (card_type, display_name, total_steps, description) 
VALUES ('internal_link_expansion_protocol', 'Link Architecture Protocol', 4, 'Optimize internal linking structure to distribute authority and guide users')
ON CONFLICT (card_type) DO NOTHING;

-- Verify the insert
SELECT * FROM sprint_action_cards WHERE card_type = 'internal_link_expansion_protocol';

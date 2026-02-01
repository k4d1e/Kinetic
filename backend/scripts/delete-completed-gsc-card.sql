-- Delete completed Index Diagnostic Protocol card
-- This allows you to test the completion animation again

-- First, let's see what exists
SELECT 
    csc.id,
    csc.sprint_index,
    sac.card_type,
    sac.display_name,
    csc.completed_at,
    COUNT(scs.id) as step_count
FROM completed_sprint_cards csc
JOIN sprint_action_cards sac ON csc.card_type_id = sac.id
LEFT JOIN sprint_card_steps scs ON scs.completed_card_id = csc.id
WHERE sac.card_type = 'gsc_indexation_protocol'
GROUP BY csc.id, sac.id, csc.sprint_index, csc.completed_at
ORDER BY csc.completed_at DESC;

-- Delete the steps first (foreign key constraint)
DELETE FROM sprint_card_steps
WHERE completed_card_id IN (
    SELECT csc.id 
    FROM completed_sprint_cards csc
    JOIN sprint_action_cards sac ON csc.card_type_id = sac.id
    WHERE sac.card_type = 'gsc_indexation_protocol'
);

-- Then delete the completed card
DELETE FROM completed_sprint_cards
WHERE card_type_id IN (
    SELECT id 
    FROM sprint_action_cards 
    WHERE card_type = 'gsc_indexation_protocol'
);

-- Verify deletion
SELECT 
    sac.card_type,
    sac.display_name,
    COUNT(csc.id) as completed_cards_count
FROM sprint_action_cards sac
LEFT JOIN completed_sprint_cards csc ON csc.card_type_id = sac.id
GROUP BY sac.id, sac.card_type, sac.display_name
ORDER BY sac.card_type;

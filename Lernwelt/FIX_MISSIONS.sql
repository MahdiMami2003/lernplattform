-- 1. Extend Missions Table to support Goals and Categories
-- We use DO block to add columns safely if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='subject') THEN
        ALTER TABLE missions ADD COLUMN subject TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='category') THEN
        ALTER TABLE missions ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='goal') THEN
        ALTER TABLE missions ADD COLUMN goal INTEGER DEFAULT 1;
    END IF;
END $$;

-- 2. Clean up old missions to ensure clean state as requested
-- WARNING: This resets progress. This is consistent with "clean implementation" request.
DELETE FROM missions_progress;
DELETE FROM missions;

-- 3. Insert specific German missions
INSERT INTO missions (title, description, xp_reward, goal, subject, category) VALUES
('Mathe-Entdecker', 'Schließe ein Mathe-Spiel ab.', 50, 1, 'Mathe', NULL),
('Algebra-Meister', 'Schließe ein Algebra-Spiel ab.', 100, 1, 'Mathe', 'Algebra'),
('Physik-Forscher', 'Schließe drei Physik-Spiele ab.', 150, 3, 'Physik', NULL),
('Elektrizitäts-Profi', 'Schließe ein Spiel zum Thema Elektrizität ab.', 100, 1, 'Physik', 'Elektrizität'),
('Deutsch-Starter', 'Schließe ein Deutsch-Spiel ab.', 50, 1, 'Deutsch', NULL),
('Englisch-Starter', 'Schließe ein Englisch-Spiel ab.', 50, 1, 'English', NULL);

-- 4. Update the RPC Function to handle Logic
CREATE OR REPLACE FUNCTION increment_mission_progress(p_user_id UUID, p_subject_name TEXT, p_category TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    m RECORD;
BEGIN
    -- 1. Ensure user has all current missions
    INSERT INTO missions_progress (user_id, mission_id, progress, completed)
    SELECT p_user_id, id, 0, false
    FROM missions
    WHERE id NOT IN (SELECT mission_id FROM missions_progress WHERE user_id = p_user_id);

    -- 2. Loop through matching missions
    -- Match Logic:
    --   Mission Subject matches Subject Name provided
    --   Mission Category is NULL (generic) OR matches Category provided
    FOR m IN
        SELECT mp.id, mp.progress, mis.goal
        FROM missions_progress mp
        JOIN missions mis ON mp.mission_id = mis.id
        WHERE mp.user_id = p_user_id
        AND mp.completed = false
        AND (mis.subject IS NULL OR mis.subject = p_subject_name)
        AND (mis.category IS NULL OR mis.category = p_category)
    LOOP
        -- Increment Progress
        UPDATE missions_progress
        SET progress = LEAST(progress + 1, mis.goal), -- Clamp to goal
            completed = (progress + 1 >= mis.goal)
        WHERE id = m.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

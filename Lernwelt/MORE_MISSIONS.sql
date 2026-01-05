-- 1. Ensure Columns Exist (Idempotent)
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

-- 2. Safe Inserts (Check availability by title to avoid Constraint Errors)
INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Vielseitigkeits-Held', 'Schließe insgesamt 10 Spiele in beliebigen Fächern ab.', 300, 10, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Vielseitigkeits-Held');

INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Mathe-Genie', 'Schließe 5 Mathe-Spiele ab.', 200, 5, 'Mathe', NULL
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Mathe-Genie');

INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Physik-Laborant', 'Schließe 5 Physik-Spiele ab.', 200, 5, 'Physik', NULL
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Physik-Laborant');

INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Deutsch-Dichter', 'Schließe 3 Deutsch-Spiele ab.', 150, 3, 'Deutsch', NULL
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Deutsch-Dichter');

-- NOTE: Using 'English' to match existing game logic and previous scripts
INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Englisch-Profi', 'Schließe 3 Englisch-Spiele ab.', 150, 3, 'English', NULL
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Englisch-Profi');

INSERT INTO missions (title, description, xp_reward, goal, subject, category)
SELECT 'Grammatik-King', 'Schließe ein Deutsch-Spiel der Kategorie Grammatik ab.', 100, 1, 'Deutsch', 'Grammatik'
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE title = 'Grammatik-King');

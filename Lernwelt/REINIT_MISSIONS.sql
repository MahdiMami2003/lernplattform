-- ============================================================================
-- REINIT_MISSIONS.sql
-- COMPLETE REIMPLEMENTATION OF MISSION SYSTEM
-- ============================================================================

-- 1. DROP EXISTING OBJECTS (CLEAN SLATE)
-- We drop the tables to ensure we start fresh. This WILL DELETE all progress.
DROP TABLE IF EXISTS public.missions_progress CASCADE;
DROP TABLE IF EXISTS public.missions CASCADE;

-- 2. CREATE TABLES

-- Missions Definition Table
CREATE TABLE public.missions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 50,
    goal INTEGER DEFAULT 1,     -- Target count to complete mission
    subject TEXT,               -- Filter: 'Mathe', 'Physik', 'Deutsch', 'English' or NULL (Any)
    category TEXT,              -- Filter: 'Algebra', 'Grammatik' etc. or NULL (Any)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missions Progress Table
CREATE TABLE public.missions_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id INTEGER REFERENCES public.missions(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id) -- Ensure one record per user per mission
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions_progress ENABLE ROW LEVEL SECURITY;

-- 3.1. MISSIONS Table Policies
-- Everyone can read missions definitions
CREATE POLICY "Everyone can read missions" ON public.missions
    FOR SELECT USING (true);

-- 3.2. MISSIONS_PROGRESS Table Policies

-- Policy A: Students can read their own progress
CREATE POLICY "Users can read own progress" ON public.missions_progress
    FOR SELECT USING (user_id = auth.uid());

-- Policy B: Students can insert their own progress (needed for initialization if done client-side, though we do it via RPC/Server mostly)
CREATE POLICY "Users can insert own progress" ON public.missions_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy C: Students can update their own progress (needed if client-side logic updates, though RPC is preferred)
CREATE POLICY "Users can update own progress" ON public.missions_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Policy D: PARENTS can read their children's progress
CREATE POLICY "Parents can read children progress" ON public.missions_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.parent_children pc
            JOIN public.profiles p ON p.id = auth.uid()
            WHERE pc.parent_id = auth.uid()
            AND pc.child_id = public.missions_progress.user_id
            AND p.role = 'parent'
        )
    );

-- Policy E: TEACHERS/ADMINS can read all progress
CREATE POLICY "Teachers and Admins can read all progress" ON public.missions_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('teacher', 'admin')
        )
    );

-- 4. CREATE RPC FUNCTION FOR ROBUST UPDATES

CREATE OR REPLACE FUNCTION increment_mission_progress(p_user_id UUID, p_subject_name TEXT, p_category TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    m RECORD;
BEGIN
    -- 4.1. Self-Healing: Ensure user has all current missions initialized
    -- This handles cases where new missions were added after user creation
    INSERT INTO missions_progress (user_id, mission_id, progress, completed)
    SELECT p_user_id, id, 0, false
    FROM missions
    WHERE id NOT IN (SELECT mission_id FROM missions_progress WHERE user_id = p_user_id);

    -- 4.2. Loop through matching active missions
    -- Logic:
    --   - Match Mission Subject (or Generic)
    --   - AND Match Mission Category (or Generic)
    --   - AND Not already completed
    FOR m IN
        SELECT mp.id, mp.progress, mis.goal
        FROM missions_progress mp
        JOIN missions mis ON mp.mission_id = mis.id
        WHERE mp.user_id = p_user_id
        AND mp.completed = false
        AND (mis.subject IS NULL OR mis.subject = p_subject_name)
        AND (mis.category IS NULL OR mis.category = p_category)
    LOOP
        -- Increment Progress, Clamp to Goal, Mark Completed if Goal Met
        UPDATE missions_progress
        SET progress = LEAST(progress + 1, m.goal),
            completed = (progress + 1 >= m.goal),
            updated_at = NOW()
        WHERE id = m.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECURITY DEFINER allows the function to run with privileges of the creator (usually postgres/admin)
-- ensuring it can update progress even if RLS policies are strict.

-- 5. SEED DATA (MISSIONS)

INSERT INTO public.missions (title, description, xp_reward, goal, subject, category) VALUES
-- General
('Viel-Lerner', 'Löse insgesamt 20 Aufgaben', 200, 20, NULL, NULL),
('Allrounder', 'Löse Aufgaben in 3 verschiedenen Fächern', 120, 3, NULL, NULL),
('Vielseitigkeits-Held', 'Schließe insgesamt 10 Spiele in beliebigen Fächern ab.', 300, 10, NULL, NULL),

-- Mathe
('Mathe-Entdecker', 'Schließe ein Mathe-Spiel ab.', 50, 1, 'Mathe', NULL),
('Lückentext-Meister', 'Löse 3 Mathe-Lückentexte richtig', 50, 3, 'Mathe', NULL),
('Mathe-Streak', 'Erreiche eine 5er-Serie in Mathe', 100, 5, 'Mathe', NULL),
('Kopfrechen-Profi', 'Löse 10 Kopfrechen-Aufgaben korrekt', 150, 10, 'Mathe', NULL),
('Geo-Experte', 'Beantworte 5 Geometrie-Fragen fehlerfrei', 120, 5, 'Mathe', NULL),
('Algebra-Meister', 'Schließe ein Algebra-Spiel ab.', 100, 1, 'Mathe', 'Algebra'),
('Mathe-Genie', 'Schließe 5 Mathe-Spiele ab.', 200, 5, 'Mathe', NULL),

-- Physik
('Physik-Forscher', 'Schließe drei Physik-Spiele ab.', 150, 3, 'Physik', NULL),
('Mechaniker', 'Löse 3 Aufgaben zur Mechanik', 80, 3, 'Physik', NULL),
('Elektro-Ingenieur', 'Beantworte 4 Fragen zu Strom & Spannung', 90, 4, 'Physik', NULL),
('Elektrizitäts-Profi', 'Schließe ein Spiel zum Thema Elektrizität ab.', 100, 1, 'Physik', 'Elektrizität'),
('Astro-Pilot', 'Löse 3 Aufgaben zum Sonnensystem', 75, 3, 'Physik', NULL),
('Physik-Laborant', 'Schließe 5 Physik-Spiele ab.', 200, 5, 'Physik', NULL),

-- Deutsch
('Deutsch-Starter', 'Schließe ein Deutsch-Spiel ab.', 50, 1, 'Deutsch', NULL),
('Grammatik-Guru', 'Bestimme 5 Wortarten korrekt', 60, 5, 'Deutsch', NULL),
('Fehler-Dedektiv', 'Finde 3 Rechtschreibfehler', 80, 3, 'Deutsch', NULL),
('Literatur-Kenner', 'Beantworte 3 Fragen zu Klassikern', 90, 3, 'Deutsch', NULL),
('Deutsch-Dichter', 'Schließe 3 Deutsch-Spiele ab.', 150, 3, 'Deutsch', NULL),
('Grammatik-King', 'Schließe ein Deutsch-Spiel der Kategorie Grammatik ab.', 100, 1, 'Deutsch', 'Grammatik'),

-- Englisch
('Englisch-Starter', 'Schließe ein Englisch-Spiel ab.', 50, 1, 'English', NULL),
('Word-Wizard', 'Lerne 5 neue englische Vokabeln', 50, 5, 'English', NULL),
('Grammar-King', 'Löse 5 englische Grammatik-Aufgaben', 70, 5, 'English', NULL),
('UK-Insider', 'Beantworte 3 Fragen zu UK & USA', 60, 3, 'English', NULL),
('Englisch-Profi', 'Schließe 3 Englisch-Spiele ab.', 150, 3, 'English', NULL);

-- 6. INITIALIZE PROGRESS FOR ALL STUDENTS
-- Ensure that every existing student gets an entry for every mission, starting at 0.

INSERT INTO public.missions_progress (user_id, mission_id, progress, completed)
SELECT 
    p.id AS user_id,
    m.id AS mission_id,
    0 AS progress,
    false AS completed
FROM public.profiles p
CROSS JOIN public.missions m
WHERE p.role = 'student';

-- 7. VERIFICATION OUTPUT
SELECT 
    (SELECT COUNT(*) FROM missions) as missions_count,
    (SELECT COUNT(*) FROM missions_progress) as progress_entries_count,
    'Reinitialization Complete' as status;

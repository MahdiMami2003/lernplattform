
-- 1. Ensure missions exist (run the seed_missions.sql content first if not done)
-- (We assume the user ran seed_missions.sql so missions table is populated)

-- 2. Populate missions_progress for ALL students for ALL missions
-- This uses INSERT ... SELECT ... ON CONFLICT DO NOTHING to avoid duplicates

INSERT INTO public.missions_progress (user_id, mission_id, progress, completed)
SELECT 
    p.id as user_id,
    m.id as mission_id,
    0 as progress,
    false as completed
FROM 
    public.profiles p
CROSS JOIN 
    public.missions m
WHERE 
    p.role = 'student' -- Only for students
ON CONFLICT (user_id, mission_id) DO NOTHING;

-- 3. Optional: Randomly give some progress to verify UI (demo data)
-- Update ~30% of missions to have some progress
UPDATE public.missions_progress
SET progress = floor(random() * 5 + 1)::int
WHERE random() < 0.3 AND completed = false;

-- Update ~10% to be completed
UPDATE public.missions_progress
SET completed = true, progress = 100
WHERE random() < 0.1;

-- RLS Policy for parents to read their children's mission progress
-- Run this script in the Supabase SQL Editor

-- 1. Make sure RLS is enabled on missions_progress
ALTER TABLE IF EXISTS public.missions_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing parent read policy if exists
DROP POLICY IF EXISTS "Parents can read children missions" ON public.missions_progress;

-- 3. Create policy: Parents can SELECT missions_progress for their linked children
CREATE POLICY "Parents can read children missions" 
ON public.missions_progress
FOR SELECT
USING (
  -- Allow user to read their own missions
  user_id = auth.uid()
  OR
  -- Allow parents to read their children's missions
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE pc.parent_id = auth.uid() 
    AND pc.child_id = missions_progress.user_id
    AND p.role = 'parent'
  )
  OR
  -- Allow teachers to read any student missions
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 4. Ensure students can insert their own mission progress
DROP POLICY IF EXISTS "Users can insert own progress" ON public.missions_progress;
CREATE POLICY "Users can insert own progress"
ON public.missions_progress
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 5. Ensure students can update their own mission progress
DROP POLICY IF EXISTS "Users can update own progress" ON public.missions_progress;
CREATE POLICY "Users can update own progress"
ON public.missions_progress
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'missions_progress';

-- ========================================
-- POPULATE MISSIONS FOR ALL STUDENTS
-- ========================================

-- Insert mission_progress for ALL students for ALL missions
-- This ensures every student has all missions assigned to them
INSERT INTO public.missions_progress (user_id, mission_id, progress, completed)
SELECT 
    p.id AS user_id,
    m.id AS mission_id,
    0 AS progress,
    false AS completed
FROM public.profiles p
CROSS JOIN public.missions m
WHERE p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM public.missions_progress mp 
    WHERE mp.user_id = p.id AND mp.mission_id = m.id
  );

-- Show how many mission_progress entries were created
SELECT 
    'Total students' AS metric, 
    COUNT(DISTINCT user_id) AS count 
FROM public.missions_progress
UNION ALL
SELECT 
    'Total mission entries' AS metric, 
    COUNT(*) AS count 
FROM public.missions_progress;

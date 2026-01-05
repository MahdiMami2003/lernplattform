-- ============================================================================
-- 🧹 FINAL CLEANUP SCRIPT 🧹
-- Run this in Supabase SQL Editor to PERMANENTLY fix deletion issues.
-- ============================================================================

BEGIN;

-- 1. Enable RLS on Questions (just to be safe)
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential blocking RLS policies
DROP POLICY IF EXISTS "TeacherAdminFull" ON "public"."questions";
DROP POLICY IF EXISTS "TeacherAdminUniversal" ON "public"."questions";
DROP POLICY IF EXISTS "TeacherAdminUnlimited" ON "public"."questions";
DROP POLICY IF EXISTS "Enable delete for teachers and admins" ON "public"."questions";

-- 3. Create the ONE policy that allows EVERYTHING for Teachers/Admins
CREATE POLICY "TeacherAdminUnlimited" ON "public"."questions"
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('teacher', 'admin')
);

-- 4. Automatically Drop Foreign Keys blocking deletion
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname, conrelid::regclass AS table_name 
        FROM pg_constraint 
        WHERE confrelid = 'public.questions'::regclass 
        AND contype = 'f'
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT "' || r.conname || '"';
    END LOOP;
END $$;

COMMIT;

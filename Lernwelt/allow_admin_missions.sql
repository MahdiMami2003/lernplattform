
-- Activate RLS on missions (if not already active)
ALTER TABLE "public"."missions" ENABLE ROW LEVEL SECURITY;

-- 1. READ (SELECT): Everyone generally needs to see missions (students for progress, teachers for managing)
DROP POLICY IF EXISTS "Enable read access for all missions" ON "public"."missions";
CREATE POLICY "Enable read access for all missions" ON "public"."missions"
FOR SELECT USING (true);

-- 2. INSERT: Only Teachers and Admins
DROP POLICY IF EXISTS "Enable insert missions for teachers" ON "public"."missions";
CREATE POLICY "Enable insert missions for teachers" ON "public"."missions"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 3. UPDATE: Only Teachers and Admins
DROP POLICY IF EXISTS "Enable update missions for teachers" ON "public"."missions";
CREATE POLICY "Enable update missions for teachers" ON "public"."missions"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 4. DELETE: Only Teachers and Admins
DROP POLICY IF EXISTS "Enable delete missions for teachers" ON "public"."missions";
CREATE POLICY "Enable delete missions for teachers" ON "public"."missions"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

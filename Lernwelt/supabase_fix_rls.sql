-- SICHERHEITSPOLICIES FÜR FRAGEN (QUESTIONS)
-- Kopiere diesen Code in den "SQL Editor" in deinem Supabase Dashboard und führe ihn aus.

-- 1. RLS aktivieren (falls noch nicht geschehen)
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;

-- 2. LESEN (SELECT): Alle authentifizierten Nutzer dürfen Fragen laden (auch Schüler)
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."questions";
CREATE POLICY "Enable read access for all users" ON "public"."questions" 
FOR SELECT 
USING (true);

-- 3. ERSTELLEN (INSERT): Nur Lehrer und Admins dürfen neue Fragen erstellen
DROP POLICY IF EXISTS "Enable insert for teachers and admins" ON "public"."questions";
CREATE POLICY "Enable insert for teachers and admins" ON "public"."questions" 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 4. BEARBEITEN (UPDATE): Nur Lehrer und Admins dürfen Fragen bearbeiten
DROP POLICY IF EXISTS "Enable update for teachers and admins" ON "public"."questions";
CREATE POLICY "Enable update for teachers and admins" ON "public"."questions" 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- 5. LÖSCHEN (DELETE): Nur Lehrer und Admins dürfen Fragen löschen
DROP POLICY IF EXISTS "Enable delete for teachers and admins" ON "public"."questions";
CREATE POLICY "Enable delete for teachers and admins" ON "public"."questions" 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

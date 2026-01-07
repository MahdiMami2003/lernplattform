-- Allow Teachers and Admins to modify Missions table

-- 1. Policy: Teachers/Admins can INSERT missions
CREATE POLICY "Teachers and Admins can insert missions" ON public.missions
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- 2. Policy: Teachers/Admins can UPDATE missions
CREATE POLICY "Teachers and Admins can update missions" ON public.missions
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

-- 3. Policy: Teachers/Admins can DELETE missions
CREATE POLICY "Teachers and Admins can delete missions" ON public.missions
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('teacher', 'admin')
    )
);

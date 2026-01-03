
-- delete existing missions progress to avoid foreign key violations
DELETE FROM public.missions_progress;

-- delete existing missions to ensure clean state and avoid redundancy
DELETE FROM public.missions;

-- Insert diverse missions for all subjects
INSERT INTO public.missions (title, description, xp_reward, total) VALUES 
-- Mathe Missionen
('Lückentext-Meister', 'Löse 3 Mathe-Lückentexte richtig', 50, 3),
('Mathe-Streak', 'Erreiche eine 5er-Serie in Mathe', 100, 5),
('Kopfrechen-Profi', 'Löse 10 Kopfrechen-Aufgaben korrekt', 150, 10),
('Geo-Experte', 'Beantworte 5 Geometrie-Fragen fehlerfrei', 120, 5),

-- Deutsch Missionen
('Grammatik-Guru', 'Bestimme 5 Wortarten korrekt', 60, 5),
('Fehler-Dedektiv', 'Finde 3 Rechtschreibfehler', 80, 3),
('Literatur-Kenner', 'Beantworte 3 Fragen zu Klassikern', 90, 3),

-- Englisch Missionen
('Word-Wizard', 'Lerne 5 neue englische Vokabeln', 50, 5),
('Grammar-King', 'Löse 5 englische Grammatik-Aufgaben', 70, 5),
('UK-Insider', 'Beantworte 3 Fragen zu UK & USA', 60, 3),

-- Physik Missionen
('Mechaniker', 'Löse 3 Aufgaben zur Mechanik', 80, 3),
('Elektro-Ingenieur', 'Beantworte 4 Fragen zu Strom & Spannung', 90, 4),
('Astro-Pilot', 'Löse 3 Aufgaben zum Sonnensystem', 75, 3),

-- Allgemeine & Streak Missionen
('Dranbleiber', 'Logge dich 3 Tage in Folge ein', 100, 3),
('Viel-Lerner', 'Löse insgesamt 20 Aufgaben', 200, 20),
('Perfektionist', 'Schließe eine Runde ohne Fehler ab', 150, 1),
('Allrounder', 'Löse Aufgaben in 3 verschiedenen Fächern', 120, 3),
('Nacht-Eule', 'Löse eine Aufgabe am Abend', 50, 1),
('Früh-Starter', 'Löse eine Aufgabe am Morgen', 50, 1);

-- Note: User progress (missions_progress) might need to be reset or linked.
-- Trigger logic usually handles new users, but existing users might miss these unless assigned.

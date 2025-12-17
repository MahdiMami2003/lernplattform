
-- 1. Ensure 'type' column exists (Migration)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'type') THEN 
        ALTER TABLE questions ADD COLUMN type TEXT DEFAULT 'mc'; 
    END IF; 
END $$;

-- 2. Make answer columns nullable (CRITICAL for Lückentext)
ALTER TABLE questions ALTER COLUMN a1 DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN a2 DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN a3 DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN a4 DROP NOT NULL;

-- 3. Insert Lückentext Questions (Expanded with Kopfrechnen & more)
INSERT INTO questions (subject, category, type, question, xp_reward, a1, a2, a3, a4, correct_index) VALUES

-- === MATHE ===
-- Kopfrechnen (NEU!)
('Mathe', 'Kopfrechnen', 'cloze', '7 + 6 = [13]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', '8 * 8 = [64]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', '100 - 35 = [65]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', '50 : 5 = [10]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', '12 + 12 = [24]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', '20 * 5 = [100]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', 'Das Doppelte von 15 ist [30].', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Kopfrechnen', 'cloze', 'Die Hälfte von 50 ist [25].', 10, NULL, NULL, NULL, NULL, 0),

-- Grundrechenarten
('Mathe', 'Grundrechenarten', 'cloze', '7 * 8 = [56]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '100 / 4 = [25]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '15 + 28 = [43]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '50 - 17 = [33]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '12 * 12 = [144]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '90 / 9 = [10]', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Grundrechenarten', 'cloze', '63 / 7 = [9]', 10, NULL, NULL, NULL, NULL, 0),
-- Geometrie
('Mathe', 'Geometrie', 'cloze', 'Ein Dreieck hat [3] Ecken.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Geometrie', 'cloze', 'Ein Quadrat hat [4] gleiche Seiten.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Geometrie', 'cloze', 'Ein Kreis hat [0] Ecken.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Geometrie', 'cloze', 'Der Winkel im Rechteck ist [90] Grad.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Geometrie', 'cloze', 'Die Summe der Winkel im Dreieck ist [180] Grad.', 15, NULL, NULL, NULL, NULL, 0),
-- Algebra
('Mathe', 'Algebra', 'cloze', 'Wenn 2x = 10, dann ist x = [5].', 15, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Algebra', 'cloze', 'a * a = [a^2]', 15, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Algebra', 'cloze', '3x + 5 = 20, also 3x = [15]', 15, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Algebra', 'cloze', 'x + 7 = 10, x = [3]', 10, NULL, NULL, NULL, NULL, 0),
-- Einheiten
('Mathe', 'Einheiten', 'cloze', '1 Kilometer sind [1000] Meter.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Einheiten', 'cloze', '1 Stunde hat [60] Minuten.', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Einheiten', 'cloze', '1 Kilogramm sind [1000] Gramm.', 10, NULL, NULL, NULL, NULL, 0),
-- Brüche/Prozent
('Mathe', 'Prozent', 'cloze', '50% ist die [Hälfte].', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Prozent', 'cloze', '25% ist ein [Viertel].', 10, NULL, NULL, NULL, NULL, 0),
('Mathe', 'Brüche', 'cloze', 'Ein Halbes plus ein Halbes ist [Eins].', 10, NULL, NULL, NULL, NULL, 0),

-- === DEUTSCH ===
-- Grammatik
('Deutsch', 'Grammatik', 'cloze', 'Das Wort "laufen" ist ein [Verb].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'Das Wort "Haus" ist ein [Nomen].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'In dem Satz "Er geht schnell", ist "schnell" ein [Adjektiv].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'Die Vergangenheit von "sehen" ist [sah].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'Das Partizip II von "gehen" ist [gegangen].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'Der Artikel von "Sonne" ist [die].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Grammatik', 'cloze', 'Der Artikel von "Mond" ist [der].', 10, NULL, NULL, NULL, NULL, 0),
-- Rechtschreibung
('Deutsch', 'Rechtschreibung', 'cloze', 'Viele Menschen [glauben] an Glück. (glauben/glaupen)', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Rechtschreibung', 'cloze', 'Der [Vogel] singt. (Vogel/Fogel)', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Rechtschreibung', 'cloze', 'Die [Sonne] scheint hell. (Sonne/Zonne)', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Rechtschreibung', 'cloze', 'Er isst eine [Suppe]. (Subbe/Suppe)', 10, NULL, NULL, NULL, NULL, 0),
-- Literatur
('Deutsch', 'Literatur', 'cloze', 'Faust wurde von [Goethe] geschrieben.', 15, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Literatur', 'cloze', 'Schiller schrieb die [Räuber].', 15, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Literatur', 'cloze', 'Ein Gedicht hat oft [Reime].', 10, NULL, NULL, NULL, NULL, 0),
-- Fälle
('Deutsch', 'Fälle', 'cloze', 'Der erste Fall heißt [Nominativ].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Fälle', 'cloze', 'Der zweite Fall heißt [Genitiv].', 10, NULL, NULL, NULL, NULL, 0),
('Deutsch', 'Fälle', 'cloze', 'Wer oder was? fragt nach dem [Nominativ].', 10, NULL, NULL, NULL, NULL, 0),

-- === ENGLISCH ===
-- Vocabulary
('Englisch', 'Vocabulary', 'cloze', 'The opposite of hot is [cold].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'The color of the sky is [blue].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'A cat says [meow].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'A dog says [woof].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'We sleep in a [bed].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'The opposite of big is [small].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'Apple is a [fruit].', 10, NULL, NULL, NULL, NULL, 0),
('Englisch', 'Vocabulary', 'cloze', 'Carrot is a [vegetable].', 10, NULL, NULL, NULL, NULL, 0),
-- Grammar
('English', 'Grammar', 'cloze', 'She [is] happy today.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Grammar', 'cloze', 'They [are] playing football.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Grammar', 'cloze', 'I [have] a dream.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Grammar', 'cloze', 'He [goes] to school every day.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Grammar', 'cloze', 'Yesterday I [played] football.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Grammar', 'cloze', 'I am [reading] a book right now.', 10, NULL, NULL, NULL, NULL, 0),
-- Culture
('English', 'Culture', 'cloze', 'The capital of England is [London].', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Culture', 'cloze', 'The USA has [50] states.', 10, NULL, NULL, NULL, NULL, 0),
('English', 'Culture', 'cloze', 'The currency used in the UK is the [Pound].', 10, NULL, NULL, NULL, NULL, 0),

-- === PHYSIK ===
-- Mechanik
('Physik', 'Mechanik', 'cloze', 'Die Einheit der Kraft ist [Newton].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Mechanik', 'cloze', 'Geschwindigkeit = Weg / [Zeit]', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Mechanik', 'cloze', 'Einheit der Energie ist [Joule].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Mechanik', 'cloze', 'Schwerkraft zieht alles nach [unten].', 10, NULL, NULL, NULL, NULL, 0),
-- Optik
('Physik', 'Optik', 'cloze', 'Licht breitet sich [geradlinig] aus.', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Optik', 'cloze', 'Ein Prisma zerlegt Licht in [Farben].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Optik', 'cloze', 'Ein Spiegel [reflektiert] Licht.', 10, NULL, NULL, NULL, NULL, 0),
-- Elektrizität
('Physik', 'Elektrizität', 'cloze', 'Die Einheit der Spannung ist [Volt].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Elektrizität', 'cloze', 'Stromstärke wird in [Ampere] gemessen.', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Elektrizität', 'cloze', 'U = R * [I]', 15, NULL, NULL, NULL, NULL, 0),
('Physik', 'Elektrizität', 'cloze', 'Widerstand wird in [Ohm] gemessen.', 10, NULL, NULL, NULL, NULL, 0),
-- Astronomie
('Physik', 'Astronomie', 'cloze', 'Die Erde kreist um die [Sonne].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Astronomie', 'cloze', 'Der Mond kreist um die [Erde].', 10, NULL, NULL, NULL, NULL, 0),
('Physik', 'Astronomie', 'cloze', 'Unser Planet heißt [Erde].', 10, NULL, NULL, NULL, NULL, 0);

# HSGG LERNWELT - DATABASE SCHEMA & RLS REFERENCE
**Für Code-Review mit GitHub Copilot (GPT-5)**  
**Letzte Aktualisierung:** 05. Januar 2026

---

## 🎯 ZWECK DIESES DOKUMENTS

Dieses Dokument enthält die **exakte Datenbank-Struktur** nach der RLS-Implementierung.
Bitte prüfe ob:
- ✅ Frontend-Queries noch funktionieren
- ✅ Keine Features durch RLS gebrochen sind
- ✅ Auth-Checks korrekt implementiert sind
- ✅ Error-Handling vorhanden ist

**WICHTIG:** Alle Schemas wurden direkt aus der produktiven Supabase-DB exportiert!

---

## 📊 DATENBANK-ÜBERSICHT

### Tabellen (14 gesamt):
1. **profiles** - User-Profile mit Rollen & Gamification
2. **classes** - Schulklassen
3. **teacher_role** - Lehrer-Klassen-Zuordnungen
4. **parent_children** - Eltern-Kind-Beziehungen
5. **materials** - Lernmaterialien (PDFs)
6. **class_materials** - Material-Klassen-Zuordnungen
7. **appointments** - Termine/News
8. **pedagogic_tips** - Pädagogische Tipps
9. **questions** - Quiz-Fragen
10. **missions** - Gamification-Missionen
11. **missions_progress** - User-Mission-Progress
12. **avatars** - Avatar-Bilder
13. **user_badges** - Verdiente Badges
14. **weekly_tests** - Wöchentliche Tests mit Links

### Helper-Funktionen (6):
1. `is_admin()` - Prüft Admin-Rolle
2. `is_teacher()` - Prüft Teacher-Rolle
3. `is_parent()` - Prüft Parent-Rolle
4. `has_editing_right()` - Prüft Bearbeitungsrecht
5. `get_user_class_id()` - Gibt User-Klasse zurück
6. `protect_profile_sensitive_fields()` - Verhindert Feld-Manipulationen

### Trigger (3):
1. `trg_protect_profiles` - Schützt sensible Profile-Felder vor Manipulation
2. `trg_update_last_login` - Updated automatisch last_login bei jedem Update
3. `on_auth_user_created_missions` - Erstellt Missions für neue User

### Storage Buckets (3):
1. `lehrmaterialien` - PDF-Materialien
2. `avatars` - Avatar-Bilder
3. `weekly_tests` - Test-PDFs

---

## 🗄️ KOMPLETTE TABELLEN-SCHEMAS

### 1. PROFILES (User-Accounts)

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT auth.uid(),
  full_name text NULL,
  role text NULL DEFAULT 'student'::text,
  xp bigint NULL DEFAULT '0'::bigint,
  level bigint NULL DEFAULT '1'::bigint,
  avatar_url text NULL DEFAULT 'https://cdn-icons-png.flaticon.com/512/921/921071.png'::text,
  streak integer NULL DEFAULT 0,
  hearts integer NULL DEFAULT 3,
  last_streak_date date NULL,
  last_login date NULL,
  class_id bigint NULL,
  editing_right boolean NULL DEFAULT false,
  
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_class_id_fkey FOREIGN KEY (class_id) 
    REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Constraints:
  CONSTRAINT profiles_role_check CHECK (
    role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text, 'parent'::text])
  ),
  CONSTRAINT chk_xp_positive CHECK (xp >= 0),
  CONSTRAINT chk_level_positive CHECK (level >= 1),
  CONSTRAINT chk_streak_positive CHECK (streak >= 0),
  CONSTRAINT chk_hearts_range CHECK (hearts >= 0 AND hearts <= 3)
);

-- Indizes:
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_class ON profiles(class_id);

-- Trigger:
CREATE TRIGGER trg_protect_profiles 
BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION protect_profile_sensitive_fields();

CREATE TRIGGER trg_update_last_login 
BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_last_login();

CREATE TRIGGER on_auth_user_created_missions 
AFTER INSERT ON profiles 
FOR EACH ROW EXECUTE FUNCTION handle_new_user_missions();
```

**Wichtige Felder:**
- `id` - UUID, verknüpft mit Supabase Auth
- `role` - **Bestimmt alle Zugriffsrechte!** (student, teacher, admin, parent)
- `editing_right` - Zusätzliches Recht für Content-Management (Questions, Materials, Tips)
- `class_id` - **Kritisch für klassenbasierte Filterung!**
- `xp`, `level`, `streak`, `hearts` - Gamification
- `last_login` - Wird automatisch durch Trigger updated
- `last_streak_date` - Für Streak-Berechnung

**RLS Policies:**
- **SELECT:** User sieht eigenes Profil, Admin sieht alle, Teacher sieht Schüler seiner Klassen, Parent sieht seine Kinder
- **UPDATE:** User kann sich selbst updaten (aber eingeschränkt durch `trg_protect_profiles`!), Admin kann alle
- **INSERT:** Bei Signup automatisch
- **DELETE:** Nur Admin

**🚨 KRITISCH - TRIGGER SCHUTZ:**
```javascript
// ❌ WIRD GEBLOCKT durch trg_protect_profiles:
await supabase.from('profiles').update({
  role: 'admin',      // ❌ Kann nicht geändert werden!
  xp: 99999,          // ❌ Kann nicht geändert werden!
  level: 100,         // ❌ Kann nicht geändert werden!
  editing_right: true,// ❌ Kann nicht geändert werden!
  class_id: 999       // ❌ Kann nicht geändert werden!
}).eq('id', userId)
// Error: "Security: Cannot change restricted profile fields"

// ✅ ERLAUBT:
await supabase.from('profiles').update({
  full_name: 'Neuer Name',  // ✅ OK
  avatar_url: '/new.png',   // ✅ OK
  // Nur diese Felder!
}).eq('id', userId)
```

---

### 2. CLASSES (Schulklassen)

```sql
CREATE TABLE public.classes (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  name text NOT NULL,
  grade_level smallint NULL,
  
  CONSTRAINT classes_pkey PRIMARY KEY (id)
);
```

**Beispiel-Daten:**
- id: 1, name: '5a', grade_level: 5
- id: 2, name: '10b', grade_level: 10

**RLS Policies:**
- **SELECT:** Alle authenticated (für Dropdowns)
- **INSERT/UPDATE/DELETE:** Nur Admin

---

### 3. TEACHER_ROLE (Lehrer-Klassen-Zuordnungen)

```sql
CREATE TABLE public.teacher_role (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  teacher_id uuid NOT NULL,
  class_id bigint NOT NULL,
  
  CONSTRAINT teacher_classes_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_classes_teacher_id_class_id_key UNIQUE (teacher_id, class_id),
  CONSTRAINT teacher_classes_teacher_id_fkey FOREIGN KEY (teacher_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT teacher_classes_class_id_fkey FOREIGN KEY (class_id) 
    REFERENCES classes(id) ON DELETE CASCADE
);

-- Indizes:
CREATE INDEX idx_teacher_role_teacher ON teacher_role(teacher_id);
CREATE INDEX idx_teacher_role_class ON teacher_role(class_id);
```

**🎯 KRITISCH:** Diese Tabelle definiert welche Klassen ein Lehrer unterrichtet!

**Beispiel:**
```
teacher_id: uuid-123 (Herr Müller)
class_id: 1 (Klasse 5a)
→ Herr Müller unterrichtet 5a

teacher_id: uuid-123 (Herr Müller)
class_id: 3 (Klasse 10b)
→ Herr Müller unterrichtet auch 10b
```

**RLS Policies:**
- **SELECT:** Teacher sieht eigene Zuordnungen, Admin sieht alle
- **INSERT/UPDATE/DELETE:** Nur Admin

**Frontend-Auswirkung:**
```javascript
// Teacher sieht NUR Materialien seiner unterrichteten Klassen!
const { data } = await supabase.from('materials').select('*')
// Gibt automatisch nur materials zurück wo:
// class_id IN (SELECT class_id FROM teacher_role WHERE teacher_id = auth.uid())
```

---

### 4. PARENT_CHILDREN (Eltern-Kind-Beziehungen)

```sql
CREATE TABLE public.parent_children (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  
  CONSTRAINT parent_children_pkey PRIMARY KEY (id),
  CONSTRAINT unique_parent_child UNIQUE (parent_id, child_id),
  CONSTRAINT parent_children_parent_id_fkey FOREIGN KEY (parent_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT parent_children_child_id_fkey FOREIGN KEY (child_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT no_self_parent CHECK (parent_id <> child_id)
);

-- Indizes:
CREATE INDEX idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX idx_parent_children_child ON parent_children(child_id);
```

**🎯 KRITISCH:** Diese Tabelle definiert Eltern-Kind-Beziehungen!

**RLS Policies:**
- **SELECT:** Parent sieht eigene Kinder, Admin sieht alle
- **INSERT/UPDATE/DELETE:** Nur Admin

---

### 5. MATERIALS (Lernmaterialien)

```sql
CREATE TABLE public.materials (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NULL,
  file_url text NULL,
  subject text NULL DEFAULT ''::text,
  class_id bigint NULL,
  title_en text NULL,
  description_en text NULL,
  subject_en text NULL,
  
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_class_id_fkey FOREIGN KEY (class_id) 
    REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- Indizes:
CREATE INDEX idx_materials_class_id ON materials(class_id);
CREATE INDEX idx_materials_subject ON materials(subject);
```

**🚨 KRITISCH - KLASSENBASIERTE FILTERUNG:**

**RLS Policies:**
- **SELECT:**
  - **Students:** NUR eigene Klasse (`class_id = get_user_class_id()`)
  - **Teachers:** NUR unterrichtete Klassen (via `teacher_role` join)
  - **Parents:** NUR Klassen ihrer Kinder (via `parent_children` + `profiles.class_id`)
  - **Admins:** Alles
  - **class_id = NULL:** Für alle sichtbar (allgemeine Materialien)
  
- **INSERT/UPDATE/DELETE:** Nur `has_editing_right()` (Admin ODER editing_right = true)

**Frontend-Auswirkung:**
```javascript
// Student (class_id = 1) ruft auf:
const { data } = await supabase.from('materials').select('*')
// Gibt automatisch NUR zurück:
// - WHERE class_id = 1 (eigene Klasse)
// - OR class_id IS NULL (allgemeine Materialien)

// Teacher (unterrichtet Klassen 1, 3, 5) ruft auf:
const { data } = await supabase.from('materials').select('*')
// Gibt automatisch NUR zurück:
// - WHERE class_id IN (1, 3, 5)
// - OR class_id IS NULL

// Parent (Kind in Klasse 2) ruft auf:
const { data } = await supabase.from('materials').select('*')
// Gibt automatisch NUR zurück:
// - WHERE class_id = 2
// - OR class_id IS NULL
```

---

### 6. CLASS_MATERIALS (Material-Klassen-Zuordnungen)

```sql
CREATE TABLE public.class_materials (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  material_id bigint NOT NULL,
  class_id bigint NOT NULL,
  subject text NULL,
  
  CONSTRAINT class_materials_pkey PRIMARY KEY (id),
  CONSTRAINT class_materials_material_id_class_id_key UNIQUE (material_id, class_id),
  CONSTRAINT class_materials_material_id_fkey FOREIGN KEY (material_id) 
    REFERENCES materials(id) ON DELETE CASCADE,
  CONSTRAINT class_materials_class_id_fkey FOREIGN KEY (class_id) 
    REFERENCES classes(id) ON DELETE CASCADE
);
```

**RLS Policies:**
- **SELECT:** Klassenbasiert (genau wie materials)
- **INSERT/UPDATE/DELETE:** Nur `has_editing_right()`

---

### 7. APPOINTMENTS (Termine/News)

```sql
CREATE TABLE public.appointments (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  classid bigint NULL,
  event_date timestamp with time zone NULL,
  title text NULL,
  content text NULL DEFAULT ''::text,
  title_en text NULL,
  content_en text NULL,
  
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_classid_fkey FOREIGN KEY (classid) 
    REFERENCES classes(id) ON UPDATE CASCADE
);
```

**⚠️ HINWEIS:** Spalte heißt `classid` (nicht `class_id`!)

**🚨 KRITISCH - KLASSENBASIERTE FILTERUNG:**

**RLS Policies:**
- **SELECT:** Klassenbasiert (genau wie materials!)
  - Students: Nur eigene Klasse
  - Teachers: Nur unterrichtete Klassen
  - Parents: Nur Klassen ihrer Kinder
  - Admins: Alles
  - `classid = NULL`: Für alle sichtbar (allgemeine Termine)
  
- **INSERT/UPDATE/DELETE:** `is_admin()` ODER `is_teacher()` (NICHT editing_right!)

**Frontend-Auswirkung:**
```javascript
// Student sieht NUR Termine seiner Klasse:
const { data } = await supabase.from('appointments').select('*')
// Automatisch gefiltert nach classid!
```

---

### 8. PEDAGOGIC_TIPS (Pädagogische Tipps)

```sql
CREATE TABLE public.pedagogic_tips (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NULL DEFAULT ''::text,
  description text NULL DEFAULT ''::text,
  content text NULL DEFAULT ''::text,
  title_en text NULL,
  description_en text NULL,
  content_en text NULL,
  
  CONSTRAINT pedagogic_tips_pkey PRIMARY KEY (id)
);
```

**RLS Policies:**
- **SELECT:** Alle authenticated
- **INSERT/UPDATE/DELETE:** Nur `has_editing_right()`

---

### 9. QUESTIONS (Quiz-Fragen)

```sql
CREATE TABLE public.questions (
  id bigserial NOT NULL,
  question text NOT NULL,
  a1 text NULL,
  a2 text NULL,
  a3 text NULL,
  a4 text NULL,
  correct_index integer NOT NULL,
  xp_reward integer NULL DEFAULT 10,
  subject text NULL DEFAULT 'Mathe'::text,
  category text NULL,
  question_en text NULL,
  a1_en text NULL,
  a2_en text NULL,
  a3_en text NULL,
  a4_en text NULL,
  subject_en text NULL,
  category_en text NULL,
  type text NULL DEFAULT 'mc'::text,
  
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT chk_correct_index_range CHECK (
    correct_index >= 1 AND correct_index <= 4
  )
);

-- Indizes:
CREATE INDEX idx_questions_subject ON questions(subject);
```

**Wichtig:**
- `correct_index` - Muss 1-4 sein (1 = a1 ist richtig, 2 = a2, etc.)
- `type` - Typ der Frage (default: 'mc' = Multiple Choice)

**RLS Policies:**
- **SELECT:** Alle AUSSER Parents (`NOT is_parent()`)
- **INSERT/UPDATE/DELETE:** Nur `has_editing_right()`

**Frontend-Auswirkung:**
```javascript
// Student/Teacher können Fragen lesen (für Game):
const { data } = await supabase.from('questions').select('*')
// ✅ Funktioniert

// Parent kann NICHT lesen:
const { data } = await supabase.from('questions').select('*')
// ✅ Gibt leeres Array zurück (soll nicht spielen!)

// Nur User mit editing_right können erstellen:
const { error } = await supabase.from('questions').insert({...})
// ❌ Fehlt ohne editing_right = true ODER role = 'admin'
```

---

### 10. MISSIONS (Gamification-Missionen)

```sql
CREATE TABLE public.missions (
  id bigserial NOT NULL,
  title text NOT NULL,
  description text NULL,
  total integer NULL DEFAULT 10,
  xp_reward integer NOT NULL,
  subject text NULL DEFAULT 'all'::text,
  category text NULL,
  goal integer NULL DEFAULT 1,
  
  CONSTRAINT missions_pkey PRIMARY KEY (id),
  CONSTRAINT chk_missions_total_positive CHECK (total > 0),
  CONSTRAINT chk_missions_xp_positive CHECK (xp_reward >= 0)
);
```

**RLS Policies:**
- **SELECT:** Alle authenticated
- **INSERT/UPDATE/DELETE:** Nur `has_editing_right()`

---

### 11. MISSIONS_PROGRESS (User-Mission-Fortschritt)

```sql
CREATE TABLE public.missions_progress (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  mission_id bigint NOT NULL,
  progress integer NULL DEFAULT 0,
  completed boolean NULL DEFAULT false,
  
  CONSTRAINT missions_progress_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_mission UNIQUE (user_id, mission_id),
  CONSTRAINT missions_progress_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT missions_progress_mission_id_fkey_cascade FOREIGN KEY (mission_id) 
    REFERENCES missions(id) ON DELETE CASCADE
);

-- Indizes:
CREATE INDEX idx_missions_progress_user ON missions_progress(user_id);
CREATE INDEX idx_missions_progress_mission ON missions_progress(mission_id);
```

**🚨 WICHTIG FÜR GAME:**

**RLS Policies:**
- **SELECT:**
  - User sieht eigenen Progress
  - Teachers sehen Progress ihrer Schüler
  - Parents sehen Progress ihrer Kinder
  - Admins sehen alles
  
- **INSERT:** User kann eigenen Progress erstellen
- **UPDATE:** User kann eigenen Progress updaten (wichtig nach Game!)
- **DELETE:** Nur Admin

**Frontend-Auswirkung:**
```javascript
// Nach Game - Student updated seinen Progress:
const { error } = await supabase
  .from('missions_progress')
  .update({ progress: progress + 1 })
  .eq('user_id', userId)
  .eq('mission_id', missionId)
// ✅ MUSS funktionieren!

// Oder neu erstellen:
const { error } = await supabase
  .from('missions_progress')
  .insert({ user_id: userId, mission_id: 1, progress: 1 })
// ✅ MUSS funktionieren!
```

---

### 12. AVATARS (Avatar-Bilder)

```sql
CREATE TABLE public.avatars (
  id bigserial NOT NULL,
  name text NULL,
  image_url text NOT NULL,
  min_level integer NULL DEFAULT 1,
  
  CONSTRAINT avatars_pkey PRIMARY KEY (id)
);
```

**RLS Policies:**
- **SELECT:** Alle authenticated
- **INSERT/UPDATE/DELETE:** Nur Admin

---

### 13. USER_BADGES (Verdiente Badges)

```sql
CREATE TABLE public.user_badges (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles(id) ON DELETE CASCADE
);

-- Indizes:
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
```

**🚨 KRITISCH FÜR BADGE-SYSTEM:**

**Badge IDs (in badgeService.js):**
- `perfect_round` - 100% richtig im Game
- `streak_master` - Streak >= 3
- `math_hero` - Mathe-Held
- `phy_hero` - Physik-Held

**RLS Policies:**
- **SELECT:**
  - User sieht eigene Badges
  - Teachers sehen Badges ihrer Schüler
  - Parents sehen Badges ihrer Kinder
  - Admins sehen alles
  
- **INSERT:** User kann eigene Badges erstellen (wichtig nach Game!)
- **UPDATE:** Nur Admin
- **DELETE:** Nur Admin

**Frontend-Auswirkung:**
```javascript
// Nach Game - badgeService.js erstellt Badge:
const { error } = await supabase
  .from('user_badges')
  .insert({ 
    user_id: userId, 
    badge_id: 'perfect_round' 
  })
// ✅ MUSS funktionieren!

// Falls das fehlschlägt, ist Badge-System kaputt!
```

---

### 14. WEEKLY_TESTS (Wöchentliche Tests)

```sql
CREATE TABLE public.weekly_tests (
  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NULL DEFAULT ''::text,
  link_question text NULL DEFAULT ''::text,
  link_answere text NULL DEFAULT ''::text,  -- Hinweis: Typo "answere" statt "answer"
  class_id bigint NULL,
  
  CONSTRAINT "weekly tests_pkey" PRIMARY KEY (id),  -- Hinweis: Leerzeichen im Constraint-Namen!
  CONSTRAINT weekly_tests_class_id_fkey FOREIGN KEY (class_id) 
    REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL
);
```

**⚠️ HINWEISE:**
- Typo im Feld: `link_answere` (sollte `link_answer` sein)
- Leerzeichen im Constraint: `"weekly tests_pkey"` (nicht ideal)

**Felder-Bedeutung:**
- `title` - Titel des Tests
- `link_question` - Link zur Fragen-PDF
- `link_answere` - Link zur Antworten-PDF
- `class_id` - Für welche Klasse (NULL = für alle)

**RLS Policies:**
- **SELECT:** Klassenbasiert (wie materials)
  - Students: Nur eigene Klasse
  - Teachers: Nur unterrichtete Klassen
  - Parents: Nur Klassen ihrer Kinder
  - Admins: Alles
  - `class_id = NULL`: Für alle sichtbar
  
- **INSERT/UPDATE/DELETE:** `is_admin()` ODER `is_teacher()`

---

## 🔧 HELPER-FUNKTIONEN (KOMPLETT)

### 1. is_admin()
```sql
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

**Verwendung:** Nur in RLS Policies, nicht im Frontend!

---

### 2. is_teacher()
```sql
CREATE OR REPLACE FUNCTION public.is_teacher() 
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$;
```

---

### 3. is_parent()
```sql
CREATE OR REPLACE FUNCTION public.is_parent() 
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'parent'
  );
END;
$$;
```

---

### 4. has_editing_right()
```sql
CREATE OR REPLACE FUNCTION public.has_editing_right() 
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND (editing_right = true OR role = 'admin')
  );
END;
$$;
```

**🎯 WICHTIG:** Admin hat IMMER editing_right, auch ohne `editing_right = true`!

**Wer kann was mit `has_editing_right()`:**
- ✅ Admin: IMMER (egal ob `editing_right` gesetzt)
- ✅ Teacher mit `editing_right = true`: JA
- ✅ Student mit `editing_right = true`: JA (falls Admin das setzt)
- ❌ Teacher OHNE `editing_right`: NEIN

**Betroffene Tabellen:**
- `questions` - Verwalten
- `materials` - Erstellen/Editieren/Löschen
- `pedagogic_tips` - Verwalten
- `missions` - Verwalten
- `class_materials` - Verwalten

---

### 5. get_user_class_id()
```sql
CREATE OR REPLACE FUNCTION public.get_user_class_id() 
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT class_id FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$;
```

**Verwendung:** Gibt die `class_id` des aktuellen Users zurück (oder NULL)

**Genutzt in:** Materials, Appointments, Weekly_tests SELECT Policies

---

### 6. protect_profile_sensitive_fields()
```sql
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) 
       OR (NEW.xp IS DISTINCT FROM OLD.xp)
       OR (NEW.level IS DISTINCT FROM OLD.level)
       OR (NEW.editing_right IS DISTINCT FROM OLD.editing_right) 
       OR (NEW.class_id IS DISTINCT FROM OLD.class_id) THEN
       RAISE EXCEPTION 'Security: Cannot change restricted profile fields (role, xp, level, editing_right, class_id)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

**🚨 KRITISCH:** Verhindert XP/Role-Hacking!

**Geschützte Felder (nur Admin kann ändern):**
- `role` - User kann sich NICHT zu admin machen
- `xp` - User kann sich NICHT 99999 XP geben
- `level` - User kann sich NICHT Level 100 geben
- `editing_right` - User kann sich NICHT Rechte geben
- `class_id` - User kann NICHT Klasse wechseln

**Erlaubte Felder (User kann ändern):**
- `full_name` - Name ändern OK
- `avatar_url` - Avatar wechseln OK
- `last_streak_date` - System updated automatisch
- `last_login` - Wird durch anderen Trigger updated

---

### 7. update_last_login() (Automatischer Trigger)
```sql
-- Diese Funktion existiert und wird durch Trigger aufgerufen:
CREATE TRIGGER trg_update_last_login 
BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_last_login();
```

**Was es macht:** Updated automatisch das `last_login` Feld bei jedem Profile-Update

**Frontend-Auswirkung:** KEINE - passiert automatisch im Hintergrund

---

### 8. handle_new_user_missions() (Automatischer Trigger)
```sql
-- Diese Funktion existiert und wird durch Trigger aufgerufen:
CREATE TRIGGER on_auth_user_created_missions 
AFTER INSERT ON profiles 
FOR EACH ROW EXECUTE FUNCTION handle_new_user_missions();
```

**Was es macht:** Erstellt automatisch Missions-Progress Einträge für neue User

**Frontend-Auswirkung:** Neue User haben direkt Missionen verfügbar

---

## 🔒 RLS POLICY ZUSAMMENFASSUNG

### WER KANN WAS? (Komplette Matrix)

#### 📚 Students können:
- ✅ **Materials:** NUR eigene Klasse lesen
- ✅ **Appointments:** NUR eigene Klasse lesen
- ✅ **Weekly_tests:** NUR eigene Klasse lesen
- ✅ **Questions:** Lesen (für Game)
- ✅ **Missions:** Lesen
- ✅ **Missions_progress:** Eigenen Progress lesen/erstellen/updaten
- ✅ **User_badges:** Eigene Badges lesen/erstellen
- ✅ **Eigenes Profil:** Nur Name/Avatar ändern
- ❌ **Materials:** NICHT erstellen/editieren/löschen
- ❌ **Questions:** NICHT verwalten
- ❌ **Appointments:** NICHT erstellen/editieren
- ❌ **Profil:** NICHT role/xp/level/editing_right/class_id ändern

#### 👨‍🏫 Teachers können:
- ✅ **Materials:** Unterrichtete Klassen lesen
- ✅ **Appointments:** Unterrichtete Klassen lesen/erstellen/editieren/löschen
- ✅ **Weekly_tests:** Unterrichtete Klassen lesen/erstellen/editieren/löschen
- ✅ **Missions_progress:** Schüler-Progress lesen
- ✅ **User_badges:** Schüler-Badges lesen
- ✅ **Mit `editing_right = true`:** Questions/Materials/Tips verwalten
- ❌ **Ohne `editing_right`:** NICHT Questions/Materials/Tips verwalten

#### 👨‍👩‍👧 Parents können:
- ✅ **Materials:** Klassen ihrer Kinder lesen
- ✅ **Appointments:** Klassen ihrer Kinder lesen
- ✅ **Weekly_tests:** Klassen ihrer Kinder lesen
- ✅ **Missions_progress:** Kinder-Progress lesen
- ✅ **User_badges:** Kinder-Badges lesen
- ❌ **Questions:** NICHT lesen (sollen nicht spielen!)
- ❌ **Nichts erstellen/editieren**

#### 👑 Admins können:
- ✅ **ALLES** lesen
- ✅ **ALLES** erstellen/editieren/löschen
- ✅ **Automatisch** `has_editing_right()` = true
- ✅ **Profile:** Können sensible Felder ändern (role, xp, etc.)

---

## 🐛 HÄUFIGE PROBLEME & CHECKS FÜR COPILOT

### 1. ❌ Materials zeigt zu viel/zu wenig
```javascript
// Problem: Student sieht ALLE Materialien (auch andere Klassen)
const { data } = await supabase.from('materials').select('*')
console.log('Anzahl Materials:', data.length)

// Check: Student sollte NUR eigene Klasse sehen
// Wenn mehr → RLS funktioniert nicht!
```

### 2. ❌ Upload schlägt fehl
```javascript
// Problem: "new row violates row-level security policy"
const { error } = await supabase.from('materials').insert({...})

// Check: Hat User editing_right?
const { data: profile } = await supabase
  .from('profiles')
  .select('editing_right, role')
  .eq('id', userId)
  .single()

console.log('Has editing right?', profile.editing_right || profile.role === 'admin')
// Falls false: Admin muss editing_right setzen!
```

### 3. ❌ Badge erstellen schlägt fehl
```javascript
// Problem: Badge-System funktioniert nicht
const { error } = await supabase
  .from('user_badges')
  .insert({ user_id: userId, badge_id: 'perfect_round' })

if (error) {
  console.error('Badge Error:', error)
  // Sollte NICHT fehlschlagen für eigenen User!
  // Kritischer Bug wenn das nicht funktioniert!
}
```

### 4. ❌ Progress update schlägt fehl
```javascript
// Problem: Game kann Progress nicht speichern
const { error } = await supabase
  .from('missions_progress')
  .update({ progress: 5 })
  .eq('user_id', userId)
  .eq('mission_id', 1)

if (error) {
  console.error('Progress Error:', error)
  // Sollte NICHT fehlschlagen für eigenen Progress!
  // Kritischer Bug!
}
```

### 5. ❌ Student sieht ALLE Materials
```sql
-- Check: Ist RLS aktiv?
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'materials';

-- rowsecurity MUSS true sein!
```

### 6. ❌ Trigger blockt legitime Updates
```javascript
// Problem: User kann nicht mal Namen ändern
const { error } = await supabase
  .from('profiles')
  .update({ full_name: 'Neuer Name' })
  .eq('id', userId)

// Sollte funktionieren! Falls nicht: Trigger-Bug!
```

---

## 📝 WICHTIGE FRONTEND-PATTERNS FÜR COPILOT

### ✅ Pattern 1: Error Handling (IMMER!)
```javascript
// ❌ FALSCH:
const { data } = await supabase.from('materials').select('*')
materials = data  // Kann null sein → Crash!

// ✅ RICHTIG:
const { data, error } = await supabase.from('materials').select('*')
if (error) {
  console.error('RLS Error:', error)
  materials = []  // Fallback
  // Optional: User-Friendly Message zeigen
} else {
  materials = data || []  // Null-safe
}
```

### ✅ Pattern 2: Auth-Check in onMount
```javascript
// ❌ FALSCH: Keine Auth-Check
onMount(async () => {
  loadMaterials()  // Jeder kann zugreifen!
})

// ✅ RICHTIG:
onMount(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    goto('/login_page')
    return
  }
  loadMaterials()
})
```

### ✅ Pattern 3: Role-Check für UI
```javascript
let userRole = $state(null)
let hasEditingRight = $state(false)

onMount(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, editing_right')
    .eq('id', user.id)
    .single()
  
  userRole = profile.role
  hasEditingRight = profile.editing_right || profile.role === 'admin'
})

// Im Template:
{#if userRole === 'teacher' || userRole === 'admin' || hasEditingRight}
  <button>Material hinzufügen</button>
{/if}
```

### ✅ Pattern 4: Null-Safe Array Operations
```javascript
// ❌ FALSCH:
data.map(item => ...)  // Crash wenn data = null!

// ✅ RICHTIG:
(data || []).map(item => ...)
```

### ✅ Pattern 5: Badge-System Error Handling
```javascript
// In badgeService.js:
export async function checkAndAwardBadges(supabase, userId, gameResult) {
  const newBadges = []
  
  // Check conditions...
  if (shouldAwardBadge) {
    const { error } = await supabase
      .from('user_badges')
      .insert({ user_id: userId, badge_id: badgeId })
    
    if (error) {
      // Falls unique constraint: Badge existiert schon (OK)
      if (!error.message.includes('unique_user_badge')) {
        console.error('Badge Error:', error)
        // NICHT werfen - Game sollte nicht crashen
      }
    } else {
      newBadges.push(badgeId)
    }
  }
  
  return newBadges
}
```

---

## ✅ TEST-CHECKLISTE FÜR COPILOT-REVIEW

### 🔍 Zu prüfende Dateien:

#### Kritische Komponenten:
- [ ] Materials Overview
- [ ] Material Detail
- [ ] Material Upload
- [ ] Game
- [ ] Progress Page
- [ ] Appointments
- [ ] Questions Manage (falls vorhanden)

#### Kritische Services:
- [ ] Badge-System
- [ ] DB Helper Functions
- [ ] Supabase Client

---

### 📋 Was Copilot prüfen soll:

#### 1. Fehlende Error-Handling:
- [ ] Queries ohne `error` variable
- [ ] Fehlende Null-Checks auf `data`
- [ ] Keine try-catch bei kritischen Operationen

#### 2. RLS-Probleme:
- [ ] Funktionen die durch klassenbasierte Filter brechen könnten
- [ ] Badge/Progress Updates ohne Error-Handling
- [ ] Material-Queries die leere Arrays zurückgeben könnten

#### 3. Auth-Checks:
- [ ] Seiten ohne `supabase.auth.getUser()`
- [ ] Fehlende Redirects bei nicht-eingeloggt
- [ ] Upload-Seiten ohne Role-Check

#### 4. Kritische Features:
- [ ] Badge-System funktioniert (badgeService.js)
- [ ] Progress-Update funktioniert (nach Game)
- [ ] Material-Upload funktioniert (Teacher/Admin)
- [ ] Material-View klassenbasiert (Student sieht nur eigene)

#### 5. Direkte Profil-Updates:
- [ ] Code der versucht `role`, `xp`, `level`, `editing_right`, `class_id` zu ändern
- [ ] Wird durch Trigger geblockt!

---

## 🎯 AUSGABE-FORMAT FÜR COPILOT

Bitte strukturiere deine Findings so:

```markdown
# Code Review Results - HSGG Lernwelt

## ❌ KRITISCHE PROBLEME (sofort fixen!)
1. **[Datei]** - [Problem]
   - Code: `...`
   - Warum kritisch: ...
   - Fix: `...`

## ⚠️ WARNINGS (sollten gefixt werden)
1. **[Datei]** - [Problem]
   - Code: `...`
   - Auswirkung: ...
   - Fix: `...`

## ✅ WAS GUT LÄUFT
- [Feature] funktioniert korrekt
- [Pattern] ist gut implementiert

## 📊 ZUSAMMENFASSUNG
- Kritische Probleme: X
- Warnings: Y
- Datenbankzugriffe geprüft: Z
```

---

## 🚀 ZUSATZ-INFO FÜR GITHUB COPILOT

### Kontext für GPT-5:
- **Projekt:** Svelte 5 (Runes Mode) + SvelteKit + Supabase
- **Sprache:** TypeScript/JavaScript mit JSDoc
- **Auth:** Supabase Auth mit Session-basiertem Login
- **RLS:** Frisch implementiert (05.01.2026)
- **Kritisch:** Badge-System und Progress-Updates MÜSSEN funktionieren!

### Bekannte Patterns im Projekt:
```javascript
// State in Svelte 5 Runes:
let materials = $state([])

// Supabase Client:
import { supabase } from '$lib/supabaseClient'

// Navigation:
import { goto } from '$app/navigation'

// Page Params:
import { page } from '$app/stores'
const materialId = $page.params.id
```

---


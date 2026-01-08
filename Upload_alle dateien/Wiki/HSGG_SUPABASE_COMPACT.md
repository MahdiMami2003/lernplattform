# HSGG LERNWELT - SUPABASE IMPLEMENTIERUNG
## Technische Dokumentation (Kompakt)

**Projekt:** Digitale Lernplattform für Schulen  
**Tech Stack:** SvelteKit + Supabase  
**Team:** Joshua & Kollegen  
**Zeitraum:** 2024-2026

---

## 1. PROJEKTÜBERSICHT

### Was ist HSGG Lernwelt?

Eine vollständige Lernplattform mit:
- 📚 Materialverwaltung (PDFs)
- 🎮 Interaktives Lerngame mit Quiz
- 🏆 Gamification (XP, Levels, Badges)
- 📅 Termine & News
- 👨‍🏫 Pädagogische Tipps
- 🧪 Wöchentliche Tests

### User Rollen

| Rolle | Funktionen |
|-------|------------|
| **Students** | Materialien ansehen, Game spielen, Fortschritt tracken |
| **Teachers** | Content erstellen, Klassen verwalten, Monitoring |
| **Parents** | Fortschritt der Kinder einsehen |
| **Admins** | Komplette Systemverwaltung |

### Architektur

```
SvelteKit Frontend (Svelte 5)
           ↓
    Supabase Backend
    ├── PostgreSQL (14 Tabellen)
    ├── Authentication (JWT)
    ├── Storage (3 Buckets)
    └── RLS (50+ Policies)
```

---

## 2. SUPABASE FEATURES

### Genutzte Services

| Service | Zweck | Umfang |
|---------|-------|--------|
| **PostgreSQL** | Datenbank | 14 Tabellen |
| **Auth** | User Management | Email/Password, Sessions |
| **Storage** | PDF/Images | 3 Buckets (~8GB) |
| **RLS** | Security | 50+ Policies |

### Warum Supabase?

✅ Open Source  
✅ PostgreSQL (bewährt)  
✅ Built-in Auth & RLS  
✅ TypeScript Support  
✅ Realtime-Ready  

---

## 3. DATENBANK

### Core Tabellen

**`profiles`** - User & Gamification
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  role text CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
  class_id bigint REFERENCES classes(id),
  
  -- Gamification:
  xp bigint DEFAULT 0,
  level bigint DEFAULT 1,
  avatar_url text,
  
  -- Permissions:
  editing_right boolean DEFAULT false
);
```

**`materials`** - Lernmaterialien
```sql
CREATE TABLE materials (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  subject text,
  file_url text,
  class_id bigint REFERENCES classes(id)  -- NULL = für alle
);
```

**`questions`** - Quiz-Fragen
```sql
CREATE TABLE questions (
  id bigserial PRIMARY KEY,
  question text NOT NULL,
  a1 text, a2 text, a3 text, a4 text,
  correct_index integer,
  subject text,
  xp_reward integer DEFAULT 10
);
```

**`user_badges`** - Achievements
```sql
CREATE TABLE user_badges (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  badge_id text NOT NULL,
  UNIQUE(user_id, badge_id)
);
```

### Weitere Tabellen

- `classes` - Schulklassen
- `teacher_role` - Lehrer-Klassen-Zuordnung
- `appointments` - Termine/News
- `missions` / `missions_progress` - Gamification
- `weekly_tests` - Wöchentliche Tests
- `pedagogic_tips` - Tipps für Lehrer

### Key Features

**Indizes für Performance:**
```sql
CREATE INDEX idx_materials_class_id ON materials(class_id);
CREATE INDEX idx_questions_subject ON questions(subject);
```

**Foreign Keys mit Cascade:**
```sql
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
```

---

## 4. AUTHENTICATION

### Setup

```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Auth Flow

**Login:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@school.de',
  password: 'password'
})
```

**Session Check:**
```javascript
const { data: { user } } = await supabase.auth.getUser()
if (!user) goto('/login_page')
```

**Role Check:**
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, editing_right')
  .eq('id', user.id)
  .single()
```

---

## 5. ROW LEVEL SECURITY (RLS)

### Konzept

RLS filtert Daten **automatisch** basierend auf User:

```javascript
// Student Query:
const { data } = await supabase.from('materials').select('*')
// → RLS filtert: WHERE class_id = student.class_id
```

### Helper Functions

```sql
-- Prüft ob Admin:
CREATE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Prüft editing_right:
CREATE FUNCTION has_editing_right() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
      AND (editing_right = true OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql;
```

### Policy Beispiele

**Materials - Klassenbasiert:**
```sql
CREATE POLICY "materials_select" ON materials FOR SELECT
USING (
  is_admin()
  OR class_id IS NULL
  OR class_id = (SELECT class_id FROM profiles WHERE id = auth.uid())
);
```

**Questions - Nur mit editing_right ändern:**
```sql
CREATE POLICY "questions_modify" ON questions FOR ALL 
USING (has_editing_right())
WITH CHECK (has_editing_right());
```

**User Badges - Nur eigene:**
```sql
CREATE POLICY "user_badges_select" ON user_badges FOR SELECT
USING (user_id = auth.uid() OR is_admin());
```

### Profile Protection

```sql
-- Trigger verhindert Privilege Escalation:
CREATE FUNCTION protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT is_admin() THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) 
       OR (NEW.xp IS DISTINCT FROM OLD.xp)
       OR (NEW.editing_right IS DISTINCT FROM OLD.editing_right) THEN
       RAISE EXCEPTION 'Cannot change restricted fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. STORAGE

### Buckets

| Bucket | Zweck | Public? |
|--------|-------|---------|
| `lehrmaterialien` | PDF-Materialien | ✅ Ja |
| `avatars` | Avatar-Bilder | ✅ Ja |
| `weekly_tests` | Test-PDFs | ❌ Nein |

### Upload Flow

```javascript
// 1. Upload File
const { data, error } = await supabase.storage
  .from('lehrmaterialien')
  .upload(`Math/material_${id}.pdf`, file)

// 2. Get Public URL
const { data: urlData } = supabase.storage
  .from('lehrmaterialien')
  .getPublicUrl(filePath)

// 3. Save to DB
await supabase.from('materials').insert({
  title: 'Mathe Übung',
  file_url: urlData.publicUrl
})
```

### Storage Policies

**Public Read:**
```sql
CREATE POLICY "public_read_materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lehrmaterialien');
```

**Teacher Upload:**
```sql
CREATE POLICY "teachers_insert_materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lehrmaterialien'
  AND has_editing_right()
);
```

---

## 7. FRONTEND INTEGRATION

### Typische Queries

**Load mit RLS:**
```javascript
// RLS filtert automatisch nach class_id:
const { data, error } = await supabase
  .from('materials')
  .select('*')
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error:', error)
  materials = []
} else {
  materials = data || []
}
```

**Insert von Lerninhalten:**
```javascript
const { error } = await supabase
  .from('materials')
  .insert({ title, subject, file_url, class_id })

if (error) {
  alert('Fehler: ' + error.message)
}
```

**Update mit Self-Scope der Fortschritte der missionen:**
```javascript
// Student updated eigenen Progress:
await supabase
  .from('missions_progress')
  .update({ progress: progress + 1 })
  .eq('user_id', userId)  // ← RLS braucht das!
  .eq('mission_id', missionId)
```

### Error Handling

```javascript
async function loadData() {
  const { data, error } = await supabase.from('table').select('*')
  
  if (error) {
    if (error.message.includes('JWT')) {
      goto('/login_page')
    } else {
      console.error('Error:', error)
      return []
    }
  }
  
  return data || []
}
```

---

## 8. SICHERHEITSKONZEPT

### Multi-Layer Security

```
1. Frontend Auth-Checks → Verhindert UI-Zugriff
2. RLS Policies → Filtert Daten automatisch
3. Storage Policies → Schützt Files
4. Triggers → Verhindert Manipulation
5. Constraints → Daten-Integrität
```

### Verhinderte Angriffe

✅ **SQL Injection** - Supabase nutzt Prepared Statements  
✅ **Privilege Escalation** - Trigger blockt role/xp Änderungen  
✅ **Cross-Class Access** - RLS filtert automatisch  
✅ **Unauthorized Uploads** - Storage Policies prüfen Rolle  

### Best Practices

```javascript
// Auth-Check auf jeder Seite
onMount(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) goto('/login_page')
})

// Error-Handling überall
const { data, error } = await supabase.from('table').select('*')
if (error) { /* handle */ }

```

---

## 9. PERFORMANCE

### Optimierungen

**Database:**
- Indizes auf class_id, user_id, subject
- STABLE Functions für RLS
- Query-Limits mit `.range(0, 19)`

**Frontend:**
- Caching von User-Profil
- Lazy Loading von Materials
- Realtime nur wo nötig

**Storage:**
- Cloudflare CDN automatisch
- PDF Compression optional

---

## 10. PROJEKT-STATISTIKEN

### Zahlen

- **14 Tabellen** mit Relationen
- **50+ RLS Policies** für Sicherheit
- **6 Helper-Funktionen** (DRY Prinzip)
- **3 Storage Buckets** (~8GB)
- **4 User-Rollen** mit Permissions
- **~1,500 User** (~500 aktive/Tag)

### Systemaufbau

```
Frontend: SvelteKit + Svelte 5
Backend: Supabase (PostgreSQL 14)
Auth: JWT + Sessions
Security: RLS + Triggers + Constraints
Storage: 3 Buckets (lehrmaterialien, avatars, weekly_tests)
```

---

#
## 12. DEPLOYMENT

### Production Setup in .env Datei

**Environment Variables:**
```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

**Hosting:**
- Frontend: Vercel
- Backend: Supabase Cloud
- Database: Supabase (managed)

**Monitoring:**
- Supabase Dashboard
- Query Performance
- Storage Usage
- Auth Metrics

---


**Ende der Dokumentation**

*Erstellt: Januar 2026*  
*Team: Team 5A-1*  
*Tech Stack: SvelteKit + Supabase*

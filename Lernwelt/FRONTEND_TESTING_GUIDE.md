# FRONTEND TESTING GUIDE - RLS & STORAGE POLICIES
**Für GitHub Copilot (GPT-5) - Code Verification**

Datum: 05.01.2026

---

## 🎯 AUFGABE

Überprüfe ob das Frontend nach der RLS-Implementierung noch funktioniert.

**Kontext:**
- Row Level Security (RLS) wurde implementiert
- Storage Policies wurden konfiguriert (öffentlich)
- Code-Fixes aus Review wurden angewendet

**Deine Aufgabe:**
Teste systematisch alle kritischen User-Flows und identifiziere Probleme.

---

## 📋 TEST-KATALOG

### **KRITISCH - MUSS funktionieren:**
1. ✅ Student kann Materials seiner Klasse sehen
2. ✅ Student kann Game spielen und Badges verdienen
3. ✅ Teacher kann Materials hochladen
4. ✅ Teacher sieht alle seine Klassen
5. ✅ Badge-System funktioniert nach Game

### **WICHTIG - SOLLTE funktionieren:**
6. ✅ Error Handling bei leeren Results
7. ✅ Auth-Checks auf geschützten Seiten
8. ✅ UI-Gating basierend auf Rolle

---

## 🧪 TEST 1: STUDENT - MATERIALS VIEW

### **Datei:** `routes/material_page_id14/+page.svelte`

### **Zu prüfen:**

#### ✅ Check 1: Auth-Check vorhanden?
```javascript
// MUSS vorhanden sein:
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  goto('/login_page')
  return
}
```

**Falls FEHLT:**
```javascript
// ❌ Problem: Seite ohne Auth-Check
// ✅ Fix: Auth-Check am Anfang von onMount() hinzufügen
```

---

#### ✅ Check 2: Materials Query mit Error-Handling?
```javascript
// SOLLTE sein:
const { data, error } = await supabase.from('materials').select('*')
if (error) {
  console.error('Error loading materials:', error)
  materials = []
} else {
  materials = data || []
}

// ❌ NICHT:
const { data } = await supabase.from('materials').select('*')
materials = data  // Kann null sein!
```

**Falls FEHLT:**
```javascript
// ❌ Problem: Kein Error-Handling
// ✅ Fix: 
const { data, error } = await supabase.from('materials').select('*')
if (error) {
  console.error('Error:', error)
  materials = []
} else {
  materials = data || []
}
```

---

#### ✅ Check 3: Klassenfilter funktioniert automatisch?
```javascript
// Student sollte NUR Materials seiner Klasse sehen
// RLS filtert automatisch - kein manueller Filter nötig!

// ❌ NICHT nötig:
.eq('class_id', userClassId)  // RLS macht das schon!

// ✅ Einfach:
.select('*')  // RLS filtert automatisch
```

**Test:**
```
1. Login als Student (z.B. class_id = 1)
2. Lade Materials
3. Prüfe: Nur class_id = 1 oder class_id = NULL?
4. Keine Materials von anderen Klassen sichtbar?
```

---

#### ✅ Check 4: UI-Gating für Upload-Button?
```javascript
// SOLLTE sein:
let userRole = $state(null)
let hasEditingRight = $state(false)

// Dann im Template:
{#if userRole === 'teacher' || userRole === 'admin' || hasEditingRight}
  <button>Material hinzufügen</button>
{/if}

// ❌ NICHT:
<button>Material hinzufügen</button>  // Für alle sichtbar!
```

**Falls FEHLT:**
```javascript
// ❌ Problem: Upload-Button für Students sichtbar
// ✅ Fix: Conditional rendering basierend auf Rolle
```

---

## 🧪 TEST 2: TEACHER - MATERIALS UPLOAD

### **Datei:** `routes/form_for_adding_content/+page.svelte`

### **Zu prüfen:**

#### ✅ Check 1: Auth + Role-Check?
```javascript
// MUSS vorhanden sein:
const { data: { user } } = await supabase.auth.getUser()
if (!user) goto('/login_page')

const { data: profile } = await supabase
  .from('profiles')
  .select('role, editing_right')
  .eq('id', user.id)
  .single()

// Optional aber empfohlen:
if (profile.role !== 'teacher' && profile.role !== 'admin' && !profile.editing_right) {
  alert('Keine Berechtigung!')
  goto('/material_page_id14')
}
```

**Falls FEHLT:**
```javascript
// ❌ Problem: Jeder kann Upload-Seite aufrufen
// ⚠️ Hinweis: RLS blockt trotzdem, aber besser vorher prüfen
```

---

#### ✅ Check 2: Storage Upload mit Error-Handling?
```javascript
// SOLLTE sein:
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('lehrmaterialien')
  .upload(filePath, file)

if (uploadError) {
  console.error('Upload Error:', uploadError)
  alert('Upload fehlgeschlagen: ' + uploadError.message)
  return
}

// ❌ NICHT:
const { data } = await supabase.storage
  .from('lehrmaterialien')
  .upload(filePath, file)
// Kein Error-Check!
```

**Falls FEHLT:**
```javascript
// ❌ Problem: Upload-Fehler werden nicht behandelt
// ✅ Fix: Error-Handling hinzufügen
```

---

#### ✅ Check 3: DB Insert mit Error-Handling?
```javascript
// SOLLTE sein:
const { error: insertError } = await supabase
  .from('materials')
  .insert({ title, description, file_url, subject, class_id })

if (insertError) {
  console.error('DB Insert Error:', insertError)
  alert('Speichern fehlgeschlagen')
  return
}

// ❌ NICHT:
await supabase.from('materials').insert({...})
// Kein Error-Check!
```

---

## 🧪 TEST 3: STUDENT - GAME & BADGES

### **Datei:** `routes/educational-game-page-id-8/+page.svelte`

### **Zu prüfen:**

#### ✅ Check 1: Questions Load funktioniert?
```javascript
// Questions sollten laden:
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('subject', selectedSubject)

// Student kann lesen - Parent NICHT!
```

**Test:**
```
1. Login als Student
2. Starte Game
3. Fragen laden? ✅
4. Kein Error in Console? ✅
```

---

#### ✅ Check 2: Badge Insert nach Game?

**Datei:** `src/lib/badgeService.js`

```javascript
// KRITISCH - MUSS funktionieren:
export async function checkAndAwardBadges(supabase, userId, gameResult) {
  // ... Badge-Logic ...
  
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId })
  
  if (error) {
    // ✅ GUT: Duplicate-Fehler ignorieren
    if (!error.message?.includes('unique_user_badge')) {
      console.error('Badge Error:', error)
    }
    // ❌ SCHLECHT: Alle Fehler ignorieren
  }
}
```

**Test:**
```
1. Login als Student
2. Spiele Game zu Ende (100% richtig)
3. Badge "perfect_round" wird erstellt? ✅
4. Kein Error in Console? ✅
5. Badge erscheint in DB? ✅
```

---

#### ✅ Check 3: Missions Progress Update?

```javascript
// Nach Game:
const { error } = await supabase
  .from('missions_progress')
  .update({ progress: progress + 1 })
  .eq('user_id', userId)  // ← MUSS da sein!
  .eq('mission_id', missionId)

if (error) {
  console.error('Progress Update Error:', error)
}
```

**Test:**
```
1. Login als Student
2. Spiele Game
3. Check DB: missions_progress.progress erhöht? ✅
4. Kein Error in Console? ✅
```

---

## 🧪 TEST 4: APPOINTMENTS

### **Datei:** `routes/appointments_page_*/+page.svelte`

### **Zu prüfen:**

#### ✅ Check 1: Spaltenname `classid` (NICHT `class_id`!)

```javascript
// ❌ FALSCH:
.select('id, title, content, class_id, event_date')
.insert({ title, content, class_id, event_date })
.eq('class_id', classId)

// ✅ RICHTIG:
.select('id, title, content, classid, event_date')
.insert({ title, content, classid, event_date })
.eq('classid', classId)
```

**Suche nach:**
- `class_id` in Appointments-Queries
- Sollte `classid` sein!

**Falls FALSCH:**
```javascript
// ❌ Problem: Feld heißt "classid" nicht "class_id"
// ✅ Fix: Alle Vorkommen ersetzen
```

---

#### ✅ Check 2: Klassenfilter funktioniert?

```javascript
// Student sollte NUR Termine seiner Klasse sehen
// RLS filtert automatisch!

const { data } = await supabase.from('appointments').select('*')
// Automatisch gefiltert nach classid = student.class_id
```

**Test:**
```
1. Login als Student (z.B. class_id = 1)
2. Lade Appointments
3. Prüfe: Nur classid = 1 oder classid = NULL? ✅
4. Keine Termine anderer Klassen? ✅
```

---

## 🧪 TEST 5: WEEKLY TESTS

### **Datei:** Weekly Tests Upload/View Seiten

### **Zu prüfen:**

#### ✅ Check 1: Feldname `link_answere` (Typo!)

```javascript
// ❌ FALSCH:
.select('id, title, link_question, link_answer, class_id')
.insert({ title, link_question, link_answer, class_id })

// ✅ RICHTIG:
.select('id, title, link_question, link_answere, class_id')
.insert({ title, link_question, link_answere, class_id })
```

**Suche nach:**
- `link_answer` (ohne 'e')
- Sollte `link_answere` sein!

---

## 🧪 TEST 6: DB HELPERS

### **Datei:** `src/lib/dbHelpers.js`

### **Zu prüfen:**

#### ✅ Check 1: Tabellenname `teacher_role` (NICHT `teacher_classes`!)

```javascript
// ❌ FALSCH:
const { data } = await supabase
  .from('teacher_classes')
  .select('class_id')
  .eq('teacher_id', userId)

// ✅ RICHTIG:
const { data } = await supabase
  .from('teacher_role')
  .select('class_id')
  .eq('teacher_id', userId)
```

**Suche nach:**
- `teacher_classes` in allen Queries
- Sollte `teacher_role` sein!

**Falls FALSCH:**
```javascript
// ❌ Problem: Tabelle heißt "teacher_role" nicht "teacher_classes"
// ✅ Fix: Global Replace: teacher_classes → teacher_role
```

---

## 🧪 TEST 7: PROFILE UPDATES

### **Alle Dateien**

### **Zu prüfen:**

#### ✅ Check 1: Keine sensiblen Felder updaten!

**VERBOTEN zu ändern:**
- `role`
- `xp`
- `level`
- `editing_right`
- `class_id`

**Suche nach:**
```javascript
// ❌ SCHLECHT:
.update({ role: 'admin', xp: 99999, level: 100 })
.update({ editing_right: true })
.update({ class_id: newClassId })

// ✅ ERLAUBT:
.update({ full_name: 'Neuer Name' })
.update({ avatar_url: '/new-avatar.png' })
```

**Falls GEFUNDEN:**
```javascript
// ❌ Problem: Trigger wird blocken!
// ✅ Fix: Entfernen oder nur über Admin-API
```

---

## 📊 TEST-MATRIX

Nach allen Tests diese Matrix ausfüllen:

### **Student Account Tests:**

| Feature | Funktioniert? | Error? | Notizen |
|---------|---------------|--------|---------|
| Materials View (nur eigene Klasse) | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Materials Upload blockiert | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Game spielbar | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Badge nach Game | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Progress Update | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Appointments (nur eigene Klasse) | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Profile Update (Name/Avatar) | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |

### **Teacher Account Tests:**

| Feature | Funktioniert? | Error? | Notizen |
|---------|---------------|--------|---------|
| Materials View (alle Klassen) | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Materials Upload | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Appointments Create | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Questions Manage (mit editing_right) | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |
| Schüler-Progress sichtbar | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein | |

---

## 🐛 HÄUFIGE FEHLER ZUM SUCHEN:

### **1. Query ohne Error-Handling:**
```javascript
// Suche nach:
const { data } = await supabase.from(...)
// Ohne: if (error)
```

### **2. Fehlende Auth-Checks:**
```javascript
// Suche nach onMount ohne:
const { data: { user } } = await supabase.auth.getUser()
if (!user) goto('/login_page')
```

### **3. Null-Unsafe Array Operations:**
```javascript
// Suche nach:
data.map(...)
data.filter(...)
// Ohne: (data || []).map(...)
```

### **4. Falsche Tabellennamen:**
```javascript
// Suche nach:
.from('teacher_classes')  // ❌ Falsch
// Sollte sein:
.from('teacher_role')     // ✅ Richtig
```

### **5. Falsche Spaltennamen:**
```javascript
// In appointments:
class_id    // ❌ Falsch
classid     // ✅ Richtig

// In weekly_tests:
link_answer  // ❌ Falsch
link_answere // ✅ Richtig
```

---

## 📋 AUSGABE-FORMAT

Bitte strukturiere deine Findings so:

```markdown
# Frontend Testing Results - HSGG Lernwelt

## ❌ KRITISCHE PROBLEME (Breaking!)

### 1. [Dateiname] - [Problem]
- **Code:** `zeile 123: const { data } = ...`
- **Problem:** Kein Error-Handling
- **Auswirkung:** Seite crashed wenn Query fehlschlägt
- **Fix:** 
  ```javascript
  const { data, error } = await supabase...
  if (error) { console.error(error); return [] }
  ```

## ⚠️ WARNINGS (Sollten gefixt werden)

### 1. [Dateiname] - [Problem]
- **Code:** `...`
- **Problem:** ...
- **Fix:** ...

## ✅ WAS GUT FUNKTIONIERT

- Materials View filtert klassenbasiert
- Badge-System funktioniert
- Auth-Checks vorhanden

## 📊 TEST-MATRIX

Student Tests: 5/7 erfolgreich
Teacher Tests: 4/5 erfolgreich

Details siehe Matrix oben.

## 🎯 PRIORITÄTEN

1. [Kritisches Problem 1]
2. [Kritisches Problem 2]
3. [Warning 1]
```

---

## 🎯 ZUSAMMENFASSUNG FÜR COPILOT

**Deine Aufgaben:**

1. ✅ Durchsuche alle genannten Dateien
2. ✅ Prüfe jeden Checkpoint
3. ✅ Identifiziere Probleme
4. ✅ Gib konkrete Fixes
5. ✅ Fülle Test-Matrix aus
6. ✅ Priorisiere Findings

**Fokus auf:**
- Error-Handling (KRITISCH!)
- Auth-Checks (WICHTIG!)
- Tabellen-/Spaltennamen (KRITISCH!)
- Badge/Progress System (KRITISCH!)

---

**ENDE DES TESTING GUIDE**

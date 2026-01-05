# Konkrete Codeänderungen – HSGG Lernwelt

Datum: 05.01.2026

Hinweis: Diese Datei beschreibt exakt die notwendigen Codeänderungen basierend auf der Referenz `AI_REVIEW_REFERENCE_V2_ACCURATE.md` und der aktuellen Codebasis. Es werden keine Änderungen direkt vorgenommen; die folgenden Schritte dienen als präzise Anleitung für die Implementierung.

## Übersicht der betroffenen Dateien
- `src/lib/dbHelpers.js`
- `src/lib/badgeService.js`
- Svelte Seiten/Komponenten gemäß Projektmapping:
  - Materials Overview (`material_page_id14`)
  - Material Detail (`material_content_page_16`)
  - Material Upload (`form_for_adding_content`)
  - Game Management (`game_management`)
  - Progress Page (`progress_page_id11`)
  - Appointments (`appointments_page_id8`)
  - Missions Management (`mission_management`)

## 1) `src/lib/dbHelpers.js`: Tabellenname vereinheitlichen (teacher_role)
Die Referenz definiert die Tabelle für Lehrer-Klassen-Zuordnungen als `teacher_role`. Im Code wird `teacher_classes` verwendet. Das muss projektweit vereinheitlicht werden.

Änderungen:
- Ersetze alle Vorkommen von `'teacher_classes'` durch `'teacher_role'`.
- Felder bleiben gleich (`teacher_id`, `class_id`).

Betroffene Funktionen inkl. exakte Anpassungen:
- `getUserClasses(supabase, userId, role)` – Zweig `teacher`:
  - `from('teacher_classes')` → `from('teacher_role')`
  - `select('classes ( id, name, grade_level )')` bleibt unverändert.
- `getAccessibleStudents(supabase, userId, role)` – Zweig `teacher`:
  - `from('teacher_classes').select('class_id').eq('teacher_id', userId)` → `from('teacher_role').select('class_id').eq('teacher_id', userId)`
- `assignTeacherToClass(supabase, teacherId, classId)`:
  - `from('teacher_classes').insert({ teacher_id: teacherId, class_id: classId })` → `from('teacher_role').insert({ teacher_id: teacherId, class_id: classId })`
- `removeTeacherFromClass(supabase, teacherId, classId)`:
  - `from('teacher_classes').delete().eq('teacher_id', teacherId).eq('class_id', classId)` → `from('teacher_role').delete().eq('teacher_id', teacherId).eq('class_id', classId)`

Zusätzlicher Check:
- Stelle sicher, dass an keiner anderen Stelle im Projekt `teacher_classes` referenziert wird. Falls doch, gleiche ebenfalls an `teacher_role` an.

## 2) Appointments: Spaltenname `classid` statt `class_id`
Die Referenz definiert die Spalte `classid` (nicht `class_id`). Prüfe und ändere alle Stellen in den Seiten/Services, die für Termine (Appointments) Daten lesen oder schreiben.

Änderungen:
- In allen Queries auf `appointments`:
  - Verwende `.eq('classid', ...)`, `.select('classid, ...')`, `.insert({ classid: ... })`, `.update({ classid: ... })`.
- In Formularen/Bindings/Modelen der Seite `appointments_page_id8`:
  - Benenne Formularfeld/State von `class_id` auf `classid` um.
- In UI-Filterlogik (Dropdowns etc.):
  - Wenn Klassenfilter bisher `class_id` verwendet, nutze `classid`.

Betroffene Seiten:
- `appointments_page_id8` (Anzeigen, Erstellen, Editieren, Löschen)
- Falls es Server-APIs unter `src/routes/api/...` für Appointments gibt, dort ebenfalls `classid` verwenden.

## 3) Weekly Tests: Feldname `link_answere` (Typo), Constraint beachten
Die Tabelle `weekly_tests` hat das Feld `link_answere` (mit "e"). Der Frontend-Code muss diesen Namen exakt verwenden.

Änderungen:
- In allen Queries gegen `weekly_tests`:
  - `.select('id, title, link_question, link_answere, class_id')`
  - `.insert({ title, link_question, link_answere, class_id })`
  - `.update({ link_answere: newValue })`
- Falls ein Frontend-Model/Interface vorhanden ist, das `link_answer` schreibt/liest, benenne es auf `link_answere` um.
- Keine direkte Änderung bzgl. des Constraint-Namens erforderlich; nur bei Fehlermeldungs-Parsing darauf vorbereitet sein, dass der Name Leerzeichen enthält (`"weekly tests_pkey"`).

Betroffene Seiten:
- Upload/Management von Weekly Tests (falls in `appointments_page_id8` integriert oder separater Bereich)

## 4) Badge-System: Duplicate-Insert sauber behandeln
`src/lib/badgeService.js` inseriert neue Badges in `user_badges`. Bei bereits vorhandenem Badge kann das Unique-Constraint `unique_user_badge` Fehler werfen. Der Code soll diese Duplikate still tolerieren.

Änderungen innerhalb `checkAndAwardBadges(...)`:
- Nach dem Insert-Call:
  ```js
  const { error: insertError } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId })
  
  if (insertError) {
    // Wenn Unique-Constraint (Badge existiert bereits) → ignorieren
    if (!String(insertError.message || '').includes('unique_user_badge')) {
      console.error(`Fehler beim Speichern von Badge ${badgeId}:`, insertError)
    }
  } else {
    newBadges.push(badgeId)
  }
  ```
- Die vorherige Variante, die den Fehler pauschal loggt ohne Unterscheidung, ersetzen.

Zusatz:
- Belasse das Vorab-Select zur Ermittlung vorhandener Badges optional, aber stelle sicher, dass ein Insert-Fehler bei Duplikaten nicht als kritischer Fehler behandelt wird.

## 5) Missions Progress: Self-Scope Update/Insert sicherstellen
Für `missions_progress` müssen Updates/Inserts immer auf den eigenen `user_id` gehen und mit RLS kompatibel sein.

Änderungen (betroffene Seiten: Game / Progress Page):
- Beim Update:
  ```js
  await supabase
    .from('missions_progress')
    .update({ progress: progress + 1 })
    .eq('user_id', userId)   // Eigener User
    .eq('mission_id', missionId)
  ```
- Beim Insert (falls noch kein Eintrag existiert):
  ```js
  await supabase
    .from('missions_progress')
    .insert({ user_id: userId, mission_id, progress: initialProgress })
  ```
- Fehlerbehandlung wie in der Referenz: Bei Fehler loggen, UI nicht crashen lassen.

## 6) Auth-Checks und UI-Gating in den Seiten
Die Referenz fordert vor jedem Datenzugriff einen Auth-Check und Role-basiertes UI-Gating.

Änderungen (generisches Muster, in allen genannten Seiten anwenden):
- In `onMount` bzw. Server-Load-Funktionen:
  ```js
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    goto('/login_page')
    return
  }
  ```
- Role- und Editing-Rechte laden:
  ```js
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, editing_right')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role
  const hasEditingRight = !!(profile?.editing_right || userRole === 'admin')
  ```
- UI-Gating für Upload/Management:
  ```svelte
  {#if userRole === 'teacher' || userRole === 'admin' || hasEditingRight}
    <!-- Buttons/Formulare für Upload/Management anzeigen -->
  {/if}
  ```

## 7) Fehlerbehandlung standardisieren (Queries)
In allen Seiten/Services sollten Supabase-Queries konsequent Fehler prüfen und Null-safe sein.

Änderungsvorgabe (Pattern):
```js
const { data, error } = await supabase.from('materials').select('*')
if (error) {
  console.error('RLS/Error:', error)
  materials = []
} else {
  materials = data || []
}
```
- Dieses Muster auf Materials-, Appointments-, Weekly Tests-, Questions-, Missions-, Progress-Queries anwenden.

## 8) Profile-Updates: Trigger-Schutz beachten
Client-Code darf sensible Felder nicht ändern: `role`, `xp`, `level`, `editing_right`, `class_id`.

Änderungen:
- Suche und entferne/ersetze alle Stellen, die versuchen, eines dieser Felder via Frontend zu updaten.
- Erlaubte Felder sind u. a. `full_name`, `avatar_url`.

## 9) Supabase Client: Env-Variablen prüfen
`src/lib/supabaseClient.js` ist korrekt. Stelle sicher:
- `.env` enthält `PUBLIC_SUPABASE_URL` und `PUBLIC_SUPABASE_ANON_KEY`.
- Keine Hardcodierung sensibler Keys in Code.

## 10) Seiten-Mapping und Implementierungshinweise
Die Referenz benennt Seiten wie folgt; stelle die jeweiligen Änderungen dort sicher:
- `material_page_id14` (Materials Overview):
  - Auth-Check; Daten via `supabase.from('materials').select('*')`; Fehler pattern; UI-Gating für Upload-Buttons.
- `material_content_page_16` (Material Detail):
  - Auth-Check; Einzelmaterial laden; Null-safe; Klassenbasierte Sicht beachten.
- `form_for_adding_content` (Material Upload):
  - Auth-Check; `has_editing_right()` prüfen; Insert/Update mit sauberer Fehlerbehandlung.
- `game_management` (Game):
  - Fragen-Lesen (Parents ausgeschlossen durch RLS); Missions-Progress Updates mit Self-Scope; Badge-Insert tolerant bei Duplikaten.
- `progress_page_id11` (Progress Page):
  - Eigenen Progress laden; Null-safe; ggf. Lehrer/Eltern lesen entsprechende Schüler/Kinder (serverseitig).
- `appointments_page_id8` (Appointments):
  - Feld `classid` überall verwenden; Auth/Role-Gating (`is_teacher()` oder `is_admin()` für Mutationen); Fehler pattern.
- `mission_management` (Missions Management):
  - Mutationen nur mit `has_editing_right()`; Lesen alle; Fehler pattern.

## 11) Optionale Tests (nach Änderungen)
- Materials: Student sieht nur eigene Klasse; Teacher nur unterrichtete Klassen; Parent nur Kinderklassen; Admin alles.
- Appointments: gleiche Klassenlogik; Insert/Update nur Teacher/Admin.
- Weekly Tests: `link_answere` korrekt verarbeitet.
- Badge-System: Duplikat-Insert erzeugt keinen kritischen Fehler.
- Missions Progress: Update/Insert für eigenen User funktioniert.

---

Diese Liste liefert die exakten, umsetzbaren Änderungen. Bei Bedarf kann ich die konkreten Codezeilen im Projekt referenzieren, sobald die Svelte-Seiten geöffnet sind, um die Anpassungen punktgenau einzuarbeiten.

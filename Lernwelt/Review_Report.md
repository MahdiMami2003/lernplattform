# Code Review Results - HSGG Lernwelt

Datum: 05.01.2026

## Aufgabenverständnis und Vorgehen
- Referenzdatei `AI_REVIEW_REFERENCE_V2_ACCURATE.md` vollständig gelesen und als maßgebliche Quelle genutzt.
- Keine Codeänderungen durchgeführt (nur Lesen/Analysieren).
- Analysierte Komponenten/Services:
  - Materials Overview, Material Detail, Material Upload, Game, Progress Page, Appointments, Missions Management
  - Services: `badgeService.js`, `dbHelpers.js`, `supabaseClient.js`
- RLS- und Triggervorgaben aus der Referenz gegen Client-Patterns überprüft.
- Abweichende Bezeichner (Tabellen-/Spalten-/Constraintnamen) dokumentiert.

## Kritische Dateien und Features
- Materials (Übersicht, Detail, Upload)
- Game (Fragen, Badge-Vergabe, Missions-Progress)
- Progress Page
- Appointments
- Missions Management
- Services: Badge-System, DB Helper, Supabase Client

## ❌ Kritische Probleme (sofort fixen!)
1. `dbHelpers.js` – Tabellenname „teacher_classes“ vs. Referenz „teacher_role“
   - Code: Mehrere Queries nutzen `from('teacher_classes')` und Felder `teacher_id`, `class_id`.
   - Warum kritisch: Laut Referenz existiert die Tabelle als `teacher_role` (mit Indizes `idx_teacher_role_*`). RLS-Policies filtern Materials/Termine/Weekly Tests über `teacher_role`. Wenn das Frontend auf `teacher_classes` zugreift, bricht Funktionalität (Lehrer sieht keine Klassen/Schüler; Material-/Terminfilterung über RLS nicht konsistent).
   - Fix (Konzeptuell): Einheitliche Nutzung des in der Datenbank vorhandenen Tabellennamens. Entweder Datenbank-Objekt-Name angleichen oder Frontend-Queries an `teacher_role` anpassen. Zusätzlich überall Feldnamen-Übereinstimmung prüfen.

2. Appointments-Feldname laut Referenz `classid` (nicht `class_id`)
   - Warum kritisch: Klassenbasierte RLS setzt auf `appointments.classid`. Falls Frontend (z. B. Upload oder Filter) `class_id` adressiert, entstehen leere Ergebnisse oder Insert-/Update-Fehler.
   - Fix (Konzeptuell): Sicherstellen, dass Frontend-Queries und UI-Modelle `classid` verwenden.

3. Weekly Tests: Feld- und Constraint-Anomalien
   - `link_answere` (Typo) und Constraint-Name mit Leerzeichen `"weekly tests_pkey"`.
   - Warum kritisch: Frontend muss explizit `link_answere` verwenden; versehentliches `link_answer` führt zu `null`/Fehlern. Das Constraint ist ungewöhnlich, aber funktional – nur beachten für Fehlermeldungen.
   - Fix (Konzeptuell): Frontend-Modelle strikt auf `link_answere` mappen; kein Umbennen ohne DB-Migration.

4. Badge-System muss Inserts erlauben (RLS)
   - `badgeService.js` führt `.insert({ user_id, badge_id })` auf `user_badges` korrekt aus.
   - Risiko: Fehlende explizite Behandlung des Unique-Constraints `unique_user_badge` kann als Fehler loggen und Nutzer verwirren.
   - Fix (Konzeptuell): Fehlerbehandlung gemäß Referenz-Pattern (bei duplicate Badge nicht crashen, nur ignorieren und weiterlaufen).

5. Missions Progress Updates müssen für eigenen User funktionieren
   - Risiko: Wenn `.eq('user_id', userId)` fehlt oder falscher Scope, blockt RLS.
   - Fix (Konzeptuell): Sicherstellen, dass Game-Update/Insert stets mit `user_id = auth.uid()` arbeitet und Fehler sauber behandelt.

## ⚠️ Warnings (sollten gefixt werden)
1. Fehlende explizite Error-Handling-Patterns in mehreren Komponenten anzunehmen
   - Referenz fordert überall `const { data, error } = ...` und Null-Safe Umgang mit `data || []`.
   - Empfehlung: Flächendeckend prüfen, dass jede DB-Operation mit Fehlerprüfung und Fallbacks versehen ist.

2. Auth-Checks in Seiten (onMount) und Redirects
   - Referenz fordert `supabase.auth.getUser()` vor Datenzugriffen.
   - Empfehlung: Sicherstellen, dass alle genannten Seiten (Materials*, Appointments, Game, Missions, Progress) bei fehlender Session redirecten.

3. Role-Check/UI-Gating auf Upload- und Management-Seiten
   - Referenz: Only `has_editing_right()` für Questions/Materials/Tips. Appointments/Weekly Tests: `is_admin()` ODER `is_teacher()`.
   - Empfehlung: UI-Buttons und Formulare nur mit Rollen-Check anzeigen; auf Server-Seiten prüfen.

4. Profile-Update Trigger-Schutz
   - Gefahr: Jegliche Client-Updates an `profiles` müssen nur erlaubte Felder ändern.
   - Empfehlung: Code-Basis nach Änderungen an `role`, `xp`, `level`, `editing_right`, `class_id` durchsuchen und entfernen.

5. Supabase Client – Umgebungsvariablen
   - `supabaseClient.js` nutzt `$env/static/public` Variablen. Prüfen, dass sie korrekt gesetzt sind und kein Key geleakt wird.

## ✅ Was gut läuft
- `supabaseClient.js` ist sauber initialisiert mit `persistSession` und `autoRefreshToken`.
- `badgeService.js` implementiert die Kern-Logik klar und nutzt die korrekte Tabelle `user_badges`.
- `dbHelpers.js` deckt essentielle Helfer ab: Klassen je Rolle, Schülerzugriff, Zuordnungen Parent/Kinder, Lehrer/Klassen, Schüler/Klasse. Strukturell stimmig mit den in der Referenz beschriebenen Beziehungen.

## RLS-Matrix und Erwartungskonformität (Abgleich)
- Materials: Klassenbasierte SELECT-Policies; nur `has_editing_right()` für Mutationen. Frontend muss keine manuelle Filterung durchführen – RLS übernimmt. Erwartung: Student sieht nur eigene Klasse plus `NULL`-Klassen.
- Appointments: Klassenbasierte SELECT; Mutationen nur Teacher/Admin; Feldname `classid` beachten.
- Weekly Tests: Klassenbasierte SELECT; Mutationen Teacher/Admin; Feldname `class_id` (hier ist es `class_id`, im Gegensatz zu Appointments), plus `link_answere`-Typo.
- Questions: Parents excluded; Mutationen nur mit `has_editing_right()`.
- Missions: Lesen für alle; Mutationen nur mit `has_editing_right()`.
- Missions_progress: Self-scope Insert/Update; Teachers/Parents/Admin lesen entsprechend. Game muss diese Pfade nutzen.
- User_badges: Self-scope Insert; Teachers/Parents/Admin lesen entsprechend.
- Profiles: Trigger `protect_profile_sensitive_fields()` blockt sensible Felder; nur Admin darf ändern.

## Festgestellte Namensabweichungen (potenzielle AI-Halluzinationen/Inkonsistenzen)
- Tabelle: Referenz nennt „`teacher_role`“, im Code werden Stellen mit „`teacher_classes`“ verwendet. Mismatch.
- Appointments Spalte: Referenz „`classid`“ (nicht `class_id`). Häufiger Implementationsfehler in Frontend angenommen.
- Weekly Tests:
  - Spalte: `link_answere` (Typo gegenüber `link_answer`).
  - Constraint: `"weekly tests_pkey"` mit Leerzeichen.
- Referenz nennt an Einzelstellen „class_materials“ und zugleich materials.class_id – beides vorhanden, aber Frontend muss konsistent sein.

## Prüf-Checkliste (Abdeckung)
- Materials Overview/Detail: Klassenbasierte Sicht und Null-safe Laden geprüft (konzeptionell). RLS deckt Filterung ab; UI sollte Fehlerfälle behandeln.
- Material Upload: Nur mit `has_editing_right()` zulässig; Empfehlung UI-Gating und Fehlerbehandlung.
- Game: Fragen-Lesen für Students/Teachers OK; Parents ausgeschlossen. Badge-Insert nach Game zulässig; Missions-Progress Update/Insert self-scope erforderlich.
- Progress Page: Zugriff gemäß RLS – eigener Progress; Teachers/Parents lesen ihrer Schüler/Kinder.
- Appointments: Klassenbasierte Sicht; Mutationen nur Admin/Teacher; Feldname `classid` beachten.
- Missions Management: Lesen alle; Mutationen nur `has_editing_right()`.
- Services:
  - Badge-System: Insert auf `user_badges` korrekt; Unique-Fehler nicht kritisch behandeln.
  - DB Helpers: Rollenpfade abgedeckt; Tabellenname-Mismatch kritisch.
  - Supabase Client: OK.

## Empfehlungen (konzeptionell, ohne Codeänderungen vorgenommen)
- Vereinheitlichung Tabellennamen: `teacher_role` vs. `teacher_classes`. Projektweit klären und angleichen.
- Strikte Beachtung der Feldnamen:
  - Appointments: `classid`.
  - Weekly Tests: `link_answere`.
- Fehlerbehandlung standardisieren: Immer `{ data, error }` prüfen; `data || []`; Nutzerfreundliche Meldungen.
- Auth-Gate in Seiten: Vor Datenzugriffen Session prüfen; Redirects auf Login.
- UI-Gating über Rollenrechte: Upload/Management nur für berechtigte Rollen; `has_editing_right()` konsistent nutzen.
- Profile-Updates: Nur erlaubte Felder ändern. Sensible Felder nie über Frontend anpassen.
- Badge-System: Duplicate-Insert bewusst ignorieren; Logging differenziert.

## Qualitätssicherung (Build/Lint/Test – konzeptionell)
- Lint/Typecheck/Build sollten regelmäßig laufen. Bei RLS-Fehlern werden Query-Errors sichtbar; Frontend muss robust darauf reagieren.
- Empfohlen: Kleine Smoke-Tests je Rolle (Student/Teacher/Parent/Admin) für Materials/Appointments/Weekly Tests/Questions/Missions Progress/User Badges.

## 📊 Zusammenfassung
- Kritische Probleme: 3 (Tabellenname-Mismatch `teacher_role`/`teacher_classes`; Appointments-Feldname; Weekly Tests Typo/Constraint-Besonderheiten)
- Warnings: 5 (Error-Handling, Auth-Checks, UI-Gating, Profile-Trigger-Schutz, Env-Handling)
- Datenbankzugriffe geprüft: Services und RLS-Referenz abgeglichen; Seiten konzeptionell bewertet.

## Anhang: Referenzkonformitäts-Notizen
- RLS-Policies sind so gestaltet, dass Frontend ohne manuelle Filterung arbeiten kann; aber falsche Spalten-/Tabellennamen führen zu leeren Daten oder Fehlern.
- Trigger verhindern Missbrauch; Frontend darf diese Felder nicht setzen.
- Storage Buckets (lehrmaterialien, avatars, weekly_tests) sind referenziert; Upload-Seiten sollten Rollenrechte beachten.


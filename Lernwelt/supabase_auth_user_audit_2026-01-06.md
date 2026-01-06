# Audit: Unsichere Nutzung von `session.user` aus `getSession()`/`onAuthStateChange()` (Supabase)

Datum: 2026-01-06

Warnhinweis (Terminal):
„Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.”

Ziel dieses Audits: Alle Stellen im Code identifizieren, die potentiell den unsicheren `user`-Wert aus `getSession()` oder direkt aus manchen `onAuthStateChange`-Ereignissen verwenden, und Abhilfe vorschlagen.

---

## Gefundene Vorkommen (mit Bewertung)

1) src/routes/+layout.js
- Muster: `const { data: { session } } = await supabase.auth.getSession()` (ca. Zeile 35–46)
- Nutzung: Session wird ins Layout zurückgegeben (`return { supabase, session: data.session ?? session }`).
- Bewertung: „user“ aus `getSession()` wird an Client-Komponenten weitergereicht. Alle nachfolgenden Verwendungen von `data.session.user` sollten kritisch geprüft werden.
- Empfehlung: Session im Layout belassen (für UI ok), aber in nachgelagerten Komponenten für sicherheitsrelevante Entscheidungen stets `await supabase.auth.getUser()` nutzen.

2) src/routes/+layout.svelte
- Muster: `supabase.auth.onAuthStateChange((event, _session) => { ... })` (ca. Zeile 16–23)
- Nutzung: Vergleich von `_session?.expires_at` mit `data.session?.expires_at`, anschließendes `invalidate('supabase:auth')`.
- Bewertung: Solange keine privilegierten Entscheidungen auf `_session.user` basieren, unkritisch. Jedoch vom Warnhinweis betroffen.
- Empfehlung: Bei Bedarf in diesem Callback `supabase.auth.getUser()` aufrufen, wenn User-Daten für Logik benötigt werden. Aktuell nur Invalidierung – ok, aber im Blick behalten.

3) src/routes/(all-others)/(account_level)/(student_account)/progress_page_id11/+page.svelte
- Muster: `const { data: { session } } = await supabase.auth.getSession();` (ca. Zeile 20–35)
- Nutzung: `if (!session) goto('/login_page_id2')`; anschließend `const myUserId = session.user.id;` für DB-Queries und Rollenlogik.
- Bewertung: Kritisch. Genau der Fall, den der Warnhinweis anspricht – Auth-Entscheidung (Weiterleitung) und Identität (`session.user.id`) basieren auf potentiell nicht authentifizierten Daten.
- Empfehlung (Fix):
  - Ersetze durch `const { data: { user } } = await supabase.auth.getUser()` und verwende `user?.id`.
  - Login-Redirect auf Basis von `!user` statt `!session`.

4) src/lib/templates/Header.svelte
- Muster: Breite Verwendung von `data.session.user.*` (z. B. um Rolle zu bestimmen und UI zu verzweigen). Beispiele:
  - `const role = data.session.user.user_metadata?.role;` (ca. Zeile 191)
  - Viele Stellen im Bereich Zeile ~289–316, ~437–462 (Rollen-/Namenanzeige).
- Bewertung: UI-Anzeige und Navigationslinks basieren auf `session.user`. Für reine Anzeige ist das weniger kritisch, aber der Warnhinweis trifft zu, wenn daraus Berechtigungen abgeleitet werden.
- Empfehlung: Rolle/Identität – sofern für privilegierte Pfade/Buttons relevant – per `getUser()` (Client) oder bereits serverseitig abgesichert bereitstellen. Optional eine zentrale User-Store-Initialisierung via `getUser()` im Layout, statt sich auf `session` zu stützen.

5) src/routes/+layout.server.js
- Muster: `session: await getSession()`
- Bewertung: Serverseitig. Der Warnhinweis bezieht sich primär auf die Authentizität des User-Objekts aus Storage/Cookies. Für serverseitige Guard-Logik empfiehlt Supabase oft `getUser()` (Netzwerk-Call). `getSession()` ist üblich, aber wenn daraus sicherheitskritische Entscheidungen folgen, sollte man zusätzlich `getUser()` ziehen oder Daten via RLS absichern.
- Empfehlung: In sicherheitskritischen Guards lieber `getUser()` nutzen oder serverseitig minimal auf Session vertrauen und DB/RLS die Autorisierung überlassen.

6) src/hooks.server.js
- Muster: `event.locals.supabase.auth.getSession()` in `event.locals.getSession` (ca. Zeile 18–21)
- Bewertung: Serverseitiger Helper. Wie bei (5) – ok für Session-Sync, aber kritisch, wenn daraus „echte“ Auth-Entscheidungen entstehen.
- Empfehlung: Ergänzende Helper `getUser()` erwägen, wenn Auth-verifizierte Userdaten benötigt werden.

7) src/routes/(all-others)/(account_level)/(student_account)/+layout.server.js
- Muster: Verwendung von `session.user.id` (Zeile ca. 10–19) nach `const session = await locals.getSession();`
- Nutzung: Rollen-Check und Redirects
- Bewertung: Serverseitig, aber sicherheitskritische Redirects basieren mittelbar auf `getSession()`. Besser `locals.supabase.auth.getUser()` verwenden oder RLS-/DB-basierte Checks nutzen.
- Empfehlung: In diesem Guard `const { data: { user } } = await locals.supabase.auth.getUser()` und `user.id` nutzen; bei Mismatch/Fehler redirecten.

---

## Nicht betroffene/neutralere Vorkommen (zur Vollständigkeit)

- src/routes/+layout.js – Session-Ermittlung als Fallback für SSR: ok, solange Folge-Logik nicht auf `session.user` vertraut.
- src/routes/+layout.svelte – `onAuthStateChange` nur zur Invalidation verwendet, kein direkter User-Trust.

---

## Priorisierung (Fix zuerst hier)

1. progress_page_id11/+page.svelte (Client): ersetzt `getSession()` → `getUser()` und nutze `user.id` statt `session.user.id` für DB-Abfragen und Redirects.
2. student_account/+layout.server.js (Server-Guard): ergänze `getUser()`-Check oder nutze DB/RLS, um Berechtigungen zu erzwingen; vermeide alleinigen Trust in `getSession()`.
3. Header.svelte (Client): Für reine Anzeige ok; falls Buttons/Navigation mit Berechtigungen verknüpft sind, beziehe Rolle via `getUser()` oder aus serverseitig verifizierten Daten.

---

## Beispiel-Fix (Client)

- Vorher:
  - `const { data: { session } } = await supabase.auth.getSession();`
  - `const userId = session?.user?.id;`
- Nachher:
  - `const { data: { user } } = await supabase.auth.getUser();`
  - `const userId = user?.id;`

## Beispiel-Fix (Server)

- Vorher:
  - `const session = await locals.getSession();`
  - `const userId = session?.user?.id;`
- Nachher:
  - `const { data: { user } } = await locals.supabase.auth.getUser();`
  - `const userId = user?.id;`

---

## Hinweise
- `getUser()` validiert die Authentizität über einen Call an den Supabase Auth Server; `getSession()` liefert u. U. lediglich den Cookie-Inhalt zurück.
- Für sicherheitskritische Checks (Redirects, Rollen-Entscheidungen, Eigentumsprüfungen) deshalb `getUser()` verwenden.
- Wo möglich, Autorisierungen in die Datenbank (RLS-Policies) verlagern und im Frontend nur präsentieren.


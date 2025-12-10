<script>
    import { onMount } from 'svelte';

    let { data } = $props();
    let { supabase, session } = data;

    let role = $state(null);
    let userId = $state(null);

    // "classes" enthält ALLE Klassen der Schule (für die Auswahl oben)
    let classes = $state([]);

    // "myClassIds" speichert nur die IDs der Klassen, die ich ausgewählt habe
    let myClassIds = $state([]);

    onMount(async () => {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData?.user) {
            console.error('Fehler beim Holen des Users:', error);
            return;
        }

        userId = userData.user.id;

        // 1. Profil & Rolle laden
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Fehler beim Holen des Profils:', profileError);
        } else {
            role = profile.role;
        }

        // 2. ALLE Klassen laden (für die Auswahl-Liste)
        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('*')
            .order('name', { ascending: true });

        if (classesError) {
            console.error('Fehler beim Laden der Klassen:', classesError);
        } else {
            classes = classesData || [];
        }

        // 3. MEINE Klassen laden (aus teacher_role Tabelle)
        // Wir wollen wissen: Welche Klassen hat dieser Lehrer schon ausgewählt?
        const { data: myRoles, error: rolesError } = await supabase
            .from('teacher_role')
            .select('class_id')
            .eq('teacher_id', userId);

        if (!rolesError && myRoles) {
            // Wir wandeln das Ergebnis in eine simple Liste von IDs um: [1, 5, 8]
            myClassIds = myRoles.map(r => r.class_id);
        }
    });

    // Funktion: Klasse hinzufügen oder entfernen
    async function toggleClass(classId) {
        // Prüfen: Bin ich schon drin?
        const isJoined = myClassIds.includes(classId);

        if (isJoined) {
            // AUSTRETEN (Löschen aus teacher_role)
            const { error } = await supabase
                .from('teacher_role')
                .delete()
                .eq('teacher_id', userId)
                .eq('class_id', classId);

            if (!error) {
                // UI sofort aktualisieren (ID entfernen)
                myClassIds = myClassIds.filter(id => id !== classId);
            }
        } else {
            // BEITRETEN (Einfügen in teacher_role)
            const { error } = await supabase
                .from('teacher_role')
                .insert({
                    teacher_id: userId,
                    class_id: classId
                });

            if (!error) {
                // UI sofort aktualisieren (ID hinzufügen)
                myClassIds = [...myClassIds, classId];
            } else {
                console.error("Fehler beim Speichern:", error);
            }
        }
    }
</script>

<div id="placeholder">
    <h1 class="überschrift">Lehrpersonen-Dashboard</h1>
    <p class="untertitel">
        Hier sehen Sie Ihre Klassen, Fächer und können Lernmaterialien bearbeiten
    </p>

    <div class="tipps">
        <h2>Pädagogische Tipps</h2>
        <div class="tipps-grid">
            <p>
                Lernstrategien zur Unterstützung Ihrer Schüler
                <a href="/pedagogy_page_id10"><button class="small-btn">Tipps bearbeiten</button></a>
            </p>
        </div>
    </div>

    <div class="general-section">
        <h2>Allgemeine Verwaltung</h2>
        <div class="general-grid">
            <div class="card">
                <h3>🎮 Minispiele</h3>
                <p>Fragen für die Minispiele erstellen und bearbeiten.</p>
                <a href="/game_management"><button class="small-btn">Fragen verwalten</button></a>
            </div>
        </div>
    </div>

    <section class="class-manager-section">
        <h2>🏫 Meine Klassen verwalten</h2>
        <p class="hint-text">Klicken Sie auf die Klassen, die Sie unterrichten, um sie unten anzuzeigen.</p>

        <div class="manager-tags">
            {#each classes as schoolClass}
                {@const isActive = myClassIds.includes(schoolClass.id)}
                <button
                        class="class-select-btn {isActive ? 'active' : ''}"
                        onclick={() => toggleClass(schoolClass.id)}
                >
                    {schoolClass.name}
                    {#if isActive}<span>✓</span>{:else}<span>+</span>{/if}
                </button>
            {/each}
        </div>
    </section>

    <section class="classes-section">
        <h2>Ihre Klassen Übersicht</h2>

        {#if myClassIds.length === 0}
            <div class="empty-hint">
                <p>Sie haben noch keine Klassen ausgewählt. Bitte klicken Sie oben auf Ihre Klassen.</p>
            </div>
        {:else}
            <div class="class-grid">
                {#each classes.filter(c => myClassIds.includes(c.id)) as schoolClass}
                    <article class="class-card">
                        <h3>{schoolClass.name}</h3>
                        <div class="class-actions">
                            <p>📌Lernfortschritt der Klasse einsehen</p>
                            <a href={'/class_page_id9/' + schoolClass.id}
                            ><button class="small-btn">Lernstand ansehen</button></a
                            >
                            <p>📚Unterrichtsmaterial bearbeiten</p>
                            <a href={'/material_page_id14?classId=' + schoolClass.id}
                            ><button class="small-btn">Materialien verwalten</button></a
                            >
                            <p>📅Termine und Aktuelles bearbeiten</p>
                            <a href={'/create_appointments_page?classId=' + schoolClass.id}
                            ><button class="small-btn">Termine bearbeiten</button></a
                            >
                            <p>📝Wochentests und spielerische Fragen bearbeiten</p>
                            <a href={'/form_for_adding_weekly_test?classId=' + schoolClass.id}
                            ><button class="small-btn">Wochentests bearbeiten</button></a
                            >
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </section>

    {#if role === 'admin'}
        <div class="admin-panel" id="adminPanel">
            <h2>Admin-Verwaltung</h2>
            <p>Hier können Sie Nutzer, Klassen und Berechtigungen verwalten.</p>
            <button class="admin-btn">Benutzer verwalten</button>
            <button class="admin-btn">Klassen verwalten</button>
            <button class="admin-btn">Berechtigungen bearbeiten</button>
        </div>
    {/if}
</div>

<style>
    /* ---- NEUE STYLES FÜR DEN MANAGER ---- */
    .class-manager-section {
        margin-top: 2rem;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 1.2rem;
        padding: 1.5rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .hint-text { margin-bottom: 1rem; color: #666; font-style: italic; }

    .manager-tags { display: flex; flex-wrap: wrap; gap: 0.8rem; }

    .class-select-btn {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        border: 2px solid #ddd;
        background: white;
        font-weight: 600;
        cursor: pointer;
        display: flex; align-items: center; gap: 0.5rem;
        transition: all 0.2s;
        font-size: 0.9rem;
    }
    .class-select-btn:hover { background: #f0f0f0; border-color: #ccc; }

    /* Wenn ausgewählt (Aktiv) */
    .class-select-btn.active {
        background-color: #236c93; /* Dein Blau-Ton */
        color: white;
        border-color: #236c93;
    }
    .class-select-btn.active:hover { background-color: #1a5070; }

    .empty-hint {
        text-align: center; padding: 2rem; background: #f9f9f9;
        border-radius: 12px; border: 2px dashed #ddd; color: #777;
    }


    /* ---- DEINE BESTEHENDEN STYLES ---- */
    .class-link {
        text-decoration: none;
        color: inherit;
        transition: color 0.2s;
    }
    .class-link:hover {
        color: #d89c48;
        text-decoration: underline;
    }
    /* ---- Grundlayout ---- */
    #placeholder {
        min-height: 100vh;
        font-family: 'Inter', Arial, Helvetica, sans-serif;
        padding-bottom: 2rem;
        max-width: 1200px; /* Begrenzt Breite */
        margin: 0 auto;
        padding: 1rem;
    }

    /* ---- Titel ---- */
    .überschrift {
        display: flex;
        justify-content: center;
        font-size: clamp(1.8rem, 4vw, 3rem);
        font-weight: 700;
        text-align: center;
    }

    .untertitel {
        display: flex;
        justify-content: center;
        font-size: clamp(1rem, 2vw, 1.4rem);
        margin-top: clamp(0.5rem, 2vw, 2rem);
        color: #444;
        text-align: center;
    }

    /* ---- Tipps ---- */
    .tipps-grid {
        background-color: #fbead7;
        border-radius: 1.2rem;
        border: 1px solid #ffeed8;
        padding: 1rem 1.2rem;
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
    }

    /* ---- Allgemeine Verwaltung ---- */
    .general-section {
        margin-top: 2rem;
    }
    .general-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
    .card {
        background-color: #e3f2fd;
        border: 1px solid #bbdefb;
        border-radius: 1.2rem;
        padding: 1.2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }
    .card h3 {
        margin-top: 0;
        color: #1565c0;
    }

    /* ---- Klassenübersicht ---- */
    .classes-section { margin-top: 2rem; }

    .class-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .class-card {
        background-color: #fbead7;
        border-radius: 1.2rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid #ffeed8;
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        transition:
                transform 0.15s ease,
                box-shadow 0.15s ease;
    }

    .class-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(15, 41, 64, 0.18);
    }

    .class-card ul {
        margin: 0;
        padding-left: 1rem;
    }

    .class-card li {
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* ---- Buttons klein ---- */
    .small-btn {
        padding: 0.35rem 0.9rem;
        background-color: #f4d4b3;
        font-size: clamp(0.75rem, 1.5vw, 0.9rem);
        border: 1px solid #f3b06a;
        color: #000;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 600;
        transition:
                background 0.2s,
                transform 0.15s;
    }

    .small-btn:hover {
        background-color: #efc48b;
        transform: translateY(-1px);
    }

    /* ---- Admin Panel ---- */
    .admin-panel {
        margin-top: 3rem;
        padding: 1.8rem;
        background-color: #f3be6a;
        border: 2px solid #d8b16c;
        border-radius: 1.2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        max-width: 700px;
    }

    .admin-btn {
        margin: 0.5rem 0.5rem 0 0;
        padding: 0.65rem 1.3rem;
        background-color: #f3e7d9;
        border: 1px solid #e2d2c0;
        color: #000;
        font-weight: 600;
        border-radius: 999px;
        cursor: pointer;
        transition:
                background 0.2s,
                transform 0.15s;
    }

    .admin-btn:hover {
        background-color: #ecdac4;
        transform: translateY(-2px);
    }

    /* ---- Reset ---- */
    div {
        margin: 0;
    }
</style>
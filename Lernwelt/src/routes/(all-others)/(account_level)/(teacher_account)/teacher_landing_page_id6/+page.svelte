<!--Lernwelt/src/routes/(all-others)/(account_level)/(teacher_account)/teacher_landing_page_id6/+page.svelte-->
<script>
    import { onMount } from 'svelte';
    import { _ } from '$lib/i18n/config';
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
    let edit_content = $state("");
</script>

<div id="placeholder" class="main_container">
    <h1 class="überschrift">{$_('teacher.title')}</h1>
    <p class="untertitel">
        {$_('teacher.subtitle')}
    </p>
    {#if role === 'admin'}
        <p style="text-align:center; margin-top: 0.5rem;">
            <a href="/admin_landing_page" class="class-link">🛡️ Zum Admin-Dashboard</a>
        </p>
    {/if}
    <!-- ============ OVERVIEW ============ -->
    <div class="overview">
        <h2>{$_('teacher.pedagogical_tips')}</h2>
        <div class="card">
            <div class="manager-tags">
                <p>
                    <a href="/weekly_test_page_id17"><button class="small-btn">📝 {$_('teacher.nametag_weekly')}</button></a>
                </p>
                <p>
                    <a href="/material_page_id14"><button class="small-btn">📖 {$_('teacher.nametag_materials')}</button></a>
                </p>
                <p>
                    <a href="/pedagogy_page_id10"><button class="small-btn">🗣 {$_('teacher.nametag_tips')}</button></a>
                </p>
                <p>
                    <a href="/appointments_page_id8"><button class="small-btn">📅 {$_('teacher.nametag_appointments')}</button></a>
                </p>
            </div>
        </div>
    </div>
    <!-- ============ ADD CONTENT ============ -->
    <div class="general-section">
        <h2>{$_('teacher.general_admin')}</h2>
        <div class="general-grid">
            <div class="card">
                <h3>🖋️ {$_('teacher.content_creation')}</h3>
                <form action={edit_content}>
                    <label for="content">Ich möchte eine:n </label>
                    <select id="content" bind:value={edit_content}>
                        <option value="/game_management"> Spielfrage </option>
                        <option value="/form_for_adding_content"> Lerninhalt </option>
                        <option value="/form_for_adding_weekly_test"> Wochentest </option>
                        <option value="/create_appointments_page"> Termin </option>
                        <option value="/pedagogic_form"> pädagogischen Tipp </option>
                    </select>
                    <button class="small-btn" type="submit">erstellen</button>
                </form>
            </div>
        </div>
    </div>

    <section class="class-manager-section">
        <h2>🏫 {$_('teacher.manage_classes')}</h2>
        <p class="hint-text">{$_('teacher.manage_classes_hint')}</p>

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
        <h2>{$_('teacher.class_overview')}</h2>

        {#if myClassIds.length === 0}
            <div class="empty-hint">
                <p>{$_('teacher.no_classes_selected')}</p>
            </div>
        {:else}
            <div class="class-grid">
                {#each classes.filter(c => myClassIds.includes(c.id)) as schoolClass}
                    <article class="class-card">
                        <h3>{schoolClass.name}</h3>
                        <div class="class-actions">
                            <p>📌 {$_('teacher.view_progress')}</p>
                            <a href={'/class_page_id9/' + schoolClass.id}
                            ><button class="small-btn">{$_('teacher.view_level')}</button></a
                            >
                            <p>📚 {$_('teacher.edit_materials')}</p>
                            <a href={'/form_for_adding_content?classId=' + schoolClass.id}
                            ><button class="small-btn">{$_('teacher.manage_materials')}</button></a
                            >
                            <p>📅 {$_('teacher.edit_appointments')}</p>
                            <a href={'/create_appointments_page?classId=' + schoolClass.id}
                            ><button class="small-btn">{$_('teacher.manage_appointments')}</button></a
                            >
                            <p>📝 {$_('teacher.edit_tests')}</p>
                            <a href={'/form_for_adding_weekly_test?classId=' + schoolClass.id}
                            ><button class="small-btn">{$_('teacher.manage_tests')}</button></a
                            >
                        </div>
                    </article>
                {/each}
            </div>
        {/if}
    </section>


</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #placeholder {
        min-height: 100vh;
        font-family: 'Inter', Arial, Helvetica, sans-serif;
        padding-bottom: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ TYPOGRAPHY ============ */
    .überschrift {
        display: flex;
        justify-content: center;
        font-size: clamp(1.8rem, 4vw, 3rem);
        font-weight: 700;
        text-align: center;
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    .untertitel {
        display: flex;
        justify-content: center;
        font-size: clamp(1rem, 2vw, 1.4rem);
        margin-top: clamp(0.5rem, 2vw, 2rem);
        color: var(--text-secondary);
        text-align: center;
        transition: color 0.3s ease;
    }

    h2 {
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    h3 {
        color: var(--text-primary);
        margin-top: 0;
        transition: color 0.3s ease;
    }

    p {
        color: var(--text-secondary);
        transition: color 0.3s ease;
    }

    /* ============ TIPPS SECTION ============ */
    .overview-grid {
        background-color: var(--bg-card);
        border-radius: 1.2rem;
        border: 1px solid var(--border-color);
        padding: 1rem 1.2rem;
        display: inline-flex;
        gap: 1rem;
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        transition: all 0.3s ease;
    }

    /* ============ GENERAL SECTION ============ */
    .general-section {
        margin-top: 2rem;
    }

    .general-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 1.2rem;
        padding: 1.2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
    }

    .card:hover {
        background-color: var(--bg-hover);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
    }

    /* ============ CLASS MANAGER SECTION ============ */
    .class-manager-section {
        margin-top: 2rem;
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 1.2rem;
        padding: 1.5rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }

    .class-manager-section:hover {
        background-color: var(--bg-hover);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
    }

    .hint-text {
        margin-bottom: 1rem;
        color: var(--text-muted);
        font-style: italic;
        transition: color 0.3s ease;
    }

    .manager-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
    }

    .class-select-btn {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        border: 2px solid var(--border-color);
        background: var(--bg-card);
        color: var(--text-primary);
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
        font-size: 0.9rem;
        min-height: 44px;
    }

    .class-select-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-accent);
    }

    .class-select-btn:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
    }

    /* Wenn ausgewählt (Aktiv) */
    .class-select-btn.active {
        background-color: var(--button-bg);
        color: var(--text-primary);
        border-color: var(--button-bg);
    }

    .class-select-btn.active:hover {
        background-color: var(--button-hover);
    }

    /* ============ EMPTY HINT ============ */
    .empty-hint {
        text-align: center;
        padding: 2rem;
        background: var(--bg-card);
        border-radius: 12px;
        border: 2px dashed var(--border-color);
        color: var(--text-muted);
        transition: all 0.3s ease;
    }

    /* ============ CLASSES SECTION ============ */
    .classes-section {
        margin-top: 2rem;
    }

    .class-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .class-card {
        background-color: var(--bg-card);
        border-radius: 1.2rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        transition: all 0.3s ease;
    }

    .class-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
        background-color: var(--bg-hover);
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

    /* ============ BUTTONS ============ */
    .small-btn {
        padding: 0.35rem 0.9rem;
        background-color: var(--button-bg);
        font-size: clamp(0.75rem, 1.5vw, 0.9rem);
        border: 1px solid var(--button-border);
        color: var(--text-primary);
        border-radius: 999px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        min-height: 44px;
    }

    .small-btn:hover {
        background-color: var(--button-hover);
        transform: translateY(-1px);
    }

    .small-btn:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ ADMIN PANEL ============ */
    .admin-panel {
        margin-top: 3rem;
        padding: 1.8rem;
        background-color: var(--bg-card);
        border: 2px solid var(--border-accent);
        border-radius: 1.2rem;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        max-width: 700px;
        transition: all 0.3s ease;
    }

    .admin-btn {
        margin: 0.5rem 0.5rem 0 0;
        padding: 0.65rem 1.3rem;
        background-color: var(--button-bg);
        border: 1px solid var(--button-border);
        color: var(--text-primary);
        font-weight: 600;
        border-radius: 999px;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 44px;
    }

    .admin-btn:hover {
        background-color: var(--button-hover);
        transform: translateY(-2px);
    }

    .admin-btn:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ LINKS ============ */
    .class-link {
        text-decoration: none;
        color: var(--text-primary);
        transition: color 0.2s;
    }

    .class-link:hover {
        color: var(--button-hover);
        text-decoration: underline;
    }

    a {
        color: var(--button-bg);
        transition: color 0.2s;
    }

    a:hover {
        color: var(--button-hover);
    }

    /* ============ RESET ============ */
    div {
        margin: 0;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        #placeholder {
            padding: 0.5rem;
        }

        .class-grid {
            grid-template-columns: 1fr;
        }

        .general-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
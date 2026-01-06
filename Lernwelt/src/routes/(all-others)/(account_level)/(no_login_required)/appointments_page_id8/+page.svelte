<!--Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/appointments_page_id8/+page.svelte-->
<script>
    import { onMount } from 'svelte';
    import { locale, _ } from '$lib/i18n/config';
    import { getUserClasses } from '$lib/dbHelpers.js';
    let { data } = $props();

    let { supabase, session } = data;

    let userRole = $state(null);
    let editingRight = $state(null);
    /** @type {{ id: number; name: string; grade_level?: number|null }[]} */
    let availableClasses = $state([]);
    /** @type {'all' | string} */
    let selectedClassStr = $state('all');

    onMount(async () => {
        // Hole den eingeloggten User
        const { data: userData, error } = await supabase.auth.getUser();

        if (error || !userData?.user) {
            console.error("Fehler beim Holen des Users:", error);
            return;
        }

        // Hole Profil aus DB (mit editing_right)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, editing_right')
            .eq('id', userData.user.id)
            .single();

        if (profileError) {
            console.error("Fehler beim Holen des Profils:", profileError);
            return;
        } else {
            console.log("Gefundenes Profil:", profile);
            userRole = profile.role;
            editingRight = profile.editing_right;
            console.log("User Role:", userRole, "Editing Right:", editingRight);
        }

        try {
            const url = new URL(window.location.href);
            const cid = url.searchParams.get('classId');
            selectedClassStr = cid ? String(cid) : 'all';
        } catch (e) {
            selectedClassStr = 'all';
        }

        // Klassen für Filter laden (falls eingeloggt)
        try {
            const { data: userData2 } = await supabase.auth.getUser();
            const userId2 = userData2?.user?.id;
            if (userId2) {
                // Rolle wurde oben bereits geladen in userRole
                let classes = [];
                if (userRole === 'admin') {
                    const { data: allClasses } = await supabase
                        .from('classes')
                        .select('id, name, grade_level')
                        .order('grade_level', { ascending: true })
                        .order('name', { ascending: true });
                    classes = allClasses || [];
                } else {
                    classes = await getUserClasses(supabase, userId2, userRole || 'student');
                }
                availableClasses = Array.isArray(classes) ? classes : [];
            }
        } catch (e) {
            availableClasses = [];
        }
    });

    /** @type {Promise<any[]>} */
    let appointmentsPromise = $state(Promise.resolve([]));

    $effect(() => {
        // Trigger neu, wenn der Filter sich ändert
        void selectedClassStr;
        appointmentsPromise = getAppointments();
    });

    async function getAppointments() {
        let query = supabase
            .from('appointments')
            .select('*')
            .order('event_date', { ascending: true });
        // Filter per Dropdown-Auswahl
        if (selectedClassStr !== 'all') {
            const num = Number(selectedClassStr);
            if (!Number.isNaN(num)) {
                // Zeige sowohl Termine für die ausgewählte Klasse als auch global/unzugeordnete (classid IS NULL)
                query = query.or(`classid.is.null,classid.eq.${num}`);
            }
        }
        const { data, error } = await query;
        if (error) {
            console.error('Fehler:', error);
            return [];
        }
        return data || [];
    }

    /**
     * @param {number} id
     */
    async function deleteAppointment(id) {
        if (!confirm('Wirklich löschen?')) return;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Fehler beim Löschen!');
            console.error(error);
        } else {
            window.location.reload();
        }
    }

    /**
     * @param {string} dateString
     */
    function formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' Uhr';
    }

    /**
     * Prüft ob User Bearbeitungsrechte hat
     */
    function hasEditingRights() {
        return (userRole === 'admin' || userRole === 'teacher') && editingRight === true;
    }

    function getTitle(/** @type {{ title_en?: string; title?: string }} */ item) {
        return $locale === 'en'
            ? item.title_en || item.title
            : item.title;
    }

    function getContent(/** @type {{ content_en?: string; content?: string }} */ item) {
        return $locale === 'en'
            ? item.content_en || item.content
            : item.content;
    }

    /** @param {{ classid?: number|null }} item */
    function getClassLabel(item) {
        return item.classid ? `Klasse ${item.classid}` : 'Allgemein';
    }
</script>

<div id="placeholder" class="main_container">
    <div class="back-bar">
        <button class="back-btn" onclick={() => history.back()} aria-label="Zurück">← Zurück</button>
    </div>

    <div class="header">
        <h1>{$_('appointment.title')}</h1>
        {#if hasEditingRights()}
            <a href="/create_appointments_page" class="add-button">➕ {$_('appointment.add')}</a>
        {/if}
    </div>

    <!-- Klassen-Filter -->
    <div class="filter-row">
        <label for="classFilter">Filtern nach Klasse:</label>
        <select id="classFilter" bind:value={selectedClassStr}>
            <option value="all">Alle Klassen</option>
            {#each availableClasses as c}
                <option value={String(c.id)}>{c.name}{c.grade_level ? ` (Klasse ${c.grade_level})` : ''}</option>
            {/each}
        </select>
        {#if selectedClassStr !== 'all'}
            <span class="current-filter">Angezeigt: Klasse {selectedClassStr} + Allgemein</span>
        {:else}
            <span class="current-filter">Angezeigt: Alle Klassen</span>
        {/if}
    </div>

    {#await appointmentsPromise}
        <p class="loading">{$_('appointment.loading')}</p>
    {:then appointments}
        {#if appointments && appointments.length > 0}
            <div class="appointments-list">
                {#each appointments as appointment}
                    <div class="appointment-card">
                        <div class="card-header">
                            <div class="header-content">
                                <h2>{getTitle(appointment)}</h2>
                                <span class="date-badge">{formatDateTime(appointment.event_date)}</span>
                            </div>
                            {#if hasEditingRights()}
                                <button class="delete-btn" onclick={() => deleteAppointment(appointment.id)}>
                                    🗑️ Löschen
                                </button>
                            {/if}
                        </div>
                        <div class="card-body">
                            <p>{getContent(appointment) || '-'}</p>
                            <span class="class-badge" title="Zugeordnete Klasse">{getClassLabel(appointment)}</span>
                        </div>
                    </div>
                {/each}
            </div>

        {:else}
            <p class="empty-message">{$_('appointment.empty')}</p>
        {/if}
    {:catch error}
        <p class="error-message">Fehler beim Laden</p>
    {/await}
</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #placeholder {
        margin: 0;
        padding: 20px;
        min-height: 100vh;
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ BACK BAR ============ */
    .back-bar {
        padding: 0.5rem 0;
    }

    .back-btn {
        background: none;
        border: 1px solid var(--button-border);
        color: var(--text-secondary);
        padding: 0.35rem 0.6rem;
        border-radius: 8px;
        cursor: pointer;
    }

    .back-btn:hover {
        color: var(--text-primary);
        border-color: var(--button-hover);
    }

    /* ============ HEADER ============ */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 1rem;
    }

    h1 {
        color: var(--text-primary);
        margin: 0;
        font-size: 2rem;
        transition: color 0.3s ease;
    }

    .add-button {
        background: var(--button-bg);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s ease;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--button-border);
    }

    .add-button:hover {
        background: var(--button-hover);
        transform: translateY(-2px);
    }

    .add-button:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ FILTER ROW ============ */
    .filter-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .filter-row label {
        font-weight: 600;
    }

    .filter-row select {
        padding: 0.4rem 0.6rem;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        color: var(--text-primary);
    }

    .current-filter {
        color: var(--text-secondary, var(--text-primary));
        font-size: 0.95rem;
        margin-left: 0.5rem;
    }

    /* ============ APPOINTMENTS LIST ============ */
    .appointments-list {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .appointment-card {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .appointment-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }

    /* ============ CARD HEADER ============ */
    .card-header {
        background: var(--border-accent);
        color: var(--text-primary);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.3s ease;
    }

    .header-content {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    h2 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    .date-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: 500;
        white-space: nowrap;
        backdrop-filter: blur(10px);
    }

    .class-badge {
        display: inline-block;
        margin-top: 0.5rem;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        font-size: 0.85rem;
        white-space: nowrap;
    }

    /* ============ DELETE BUTTON ============ */
    .delete-btn {
        padding: 8px 14px;
        background: var(--delete-btn);
        color: white;
        border: 1px solid transparent;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: 15px;
        min-height: 44px;
        min-width: 44px;
    }

    .delete-btn:hover {
        background: var(--delete-hover);
        transform: translateY(-2px);
    }

    .delete-btn:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    /* ============ CARD BODY ============ */
    .card-body {
        background: var(--bg-card);
        padding: 20px;
        border: 1px solid var(--border-color);
        border-top: none;
        transition: background-color 0.3s ease;
    }

    .card-body p {
        margin: 0;
        color: var(--text-primary);
        line-height: 1.6;
        transition: color 0.3s ease;
    }


    /* ============ MESSAGES ============ */
    .loading,
    .empty-message {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 40px;
        transition: color 0.3s ease;
    }

    .error-message {
        color: var(--error-color);
        text-align: center;
        padding: 40px;
        transition: color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        #placeholder {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
        }

        .add-button {
            text-align: center;
            justify-content: center;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }

        .card-header {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
        }

        .delete-btn {
            margin-left: 0;
            width: 100%;
        }

        .date-badge {
            align-self: flex-start;
        }

        h1 {
            font-size: 1.5rem;
        }

        h2 {
            font-size: 1.1rem;
        }
    }
</style>
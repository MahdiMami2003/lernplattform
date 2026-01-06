<!--Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/create_appointments_page/+page.svelte-->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getUserClasses } from '$lib/dbHelpers.js';

    let { data } = $props();

    let { supabase, session } = data;

    let title = $state('');
    let content = $state('');
    let eventDate = $state('');
    let eventTime = $state('');
    let uploading = $state(false);
    let message = $state('');
    /** @type {{ id: number; name: string; grade_level?: number|null }[]} */
    let availableClasses = $state([]);
    /** @type {string[]} */
    let classIdStrs = $state([]);

    /** @type {boolean} */
    let modalOpen = $state(false);
    /** @type {string[]} */
    let modalSelectedStrs = $state([]);

    // Hole classId aus Query-String, und lade verfügbare Klassen
    onMount(async () => {
        try {
            const url = new URL(window.location.href);
            const cid = url.searchParams.get('classId');
            classIdStrs = cid ? [String(cid)] : [];
        } catch (e) {
            classIdStrs = [];
        }
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (userId) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();
                const role = profile?.role || 'teacher';
                const classes = await getUserClasses(supabase, userId, role);
                availableClasses = Array.isArray(classes) ? classes : [];
            }
        } catch (e) {
            console.error('Klassen konnten nicht geladen werden:', e);
            availableClasses = [];
        }
    });

    /** @param {SubmitEvent} event */
    async function handleSubmit(event) {
        try {
            event?.preventDefault?.();
            uploading = true;
            message = '';

            // Validierung
            if (!title || !content || !eventDate || !eventTime) {
                message = 'Bitte fülle alle Pflichtfelder aus!';
                uploading = false;
                return;
            }

            // Mindestens eine Klasse wählen
            const classIds = classIdStrs.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
            if (classIds.length === 0) {
                message = 'Bitte mindestens eine Klasse wählen!';
                uploading = false;
                return;
            }

            // Kombiniere Datum und Uhrzeit
            const fullDateTime = `${eventDate}T${eventTime}:00`;

            // Bulk-Insert: je Klasse ein Termin
            const rows = classIds.map((cid) => ({
                title: title,
                content: content,
                event_date: fullDateTime,
                classid: cid
            }));

            const { error: insertError } = await supabase
                .from('appointments')
                .insert(rows);

            if (insertError) {
                message = '❌ Fehler: ' + String(insertError.message || insertError);
                uploading = false;
                return;
            }

            message = `✅ Termin(e) für ${classIds.length} Klasse(n) erfolgreich hinzugefügt!`;

            // Sofortige Weiterleitung zur Übersicht
            goto('/appointments_page_id8');

        } catch (error) {
            console.error('Fehler:', error);
            message = '❌ Fehler: ' + String((/** @type {any} */(error))?.message || error);
        } finally {
            uploading = false;
        }
    }

    function openClassModal() {
        modalSelectedStrs = [...classIdStrs];
        modalOpen = true;
    }
    function closeClassModal() {
        modalOpen = false;
    }
    /** @param {string} idStr */
    function toggleClassChecked(idStr) {
        if (modalSelectedStrs.includes(idStr)) {
            modalSelectedStrs = modalSelectedStrs.filter((v) => v !== idStr);
        } else {
            modalSelectedStrs = [...modalSelectedStrs, idStr];
        }
    }
    function selectAllClasses() {
        modalSelectedStrs = availableClasses.map((c) => String(c.id));
    }
    function clearAllClasses() {
        modalSelectedStrs = [];
    }
    function applyClassSelection() {
        classIdStrs = [...modalSelectedStrs];
        modalOpen = false;
    }

    /** @param {KeyboardEvent} e */
    function handleOverlayKeydown(e) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeClassModal();
        }
    }
</script>

<div class="container">
    <h1>📅 Neuen Termin hinzufügen</h1>

    <form onsubmit={handleSubmit}>
        <div class="form-group">
            <label for="classPickerBtn">Klasse(n) *</label>
            <div class="class-picker-row">
                <button id="classPickerBtn" type="button" class="btn" onclick={openClassModal} disabled={availableClasses.length === 0}>
                    Klasse(n) wählen
                </button>
                <div class="selected-chips">
                    {#if classIdStrs.length === 0}
                        <span class="chip chip-empty">Keine ausgewählt</span>
                    {:else}
                        {#each classIdStrs as idStr}
                            {@const cls = availableClasses.find(c => String(c.id) === idStr)}
                            <span class="chip">{cls ? cls.name : ('ID ' + idStr)}</span>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>

        <div class="form-group">
            <label for="title">Titel *</label>
            <input
                    type="text"
                    id="title"
                    bind:value={title}
                    placeholder="z.B. Elternsprechtag"
                    required
            >
        </div>

        <div class="form-group">
            <label for="content">Inhalt *</label>
            <textarea
                    id="content"
                    bind:value={content}
                    placeholder="Beschreibung des Termins..."
                    rows="5"
                    required
            ></textarea>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="eventDate">Datum *</label>
                <input
                        type="date"
                        id="eventDate"
                        bind:value={eventDate}
                        required
                >
            </div>

            <div class="form-group">
                <label for="eventTime">Uhrzeit *</label>
                <input
                        type="time"
                        id="eventTime"
                        bind:value={eventTime}
                        required
                >
            </div>
        </div>

        <button type="submit" disabled={uploading}>
            {#if uploading}
                ⏳ Wird erstellt...
            {:else}
                ✅ Termin(e) hinzufügen
            {/if}
        </button>
    </form>

    {#if message}
        <div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
            {message}
        </div>
    {/if}

    <a href="/appointments_page_id8" class="back-link">← Zurück zur Übersicht</a>

    {#if modalOpen}
        <div class="modal-overlay" role="button" tabindex="0" aria-label="Klassen-Auswahl schließen" onclick={closeClassModal} onkeydown={handleOverlayKeydown}>
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="classDialogTitle" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
                <h2 id="classDialogTitle">Klassen auswählen</h2>
                {#if availableClasses.length === 0}
                    <p>Keine Klassen gefunden.</p>
                {:else}
                    <div class="modal-actions">
                        <button type="button" class="btn small" onclick={selectAllClasses}>Alle auswählen</button>
                        <button type="button" class="btn small" onclick={clearAllClasses}>Keine</button>
                    </div>
                    <div class="checkbox-list">
                        {#each availableClasses as c}
                            {@const idStr = String(c.id)}
                            <label class="checkbox-item">
                                <input type="checkbox"
                                       checked={modalSelectedStrs.includes(idStr)}
                                       onchange={() => toggleClassChecked(idStr)}
                                >
                                <span>{c.name}{c.grade_level ? ` (Klasse ${c.grade_level})` : ''}</span>
                            </label>
                        {/each}
                    </div>
                {/if}
                <div class="modal-footer">
                    <button type="button" class="btn" onclick={applyClassSelection}>Übernehmen</button>
                    <button type="button" class="btn outline" onclick={closeClassModal}>Abbrechen</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* ============ DARK MODE SUPPORT ============ */
    .container {
        max-width: 700px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    h1 {
        color: var(--text-primary, #333);
        margin-bottom: 30px;
        text-align: center;
        transition: color 0.3s ease;
    }

    form {
        background: var(--bg-card, #f9f9f9);
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border: 1px solid var(--border-color, transparent);
        transition: all 0.3s ease;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
    }

    label {
        display: block;
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--text-secondary, #555);
        transition: color 0.3s ease;
    }

    input[type="text"],
    input[type="date"],
    input[type="time"],
    textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border-color, #ddd);
        background: var(--bg-card, white);
        color: var(--text-primary, #000);
        border-radius: 5px;
        font-size: 16px;
        box-sizing: border-box;
        transition: all 0.3s ease;
    }

    input::placeholder,
    textarea::placeholder {
        color: var(--text-muted, #999);
    }

    input:focus,
    textarea:focus {
        outline: 2px solid #4CAF50;
        border-color: transparent;
    }

    textarea {
        resize: vertical;
        font-family: inherit;
    }

    /* Date/Time Input Dark Mode spezifisch */
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="time"]::-webkit-calendar-picker-indicator {
        filter: var(--calendar-icon-filter, none);
    }

    :root.darkmode input[type="date"]::-webkit-calendar-picker-indicator,
    :root.darkmode input[type="time"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
    }

    button {
        width: 100%;
        padding: 15px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 44px;
    }

    button:hover:not(:disabled) {
        background: #45a049;
        transform: translateY(-1px);
    }

    button:disabled {
        background: var(--bg-hover, #ccc);
        color: var(--text-muted, #666);
        cursor: not-allowed;
        opacity: 0.6;
    }

    button:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    .message {
        margin-top: 20px;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
        transition: all 0.3s ease;
    }

    .message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    :root.darkmode .message.success {
        background: rgba(76, 175, 80, 0.2);
        color: #81c784;
        border-color: rgba(76, 175, 80, 0.3);
    }

    .message.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    :root.darkmode .message.error {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.3);
    }

    .back-link {
        display: inline-block;
        margin-top: 20px;
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
        padding: 0.5rem;
        transition: all 0.2s ease;
        min-height: 44px;
        line-height: 44px;
    }

    .back-link:hover {
        text-decoration: underline;
        opacity: 0.8;
    }

    .back-link:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    :root.darkmode .back-link {
        color: #81c784;
    }

    .class-picker-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn { background: var(--button-bg, #4CAF50); color: var(--text-primary, #fff); border: 1px solid var(--button-border, transparent); padding: 0.6rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn:hover { filter: brightness(0.95); }
    .btn.small { padding: 0.4rem 0.75rem; font-size: 0.9rem; }
    .btn.outline { background: transparent; color: var(--text-primary); border-color: var(--button-border, #ccc); }

    .selected-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .chip { background: var(--bg-card, #eee); color: var(--text-primary, #000); border: 1px solid var(--border-color, #ddd); border-radius: 999px; padding: 0.25rem 0.6rem; font-size: 0.9rem; }
    .chip-empty { opacity: 0.7; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: grid; place-items: center; z-index: 1000; }
    .modal { background: var(--bg-card, #fff); color: var(--text-primary, #000); border-radius: 10px; padding: 1rem; width: min(600px, 92vw); max-height: 80vh; overflow: auto; border: 1px solid var(--border-color, #ddd); }
    .modal h2 { margin-top: 0; }
    .modal-actions { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .checkbox-list { display: grid; gap: 0.5rem; }
    .checkbox-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }
    .modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 600px) {
        .form-row {
            grid-template-columns: 1fr;
        }

        .container {
            padding: 20px 10px;
        }

        form {
            padding: 20px;
        }

        h1 {
            font-size: 1.5rem;
        }
    }
</style>




<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { _ } from '$lib/i18n/config';

    let { data } = $props();
    let { supabase } = data;

    // Types
    type Question = {
        id: number;
        subject: string;
        category: string | null;
        question: string;
        a1: string | null;
        a2: string | null;
        a3: string | null;
        a4: string | null;
        correct_index: number;
        xp_reward: number;
        answers?: string[];
        displaySubject?: string;
        type?: string;
    };

    // --- STATE ---
    // Filters & Data
    let subjectFilter: string = $state('Alle');
    let questions: Question[] = $state([] as Question[]);
    let loading: boolean = $state(true);
    let errorMessage: string = $state('');
    let successMessage: string = $state('');

    // Modal State
    let showModal: boolean = $state(false);
    let isEditing: boolean = $state(false);
    let saving: boolean = $state(false);

    // Form Data (Draft)
    let draft: Question = $state({
        id: null as unknown as number,
        subject: 'Mathe',
        category: '',
        type: 'mc',
        question: '',
        a1: '',
        a2: '',
        a3: '',
        a4: '',
        correct_index: 0,
        xp_reward: 10
    } as unknown as Question);

    // Kategorie Logik
    let availableCategories: string[] = $state([] as string[]);
    let isNewCategoryMode = $state(false);
    let newCategoryInput = $state('');

    // Valid Subjects
    const SUBJECTS = [
        'Mathe',
        'Englisch_EASY',
        'Englisch_MEDIUM',
        'Englisch_HARD',
        'Deutsch_EASY',
        'Deutsch_MEDIUM',
        'Deutsch_HARD',
        'Deutsch_BOSS',
        'Physik_EASY',
        'Physik_MEDIUM',
        'Physik_HARD',
        'Physik_BOSS'
    ];

    // --- LIFECYCLE ---
    onMount(() => {
        loadQuestions();
    });

    // --- LOAD DATA ---
    async function loadQuestions() {
        loading = true;
        errorMessage = '';
        try {
            let query = supabase.from('questions').select('*').order('id', { ascending: false });

            if (subjectFilter !== 'Alle') {
                if (subjectFilter.includes('Englisch')) {
                    const englishVariant = subjectFilter.replace('Englisch', 'English');
                    query = query.or(`subject.ilike.%${subjectFilter}%,subject.ilike.%${englishVariant}%`);
                } else {
                    query = query.ilike('subject', `%${subjectFilter}%`);
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            // Anzeige: subject über i18n-Workaround mappen
            const mapDisplaySubject = (s: string): string => {
                if (!s) return s;
                if(s.includes('English')) {
                    s = s.replace('English', 'Englisch');
                }

                const key = `gm.subject.${s}`;
                try {
                    const label = $_(key);
                    return (label as string) || s;
                } catch (e) {
                    return s;
                }
            };

            questions = ((data || []) as Question[]).map((q: Question) => ({
                ...q,
                displaySubject: mapDisplaySubject(q.subject)
            }));
        } catch (err: any) {
            console.error(err);
            errorMessage = 'Fehler beim Laden der Fragen: ' + (err?.message || String(err));
        } finally {
            loading = false;
        }
    }

    // --- CATEGORY LOGIC ---
    async function fetchCategoriesForSubject(subject: string) {
        if (!subject) return;
        const searchTerm = subject.split('_')[0];

        const { data, error } = await supabase
            .from('questions')
            .select('category')
            .ilike('subject', `${searchTerm}%`)
            .not('category', 'is', null);

        if (!error && data) {
            availableCategories = [...new Set((data as any[]).map((d: any) => d.category as string))].sort();
        } else {
            availableCategories = [];
        }
    }

    function handleSubjectChange() {
        fetchCategoriesForSubject(draft.subject);
        if (!isEditing) {
            draft.category = '';
            isNewCategoryMode = false;
        }
    }

    function handleCategorySelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const val = target.value;
        if (val === '___NEW___') {
            isNewCategoryMode = true;
            newCategoryInput = '';
            draft.category = '';
        } else {
            isNewCategoryMode = false;
            draft.category = val;
        }
    }

    // --- ACTIONS ---

    async function openAddModal() {
        isEditing = false;
        isNewCategoryMode = false;
        newCategoryInput = '';

        draft = {
            id: 0,
            subject: 'Mathe',
            category: '',
            type: 'mc',
            question: '',
            a1: '',
            a2: '',
            a3: '',
            a4: '',
            correct_index: 0,
            xp_reward: 10
        } as unknown as Question;

        await fetchCategoriesForSubject(draft.subject);
        showModal = true;
        successMessage = '';
    }

    async function openEditModal(q: Question) {
        isEditing = true;
        isNewCategoryMode = false;
        newCategoryInput = '';

        draft = { ...q } as Question;

        await fetchCategoriesForSubject(draft.subject);

        const isCloze = !q.a1 && !q.a2;
        draft.type = q.type || (isCloze ? 'cloze' : 'mc');

        if (!draft.category) draft.category = '';

        showModal = true;
        successMessage = '';
    }

    function closeModal() {
        showModal = false;
    }

    async function saveQuestion() {
        // Validation
        if (draft.type === 'mc') {
            if (!draft.question || !draft.a1 || !draft.a2) {
                errorMessage = 'Bitte mindestens Frage und 2 Antworten angeben.';
                return;
            }
        } else {
            if (!draft.question) {
                errorMessage = 'Bitte eine Frage/Text eingeben.';
                return;
            }
            if (!draft.question.includes('[') || !draft.question.includes(']')) {
                errorMessage = 'Der Text muss mindestens eine Lücke enthalten (z.B. [Wort]).';
                return;
            }
        }

        let finalCategory = draft.category;
        if (isNewCategoryMode) {
            if (!newCategoryInput.trim()) {
                errorMessage = 'Bitte einen Namen für die neue Kategorie eingeben.';
                return;
            }
            finalCategory = newCategoryInput.trim();
        }

        saving = true;
        errorMessage = '';

        try {
            const payload = {
                subject: draft.subject,
                category: finalCategory,
                question: draft.question,
                xp_reward: draft.xp_reward,
                a1: draft.type === 'mc' ? draft.a1 : null,
                a2: draft.type === 'mc' ? draft.a2 : null,
                a3: draft.type === 'mc' ? draft.a3 : null,
                a4: draft.type === 'mc' ? draft.a4 : null,
                correct_index: draft.type === 'mc' ? (draft.correct_index + 1) : 0
            };

            if (isEditing) {
                const { error } = await supabase.from('questions').update(payload).eq('id', draft.id);
                if (error) throw error;
                successMessage = 'Frage erfolgreich aktualisiert!';
            } else {
                const { error } = await supabase.from('questions').insert(payload);
                if (error) throw error;
                successMessage = 'Neue Frage hinzugefügt!';
            }

            closeModal();
            await loadQuestions();
        } catch (err: any) {
            console.error(err);
            errorMessage = 'Fehler beim Speichern: ' + (err?.message || String(err));
        } finally {
            saving = false;
            setTimeout(() => { successMessage = ''; }, 3000);
        }
    }

    async function deleteQuestion(id: number) {
        if (!confirm('Bist du sicher, dass du diese Frage löschen willst?')) return;

        try {
            const { error } = await supabase.from('questions').delete().eq('id', id);

            if (error) {
                console.error('Delete Error:', error);
                alert('Fehler beim Löschen: ' + error.message);
            } else {
                questions = questions.filter((q: Question) => q.id !== id);
                successMessage = 'Frage erfolgreich gelöscht.';
                setTimeout(() => { successMessage = ''; }, 3000);
            }
        } catch (err: any) {
            console.error('Unexpected Error:', err);
            alert('Unerwarteter Fehler: ' + (err?.message || String(err)));
        }
    }

    function onFilterChange() {
        loadQuestions();
    }

    // Helpers für Antwortfelder (MC): Lesen/Schreiben ohne TS-Casts im Template
    function getAnswerValue(idx: number): string {
        const key = `a${idx + 1}` as keyof Question;
        const val = (draft as any)[key];
        return (val as string) || '';
    }
    function setAnswerValue(idx: number, value: string) {
        const key = `a${idx + 1}` as keyof Question;
        (draft as any)[key] = value;
    }
</script>

<div class="page-container">
    <header class="page-header">
        <h1>🎮 Spiel-Verwaltung</h1>
        <p>Erstelle und verwalte die Fragen für die Minispiele deiner Schüler.</p>
    </header>

    {#if errorMessage}
        <div class="alert error" role="alert">
            <span>⚠️</span>
            {errorMessage}
        </div>
    {/if}
    {#if successMessage}
        <div class="alert success" role="alert">
            <span>✅</span>
            {successMessage}
        </div>
    {/if}

    <div class="card">
        <div class="toolbar">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <a
                        href="/teacher_landing_page_id6"
                        class="btn-secondary"
                        style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;"
                >
                    <span>←</span> Zurück
                </a>
                <div class="filter-group">
                    <label for="filterSubject">Fach:</label>
                    <select id="filterSubject" bind:value={subjectFilter} onchange={onFilterChange}>
                        <option value="Alle">Alle Fächer</option>
                        <option value="Mathe">Mathe (Alle)</option>
                        <option value="Englisch">Englisch (Alle)</option>
                        <option value="Deutsch">Deutsch (Alle)</option>
                        <option value="Physik">Physik (Alle)</option>
                        <option disabled>──────────</option>
                        <option value="Mathe">{$_('gm.subject.Mathe')}</option>
                        <option value="Englisch_EASY">{$_('gm.subject.Englisch_EASY')}</option>
                        <option value="Englisch_MEDIUM">{$_('gm.subject.Englisch_MEDIUM')}</option>
                        <option value="Englisch_HARD">{$_('gm.subject.Englisch_HARD')}</option>
                        <option value="Deutsch_EASY">{$_('gm.subject.Deutsch_EASY')}</option>
                        <option value="Deutsch_MEDIUM">{$_('gm.subject.Deutsch_MEDIUM')}</option>
                        <option value="Deutsch_HARD">{$_('gm.subject.Deutsch_HARD')}</option>
                        <option value="Deutsch_BOSS">{$_('gm.subject.Deutsch_BOSS')}</option>
                        <option value="Physik_EASY">{$_('gm.subject.Physik_EASY')}</option>
                        <option value="Physik_MEDIUM">{$_('gm.subject.Physik_MEDIUM')}</option>
                        <option value="Physik_HARD">{$_('gm.subject.Physik_HARD')}</option>
                        <option value="Physik_BOSS">{$_('gm.subject.Physik_BOSS')}</option>
                    </select>
                </div>
            </div>

            <button class="btn-primary" onclick={openAddModal}> + Neue Frage </button>
        </div>

        <div class="table-wrapper">
            {#if loading}
                <div class="loading">Lade Fragen...</div>
            {:else if questions.length === 0}
                <div class="empty-state">Keine Fragen gefunden.</div>
            {:else}
                <table>
                    <colgroup>
                        <col style="width: 60px;"> <col style="width: 140px;"> <col style="width: 140px;"> <col style="width: auto;"> <col style="width: 200px;"> <col style="width: 80px;"> <col style="width: 240px;"> </colgroup>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fach</th>
                        <th>Kategorie</th>
                        <th>Frage</th>
                        <th>Antworten</th>
                        <th>XP</th>
                        <th style="text-align: center;">Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each questions as q (q.id)}
                        <tr>
                            <td><small style="color: #94a3b8;">#{q.id}</small></td>
                            <td><span class="badge">{q.displaySubject || q.subject}</span></td>
                            <td>
                                {#if q.category}
                                    <span class="cat-badge">{q.category}</span>
                                {:else}
                                    <span style="color: #cbd5e1;">—</span>
                                {/if}
                            </td>
                            <td><div class="question-text" title={q.question}>{q.question}</div></td>
                            <td class="answers-preview">
                                <small style="color: #64748b;">
                                    ✅ {q.answers ? q.answers[q.correct_index] : (q.a1 ? 'A: ' + q.a1 : 'Lückentext')}
                                </small>
                            </td>
                            <td><strong>{q.xp_reward}</strong></td>
                            <td>
                                <div class="actions">
                                    <button class="btn-action edit" onclick={() => openEditModal(q)}>
                                        Bearbeiten
                                    </button>
                                    <button class="btn-action delete" onclick={() => deleteQuestion(q.id)}>
                                        Löschen
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>

    {#if showModal}
        <div class="modal-backdrop" transition:fade={{ duration: 150 }}>
            <div class="modal" transition:scale={{ duration: 200, easing: quintOut, start: 0.95 }}>
                <h2>{isEditing ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</h2>

                <div class="form-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="subjectSelect">Fach</label>
                            <select id="subjectSelect" bind:value={draft.subject} onchange={handleSubjectChange}>
                                <option value="Mathe">{$_('gm.subject.Mathe')}</option>
                                <option value="Englisch_EASY">{$_('gm.subject.Englisch_EASY')}</option>
                                <option value="Englisch_MEDIUM">{$_('gm.subject.Englisch_MEDIUM')}</option>
                                <option value="Englisch_HARD">{$_('gm.subject.Englisch_HARD')}</option>
                                <option value="Deutsch_EASY">{$_('gm.subject.Deutsch_EASY')}</option>
                                <option value="Deutsch_MEDIUM">{$_('gm.subject.Deutsch_MEDIUM')}</option>
                                <option value="Deutsch_HARD">{$_('gm.subject.Deutsch_HARD')}</option>
                                <option value="Deutsch_BOSS">{$_('gm.subject.Deutsch_BOSS')}</option>
                                <option value="Physik_EASY">{$_('gm.subject.Physik_EASY')}</option>
                                <option value="Physik_MEDIUM">{$_('gm.subject.Physik_MEDIUM')}</option>
                                <option value="Physik_HARD">{$_('gm.subject.Physik_HARD')}</option>
                                <option value="Physik_BOSS">{$_('gm.subject.Physik_BOSS')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="categorySelect">Kategorie</label>
                            {#if !isNewCategoryMode}
                                <select id="categorySelect" bind:value={draft.category} onchange={handleCategorySelect}>
                                    <option value="">-- Keine / Wählen --</option>
                                    {#each availableCategories as cat}
                                        <option value={cat}>{cat}</option>
                                    {/each}
                                    <option disabled>──────────</option>
                                    <option value="___NEW___">➕ Neue Kategorie erstellen...</option>
                                </select>
                            {:else}
                                <div class="input-group">
                                    <input type="text" bind:value={newCategoryInput} placeholder="Neue Kategorie" />
                                    <button class="btn-small" onclick={() => (isNewCategoryMode = false)}>✕</button>
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="typeSelect">Fragetyp</label>
                        <select id="typeSelect" bind:value={draft.type}>
                            <option value="mc">Multiple Choice</option>
                            <option value="cloze">Lückentext</option>
                        </select>
                    </div>
                    <div class="form-group" style="max-width: 150px;">
                        <label for="xpInput">XP Belohnung</label>
                        <input id="xpInput" type="number" bind:value={draft.xp_reward} min="1" max="100" />
                    </div>
                    <div class="form-group">
                        <label for="questionTextarea">Fragestellung</label>
                        <textarea id="questionTextarea" rows="3" bind:value={draft.question}></textarea>
                    </div>
                    {#if draft.type === 'mc'}
                        <div class="form-group">
                            <label for="answersGrid">Antwortmöglichkeiten (Markiere die Richtige)</label>
                            <div id="answersGrid" class="answers-grid">
                                {#each [0, 1, 2, 3] as idx}
                                    <div class="answer-row">
                                        <label class="radio-label">
                                            <input type="radio" name="correct" checked={draft.correct_index === idx} onchange={() => (draft.correct_index = idx)} />
                                            <span>{idx + 1}.</span>
                                        </label>
                                        <input type="text"
                                            value={getAnswerValue(idx)}
                                            oninput={(e) => setAnswerValue(idx, (e.target as any).value)}
                                        />
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" onclick={closeModal} disabled={saving}>Abbrechen</button>
                    <button class="btn-primary" onclick={saveQuestion} disabled={saving}>
                        {saving ? 'Speichert...' : 'Speichern'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* GLOBAL LAYOUT */
    :global(body) {
        background-color: #f8fafc;
        color: #1e293b;
        font-family: 'Inter', system-ui, sans-serif;
    }

    .page-container {
        /* BREITER! */
        max-width: 1400px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
    }

    .page-header {
        margin-bottom: 2.5rem;
        text-align: center;
    }
    .page-header h1 {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        background-clip: text; /* Standard-Eigenschaft für Kompatibilität */
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
    }
    .page-header p {
        color: #64748b;
        font-size: 1.1rem;
    }

    /* CARDS */
    .card {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        overflow: visible; /* Scrollen entfernt! */
        margin-bottom: 2rem;
    }

    /* TOOLBAR */
    .toolbar {
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid #f1f5f9;
    }
    .filter-group {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .filter-group label {
        font-weight: 600;
        color: #475569;
    }
    .filter-group select {
        padding: 0.6rem 1rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        background-color: #f8fafc;
        color: #334155;
        cursor: pointer;
    }

    /* TABLE LAYOUT FIX */
    .table-wrapper {
        width: 100%;
        /* KEIN SCROLLEN MEHR */
        overflow-x: visible;
    }
    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed; /* WICHTIG: Erzwingt, dass sich die Tabelle an den Container hält */
    }
    th {
        background: #f8fafc;
        padding: 1rem 1.5rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
    }
    td {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
        font-size: 0.95rem;
        vertical-align: middle;
        /* Verhindert, dass Inhalt die Tabelle sprengt */
        overflow: hidden;
        text-overflow: ellipsis;
    }
    tr:hover td {
        background-color: #f8fafc;
    }

    .question-text {
        font-weight: 500;
        color: #1e293b;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: #e0e7ff;
        color: #4338ca;
    }
    .cat-badge {
        display: inline-flex;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
    }

    /* TEXT BUTTONS STYLING - CENTERED */
    .actions {
        display: flex;
        align-items: center;
        justify-content: center; /* ZENTRIERT in der Zelle */
        gap: 0.5rem;
        width: 100%;
        height: 100%;
    }

    .btn-action {
        /* WICHTIG FÜR ZENTRIERUNG: */
        display: inline-flex;
        align-items: center;
        justify-content: center;

        /* Größe & Abstand */
        padding: 0.5rem 0.9rem; /* Etwas mehr Padding */
        border-radius: 8px;

        /* Text */
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1;         /* Verhindert verschobene Höhe */
        white-space: nowrap;    /* Verhindert Umbruch */

        /* Verhalten */
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s ease-in-out;
    }

    /* Bearbeiten (Blau) */
    .btn-action.edit {
        background-color: #eff6ff;
        color: #3b82f6;
        border-color: #dbeafe;
    }
    .btn-action.edit:hover {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    /* Löschen (Rot) */
    .btn-action.delete {
        background-color: #fef2f2;
        color: #ef4444;
        border-color: #fee2e2;
    }
    .btn-action.delete:hover {
        background-color: #ef4444;
        color: white;
        border-color: #ef4444;
        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    }

    /* STANDARD BUTTONS */
    .btn-primary {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    .btn-secondary {
        background: #fff;
        color: #64748b;
        border: 1px solid #e2e8f0;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-weight: 600;
        cursor: pointer;
    }
    .btn-small {
        padding: 0 0.8rem;
        border: 1px solid #cbd5e1;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        color: #ef4444;
    }

    /* ALERTS */
    .alert {
        padding: 1rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .alert.error {
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
    }
    .alert.success {
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #bbf7d0;
    }

    /* MODAL */
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: flex-start; /* zuvor center: mehr Abstand nach oben */
        padding-top: 4.5rem; /* zusätzlicher Abstand zum Seitenkopf */
        z-index: 50;
    }
    .modal {
        background: white;
        width: 100%;
        max-width: 650px;
        border-radius: 20px;
        padding: 2.5rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        max-height: 90vh;
        overflow-y: auto;
    }
    .modal h2 {
        margin: 0 0 2rem 0;
        font-size: 1.5rem;
        color: #1e293b;
        text-align: center;
    }

    /* FORM */
    .form-group {
        margin-bottom: 1.5rem;
    }
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #334155;
        font-size: 0.9rem;
    }
    .form-group input[type='text'],
    .form-group input[type='number'],
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.95rem;
        color: #1e293b;
        background: #f8fafc;
    }
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    .input-group {
        display: flex;
        gap: 0.5rem;
    }

    .answers-grid {
        background: #f8fafc;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .answer-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .radio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #475569;
        min-width: 50px;
        cursor: pointer;
    }
    .radio-label input[type='radio'] {
        accent-color: #6366f1;
        width: 1.1rem;
        height: 1.1rem;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #f1f5f9;
    }

    .loading,
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #94a3b8;
    }
</style>
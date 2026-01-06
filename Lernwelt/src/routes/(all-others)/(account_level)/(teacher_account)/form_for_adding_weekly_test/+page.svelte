<!--Lernwelt/src/routes/(all-others)/(account_level)/(teacher_account)/form_for_adding_weekly_test/+page.svelte-->
<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let { data } = $props();

    let { supabase, session } = data;


    let title = $state('');
    /** @type {string} */
    let selectedClassId = $state('');
    /** @type {File | null} */
    let questionPdf = $state(null);
    /** @type {File | null} */
    let answerPdf = $state(null);
    /** @type {{ id: number; name: string }[]} */
    let classes = $state([]);
    let classesLoading = $state(true);
    let classesError = $state('');
    let uploading = $state(false);
    let message = $state('');

    onMount(async () => {
        // Lade alle Klassen für Dropdown (Lehrkräfte dürfen alle sehen)
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden der Klassen:', error);
            classesError = 'Fehler beim Laden der Klassen';
        } else {
            classes = data || [];
        }
        classesLoading = false;
    });

    /**
     * @param {Event} event
     */
    function handleQuestionFileChange(event) {
        const target = /** @type {HTMLInputElement} */ (event.target);
        if (target.files && target.files[0]) {
            questionPdf = target.files[0];
        }
    }

    /**
     * @param {Event} event
     */
    function handleAnswerFileChange(event) {
        const target = /** @type {HTMLInputElement} */ (event.target);
        if (target.files && target.files[0]) {
            answerPdf = target.files[0];
        }
    }

    /** @param {Event} event */
    function handleClassChange(event) {
        const target = /** @type {HTMLSelectElement} */ (event.target);
        selectedClassId = target.value ?? '';
    }

    async function handleSubmit() {
        try {
            uploading = true;
            message = '';

            // Validierung
            if (!title || !questionPdf || !answerPdf) {
                message = 'Bitte fülle alle Pflichtfelder aus!';
                uploading = false;
                return;
            }

            // Prüfe ob PDFs
            if (questionPdf.type !== 'application/pdf' || answerPdf.type !== 'application/pdf') {
                message = 'Bitte nur PDF-Dateien hochladen!';
                uploading = false;
                return;
            }

            // 1. Hole die höchste ID
            const { data: maxIdData, error: maxIdError } = await supabase
                .from('weekly_tests')
                .select('id')
                .order('id', { ascending: false })
                .limit(1);

            if (maxIdError) throw maxIdError;

            const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

            // 2. Upload Aufgaben-PDF
            const questionFileName = `link_question/test_${newId}_aufgaben.pdf`;
            const { error: questionUploadError } = await supabase.storage
                .from('weekly_tests')
                .upload(questionFileName, questionPdf);

            if (questionUploadError) throw questionUploadError;

            // 3. Upload Lösungs-PDF
            const answerFileName = `link_answere/test_${newId}_loesungen.pdf`;
            const { error: answerUploadError } = await supabase.storage
                .from('weekly_tests')
                .upload(answerFileName, answerPdf);

            if (answerUploadError) throw answerUploadError;

            // 4. Hole die öffentlichen URLs
            const { data: questionUrlData } = supabase.storage
                .from('weekly_tests')
                .getPublicUrl(questionFileName);

            const { data: answerUrlData } = supabase.storage
                .from('weekly_tests')
                .getPublicUrl(answerFileName);

            // 5. Füge Eintrag in Datenbank ein
            // class_id zuverlässig als Zahl oder NULL setzen
            const parsedClassId = selectedClassId === '' ? null : Number(selectedClassId);
            const { error: insertError } = await supabase
                .from('weekly_tests')
                .insert({
                    id: newId,
                    title: title,
                    link_question: questionUrlData.publicUrl,
                    link_answere: answerUrlData.publicUrl,
                    class_id: Number.isNaN(parsedClassId) ? null : parsedClassId,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            message = '✅ Test erfolgreich hinzugefügt!';

            setTimeout(() => {
                goto('/weekly_test_page_id17');
            }, 2000);

        } catch (error) {
            console.error('Fehler:', error);
            const e = /** @type {any} */(error);
            message = `❌ Fehler: ${e?.message ?? 'Unbekannter Fehler'}`;
        } finally {
            uploading = false;
        }
    }
</script>

<div class="container">
    <h1>📝 Neuen Test hinzufügen</h1>

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-group">
            <label for="title">Titel *</label>
            <input
                    type="text"
                    id="title"
                    bind:value={title}
                    placeholder="z.B. Wochentest Woche 5"
                    required
            >
        </div>

        <div class="form-group">
            <label for="classId">Klasse (optional)</label>
            <select id="classId" onchange={handleClassChange}>
                <option value="">-- Für alle --</option>
                {#if classesLoading}
                    <option disabled>Lade Klassen...</option>
                {:else if classesError}
                    <option disabled>{classesError}</option>
                {:else if classes.length === 0}
                    <option disabled>Keine Klassen gefunden</option>
                {:else}
                    {#each classes as cls}
                        <option value={String(cls.id)}>{cls.name}</option>
                    {/each}
                {/if}
            </select>
        </div>

        <div class="form-group">
            <label for="questionPdf">Aufgaben-PDF hochladen *</label>
            <input
                type="file"
                id="questionPdf"
                accept=".pdf"
                onchange={handleQuestionFileChange}
                required
            >
            {#if questionPdf}
                <p class="file-info">📄 Ausgewählt: {questionPdf.name}</p>
            {/if}
        </div>

        <div class="form-group">
            <label for="answerPdf">Lösungs-PDF hochladen *</label>
            <input
                type="file"
                id="answerPdf"
                accept=".pdf"
                onchange={handleAnswerFileChange}
                required
            >
            {#if answerPdf}
                <p class="file-info">📄 Ausgewählt: {answerPdf.name}</p>
            {/if}
        </div>

        <button type="submit" disabled={uploading}>
            {#if uploading}
                ⏳ Wird hochgeladen...
            {:else}
                ✅ Test hinzufügen
            {/if}
        </button>
    </form>

    {#if message}
        <div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
            {message}
        </div>
    {/if}

    <a href="/weekly_test_page_id17" class="back-link">← Zurück zur Übersicht</a>
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

    label {
        display: block;
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--text-secondary, #555);
        transition: color 0.3s ease;
    }

    input[type="text"],
    select {
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

    input::placeholder {
        color: var(--text-muted, #999);
    }

    input:focus,
    select:focus {
        outline: 2px solid #4CAF50;
        border-color: transparent;
    }

    /* Select dropdown arrow styling for dark mode */
    select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
    }

    :root.darkmode select {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e6edf3' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    }

    select option {
        background: var(--bg-card, white);
        color: var(--text-primary, #000);
    }

    input[type="file"] {
        width: 100%;
        padding: 10px;
        border: 2px dashed var(--border-color, #ddd);
        background: var(--bg-card, white);
        color: var(--text-primary, #000);
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    input[type="file"]:hover {
        border-color: #4CAF50;
    }

    input[type="file"]:focus-visible {
        outline: 2px solid #4CAF50;
        outline-offset: 2px;
    }

    /* File input button styling for dark mode */
    input[type="file"]::file-selector-button {
        background: var(--bg-hover, #e0e0e0);
        color: var(--text-primary, #000);
        border: 1px solid var(--border-color, #ddd);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        transition: all 0.2s ease;
    }

    input[type="file"]::file-selector-button:hover {
        background: var(--bg-card, #d0d0d0);
    }

    .file-info {
        margin-top: 8px;
        color: #4CAF50;
        font-size: 14px;
        transition: color 0.3s ease;
    }

    :root.darkmode .file-info {
        color: #81c784;
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

    /* ============ RESPONSIVE ============ */
    @media (max-width: 600px) {
        .container {
            padding: 20px 10px;
        }

        form {
            padding: 20px;
        }

        h1 {
            font-size: 1.5rem;
        }

        button {
            font-size: 16px;
        }
    }
</style>
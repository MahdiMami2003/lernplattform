<!--Lernwelt/src/routes/(all-others)/(account_level)/(teacher_account)/form_for_adding_weekly_test/+page.svelte-->
<script>

    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let { data } = $props();

    let { supabase, session } = data;


    let title = '';
    let selectedClassId = null;
    /** @type {File | null} */
    let questionPdf = null;
    /** @type {File | null} */
    let answerPdf = null;
    let classes = [];
    let uploading = false;
    let message = '';

    onMount(async () => {
        // Lade alle Klassen für Dropdown
        const { data, error } = await supabase
            .from('classes')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden der Klassen:', error);
        } else {
            classes = data || [];
        }
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
            const { error: insertError } = await supabase
                .from('weekly_tests')
                .insert({
                    id: newId,
                    title: title,
                    link_question: questionUrlData.publicUrl,
                    link_answere: answerUrlData.publicUrl,
                    class_id: selectedClassId || null,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            message = '✅ Test erfolgreich hinzugefügt!';

            setTimeout(() => {
                goto('/weekly_test_page_id17');
            }, 2000);

        } catch (error) {
            console.error('Fehler:', error);
            message = `❌ Fehler: ${error.message}`;
        } finally {
            uploading = false;
        }
    }
</script>

<div class="container">
    <h1>📝 Neuen Test hinzufügen</h1>

    <form on:submit|preventDefault={handleSubmit}>
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
            <select id="classId" bind:value={selectedClassId}>
                <option value={null}>-- Für alle --</option>
                {#each classes as cls}
                    <option value={cls.id}>{cls.name}</option>
                {/each}
            </select>
        </div>

        <div class="form-group">
            <label for="questionPdf">Aufgaben-PDF hochladen *</label>
            <input
                    type="file"
                    id="questionPdf"
                    accept=".pdf"
                    on:change={handleQuestionFileChange}
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
                    on:change={handleAnswerFileChange}
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
    .container {
        max-width: 700px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    h1 {
        color: #333;
        margin-bottom: 30px;
        text-align: center;
    }

    form {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .form-group {
        margin-bottom: 20px;
    }

    label {
        display: block;
        font-weight: bold;
        margin-bottom: 8px;
        color: #555;
    }

    input[type="text"],
    select {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        box-sizing: border-box;
    }

    input[type="file"] {
        width: 100%;
        padding: 10px;
        border: 2px dashed #ddd;
        border-radius: 5px;
        cursor: pointer;
    }

    .file-info {
        margin-top: 8px;
        color: #4CAF50;
        font-size: 14px;
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
        transition: background 0.3s ease;
    }

    button:hover:not(:disabled) {
        background: #45a049;
    }

    button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .message {
        margin-top: 20px;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
    }

    .message.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .message.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .back-link {
        display: inline-block;
        margin-top: 20px;
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
    }

    .back-link:hover {
        text-decoration: underline;
    }
</style>
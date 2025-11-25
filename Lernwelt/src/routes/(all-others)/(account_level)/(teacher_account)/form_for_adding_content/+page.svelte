<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { goto } from '$app/navigation';

    // Mapping: Deutsche Namen → Englische Bucket-Ordner
    const subjectToBucket = {
        'Mathe': 'Math',
        'Englisch': 'English',
        'Deutsch': 'German',
        'Geschichte': 'History',
        'Biologie': 'Biology'
    };

    let title = '';
    let description = '';
    let subject = '';
    let schoolClass = '';
    /** @type {File | null} */
    let pdfFile = null;
    let uploading = false;
    let message = '';

    /**
     * @param {Event} event
     */
    function handleFileChange(event) {
        const target = /** @type {HTMLInputElement} */ (event.target);
        if (target.files && target.files[0]) {
            pdfFile = target.files[0];
        }
    }

    async function handleSubmit() {
        try {
            uploading = true;
            message = '';

            // Validierung
            if (!title || !subject || !schoolClass || !pdfFile) {
                message = 'Bitte fülle alle Pflichtfelder aus und wähle eine PDF-Datei!';
                uploading = false;
                return;
            }

            // Prüfe ob PDF
            if (pdfFile.type !== 'application/pdf') {
                message = 'Bitte nur PDF-Dateien hochladen!';
                uploading = false;
                return;
            }

            // 1. Hole die höchste ID
            const { data: maxIdData, error: maxIdError } = await supabase
                .from('materials')
                .select('id')
                .order('id', { ascending: false })
                .limit(1);

            if (maxIdError) throw maxIdError;

            const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;

            // 2. Upload PDF zu Supabase Storage
            const bucketFolder = subjectToBucket[subject] || 'Other';
            const fileName = `${bucketFolder}/${subject}_${newId}.pdf`;

            const { error: uploadError } = await supabase.storage
                .from('lehrmaterialien')
                .upload(fileName, pdfFile);

            if (uploadError) throw uploadError;

            // 3. Hole die öffentliche URL
            const { data: urlData } = supabase.storage
                .from('lehrmaterialien')
                .getPublicUrl(fileName);

            const fileUrl = urlData.publicUrl;

            // 4. Füge Eintrag in Datenbank ein
            const { error: insertError } = await supabase
                .from('materials')
                .insert({
                    id: newId,
                    title: title,
                    description: description || null,
                    subject: subject,
                    school_class: schoolClass,
                    file_url: fileUrl,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            message = '✅ Lerninhalt erfolgreich hinzugefügt!';

            // Warte kurz und leite zur Übersicht
            setTimeout(() => {
                goto('/material_page_id14');
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
    <h1>📝 Neuen Lerninhalt hinzufügen</h1>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="title">Titel *</label>
            <input
                    type="text"
                    id="title"
                    bind:value={title}
                    placeholder="z.B. Bruchrechnung Einführung"
                    required
            >
        </div>

        <div class="form-group">
            <label for="description">Beschreibung (optional)</label>
            <textarea
                    id="description"
                    bind:value={description}
                    placeholder="Kurze Beschreibung des Inhalts..."
                    rows="3"
            ></textarea>
        </div>

        <div class="form-group">
            <label for="subject">Schulfach *</label>
            <select id="subject" bind:value={subject} required>
                <option value="">-- Bitte wählen --</option>
                <option value="Mathe">Mathe</option>
                <option value="Englisch">Englisch</option>
                <option value="Deutsch">Deutsch</option>
                <option value="Geschichte">Geschichte</option>
                <option value="Biologie">Biologie</option>
            </select>
        </div>

        <div class="form-group">
            <label for="schoolClass">Schulklasse *</label>
            <input
                    type="text"
                    id="schoolClass"
                    bind:value={schoolClass}
                    placeholder="z.B. 5a, 10b"
                    required
            >
        </div>

        <div class="form-group">
            <label for="pdfFile">PDF hochladen *</label>
            <input
                    type="file"
                    id="pdfFile"
                    accept=".pdf"
                    on:change={handleFileChange}
                    required
            >
            {#if pdfFile}
                <p class="file-info">📄 Ausgewählt: {pdfFile.name}</p>
            {/if}
        </div>

        <button type="submit" disabled={uploading}>
            {#if uploading}
                ⏳ Wird hochgeladen...
            {:else}
                ✅ Lerninhalt hinzufügen
            {/if}
        </button>
    </form>

    {#if message}
        <div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
            {message}
        </div>
    {/if}

    <a href="/material_page_id14" class="back-link">← Zurück zur Übersicht</a>
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
    select,
    textarea {
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

    textarea {
        resize: vertical;
        font-family: inherit;
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
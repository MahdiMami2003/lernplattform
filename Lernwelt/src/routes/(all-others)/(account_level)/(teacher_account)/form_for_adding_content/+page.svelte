<!--Lernwelt/src/routes/(all-others)/(account_level)/(teacher_account)/form_for_adding_content/+page.svelte-->
<script>
    import { goto } from '$app/navigation';

    // Mapping: Deutsche Namen → Englische Bucket-Ordner
    const subjectToBucket = {
        'Mathe': 'Math',
        'Englisch': 'English',
        'Deutsch': 'German',
        'Geschichte': 'History',
        'Biologie': 'Biology'
    };

    let { data } = $props();
    let { supabase, session } = data;

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

            console.log('🚀 Submit started...'); // DEBUG

            // Validierung
            if (!title || !description || !subject) {
                message = 'Bitte fülle alle Pflichtfelder aus!';
                uploading = false;
                return;
            }

            // Prüfe ob PDF vorhanden ist und ob es eine PDF ist
            if (pdfFile && pdfFile.type !== 'application/pdf') {
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

            if (maxIdError) {
                console.error('❌ Max ID Error:', maxIdError);
                throw maxIdError;
            }

            const newId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
            console.log('✅ New ID:', newId);

            let fileUrl = null;

            // 2. Upload PDF zu Supabase Storage (nur wenn vorhanden)
            if (pdfFile) {
                console.log('📤 Uploading PDF...');
                const bucketFolder = subjectToBucket[subject] || 'Other';
                const fileName = `${bucketFolder}/${subject}_${newId}.pdf`;

                const { error: uploadError } = await supabase.storage
                    .from('lehrmaterialien')
                    .upload(fileName, pdfFile);

                if (uploadError) {
                    console.error('❌ Upload Error:', uploadError);
                    throw uploadError;
                }

                // 3. Hole die öffentliche URL
                const { data: urlData } = supabase.storage
                    .from('lehrmaterialien')
                    .getPublicUrl(fileName);

                fileUrl = urlData.publicUrl;
                console.log('✅ File URL:', fileUrl);
            }

            // 4. WICHTIG: class_id lookup ODER NULL für "alle"
            let classId = null;

            if (schoolClass && schoolClass.trim() !== '') {
                console.log('🔍 Looking up class_id for:', schoolClass);

                const { data: classData, error: classError } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('name', schoolClass)
                    .single();

                if (classError) {
                    console.warn('⚠️ Class not found:', classError);
                    // Klasse existiert nicht - Material wird für ALLE erstellt
                    classId = null;
                } else {
                    classId = classData.id;
                    console.log('✅ Found class_id:', classId);
                }
            }

            // 5. Füge Eintrag in Datenbank ein
            console.log('💾 Inserting into database...');

            const insertData = {
                id: newId,
                title: title,
                description: description,
                subject: subject,
                class_id: classId,  // ← FIXED: class_id statt school_class!
                file_url: fileUrl,
                created_at: new Date().toISOString()
            };

            console.log('📋 Insert Data:', insertData);

            const { error: insertError } = await supabase
                .from('materials')
                .insert(insertData);

            if (insertError) {
                console.error('❌ Insert Error:', insertError);
                console.error('Error details:', JSON.stringify(insertError, null, 2));
                throw insertError;
            }

            console.log('✅ Material successfully created!');
            message = '✅ Lerninhalt erfolgreich hinzugefügt!';

            // Warte kurz und leite zur Übersicht
            setTimeout(() => {
                goto('/material_page_id14');
            }, 2000);

        } catch (error) {
            console.error('❌ Fatal Error:', error);
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
                    placeholder="-"
                    required
            >
        </div>

        <div class="form-group">
            <label for="description">Beschreibung *</label>
            <textarea
                    id="description"
                    bind:value={description}
                    placeholder="Freitext&#10;&#10;"
                    rows="8"
                    required
            ></textarea>
        </div>

        <div class="form-group">
            <label for="subject">Schulfach *</label>
            <input
                    type="text"
                    id="subject"
                    bind:value={subject}
                    placeholder="Mathe, Englisch, etc."
                    required
            >
        </div>

        <div class="form-group">
            <label for="schoolClass">Schulklasse (optional - leer lassen für ALLE Klassen)</label>
            <input
                    type="text"
                    id="schoolClass"
                    bind:value={schoolClass}
                    placeholder="z.B. 5a, 10b (oder leer lassen)"
            >
            <small style="color: var(--text-muted, #666); margin-top: 4px; display: block;">
                💡 Tipp: Leer lassen = Material ist für alle Klassen sichtbar
            </small>
        </div>

        <div class="form-group">
            <label for="pdfFile">PDF hochladen (optional)</label>
            <input
                    type="file"
                    id="pdfFile"
                    accept=".pdf"
                    on:change={handleFileChange}
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
    select,
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

    textarea {
        resize: vertical;
        font-family: inherit;
        min-height: 150px;
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

    small {
        font-size: 0.85rem;
        font-weight: normal;
    }
</style>
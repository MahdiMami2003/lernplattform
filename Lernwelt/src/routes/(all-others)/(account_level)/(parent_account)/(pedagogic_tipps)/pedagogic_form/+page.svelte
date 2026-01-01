<!-- Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/(pedagogic_tipps)/pedagogic_form/+page.svelte -->
<script>
    import { goto } from '$app/navigation';

    let { data } = $props();

    let { supabase, session } = data;

    let title = '';
    let description = '';
    let content = '';
    let uploading = false;
    let message = '';

    async function handleSubmit() {
        try {
            uploading = true;
            message = '';

            // Validierung
            if (!title || !description || !content) {
                message = 'Bitte fülle alle Pflichtfelder aus!';
                uploading = false;
                return;
            }

            // Füge Eintrag in Datenbank ein
            const { error: insertError } = await supabase
                .from('pedagogic_tips')
                .insert({
                    title: title,
                    description: description,
                    content: content,
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            message = '✅ Tipp erfolgreich hinzugefügt!';

            // Warte kurz und leite zur Übersicht
            setTimeout(() => {
                goto('/pedagogy_page_id10');
            }, 1);

        } catch (error) {
            console.error('Fehler:', error);
            message = `❌ Fehler: ${error.message}`;
        } finally {
            uploading = false;
        }
    }
</script>

<div class="container">
    <h1>📚 Neuen pädagogischen Tipp hinzufügen</h1>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="title">Titel *</label>
            <input
                    type="text"
                    id="title"
                    bind:value={title}
                    placeholder="z.B. Wie motiviere ich mein Kind zum Lernen?"
                    required
            >
        </div>

        <div class="form-group">
            <label for="description">Kurzbeschreibung *</label>
            <textarea
                    id="description"
                    bind:value={description}
                    placeholder="Kurze Zusammenfassung des Tipps (wird in der Übersicht angezeigt)..."
                    rows="3"
                    required
            ></textarea>
        </div>

        <div class="form-group">
            <label for="content">Inhalt *</label>
            <textarea
                    id="content"
                    bind:value={content}
                    placeholder="Ausführlicher Inhalt des pädagogischen Tipps...&#10;&#10;Zeilenumbrüche werden automatisch übernommen."
                    rows="12"
                    required
            ></textarea>
        </div>

        <button type="submit" disabled={uploading}>
            {#if uploading}
                ⏳ Wird gespeichert...
            {:else}
                ✅ Tipp hinzufügen
            {/if}
        </button>
    </form>

    {#if message}
        <div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
            {message}
        </div>
    {/if}

    <a href="/pedagogy_page_id10" class="back-link">← Zurück zur Übersicht</a>
</div>

<style>
    .container {
        max-width: 800px;
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
    textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        box-sizing: border-box;
        font-family: inherit;
    }

    textarea {
        resize: vertical;
        line-height: 1.6;
    }

    textarea#description {
        min-height: 80px;
    }

    textarea#content {
        min-height: 250px;
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
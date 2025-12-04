<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let { data } = $props();

    let { supabase, session } = data;

    let title = '';
    let content = '';
    let eventDate = '';
    let eventTime = '';
    let selectedClassId = null;
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

    async function handleSubmit() {
        try {
            uploading = true;
            message = '';

            // Validierung
            if (!title || !content || !eventDate || !eventTime) {
                message = 'Bitte fülle alle Pflichtfelder aus!';
                uploading = false;
                return;
            }

            // Kombiniere Datum und Uhrzeit
            const fullDateTime = `${eventDate}T${eventTime}:00`;

            // Füge Eintrag in Datenbank ein
            const { error: insertError } = await supabase
                .from('appointments')
                .insert({
                    title: title,
                    content: content,
                    event_date: fullDateTime,
                    classid: selectedClassId || null
                });

            if (insertError) throw insertError;

            message = '✅ Termin erfolgreich hinzugefügt!';

            // Warte kurz und leite zur Übersicht
            setTimeout(() => {
                goto('/appointments_page_id8');
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
    <h1>📅 Neuen Termin hinzufügen</h1>

    <form on:submit|preventDefault={handleSubmit}>
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

        <div class="form-group">
            <label for="classId">Klasse (optional)</label>
            <select id="classId" bind:value={selectedClassId}>
                <option value={null}>-- Allgemein (für alle) --</option>
                {#each classes as cls}
                    <option value={cls.id}>{cls.name}</option>
                {/each}
            </select>
        </div>

        <button type="submit" disabled={uploading}>
            {#if uploading}
                ⏳ Wird erstellt...
            {:else}
                ✅ Termin hinzufügen
            {/if}
        </button>
    </form>

    {#if message}
        <div class="message" class:success={message.includes('✅')} class:error={message.includes('❌')}>
            {message}
        </div>
    {/if}

    <a href="/appointments_page_id8" class="back-link">← Zurück zur Übersicht</a>
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

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
    }

    label {
        display: block;
        font-weight: bold;
        margin-bottom: 8px;
        color: #555;
    }

    input[type="text"],
    input[type="date"],
    input[type="time"],
    select,
    textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 16px;
        box-sizing: border-box;
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

    @media (max-width: 600px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
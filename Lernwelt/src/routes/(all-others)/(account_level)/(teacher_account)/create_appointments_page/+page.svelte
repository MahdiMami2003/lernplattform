<!--Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/create_appointments_page/+page.svelte-->
<script>
    import { goto } from '$app/navigation';

    let { data } = $props();

    let { supabase, session } = data;

    let title = '';
    let content = '';
    let eventDate = '';
    let eventTime = '';
    let uploading = false;
    let message = '';

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
                    event_date: fullDateTime
                });

            if (insertError) throw insertError;

            message = '✅ Termin erfolgreich hinzugefügt!';

            // Sofortige Weiterleitung zur Übersicht
            goto('/appointments_page_id8');

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
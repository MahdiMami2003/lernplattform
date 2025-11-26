<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient.js';

    let appointments = [];
    let loading = true;
    let errorMessage = '';

    // Helper: Uhrzeit formatieren
    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    }

    // Helper: Monat (kurz)
    function getMonth(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('de-DE', { month: 'short' }).toUpperCase();
    }

    // Helper: Tag
    function getDay(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit' });
    }

    onMount(async () => {
        try {
            const { data, error } = await supabase
                .from('appointments_and_Currents')
                .select(`
                    id,
                    event_date,
                    title,
                    classid,
                    classes ( name )
                `)
                .order('event_date', { ascending: true });

            if (error) throw error;
            appointments = data;

        } catch (error) {
            errorMessage = 'Konnte Daten nicht laden: ' + error.message;
            console.error(error);
        } finally {
            loading = false;
        }
    });
</script>

<div class="content-wrapper">
    <div class="header-box">
        <h1>Aktuelles & Termine</h1>
        <p>Alle wichtigen Ereignisse der HSG-Lernwelt.</p>
    </div>

    {#if loading}
        <div class="status-msg">
            <span class="spinner">⏳</span> Lade Termine...
        </div>
    {:else if errorMessage}
        <div class="status-msg error">⚠️ {errorMessage}</div>
    {:else if appointments.length === 0}
        <div class="empty-state">
            <p>Aktuell stehen keine neuen Termine an.</p>
        </div>
    {:else}
        <div class="events-grid">
            {#each appointments as item}
                <div class="event-card">

                    <div class="date-badge">
                        <span class="day">{getDay(item.event_date)}</span>
                        <span class="month">{getMonth(item.event_date)}</span>
                    </div>

                    <div class="card-content">
                        <h3>{item.title || 'Ohne Titel'}</h3>

                        <div class="meta-info">
                            <span class="info-item time">
                                🕒 {formatTime(item.event_date)}
                            </span>

                            {#if item.classid && item.classes}
                                <span class="tag class-tag">
                                    Klasse {item.classes.name}
                                </span>
                            {:else}
                                <span class="tag global-tag">
                                    Allgemein
                                </span>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Wir brauchen hier keinen Page-Container mit Background mehr,
       da dein Layout (.main_container) das schon macht.
       Wir nutzen 100% Breite des verfügbaren Platzes.
    */
    .content-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    /* --- Header (Gold/Gelb) --- */
    .header-box {
        background-color: #f3be6a;
        color: #236C93;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        /* Leichter Schatten passend zu deinem Layout Stil */
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-box h1 {
        margin: 0;
        font-size: 2rem; /* Passt sich gut in den Container ein */
        color: #fff;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.15);
    }

    .header-box p {
        color: #fff;
        font-weight: 600;
        margin-top: 0.5rem;
        font-size: 1rem;
    }

    /* --- Grid Layout --- */
    .events-grid {
        display: grid;
        /* Automatisch anpassen: 1 Spalte auf Handy, 2 auf Tablets/Desktop, wenn Platz da ist */
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    /* --- Karte --- */
    .event-card {
        background: #f9f9f9; /* Leicht abgesetzt vom weißen Main-Container Hintergrund */
        border: 1px solid #eee;
        border-radius: 10px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .event-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(35, 108, 147, 0.15);
        border-color: #f3be6a;
        background: #fff;
    }

    /* --- Datums Badge --- */
    .date-badge {
        background-color: #236C93;
        color: white;
        border-radius: 8px;
        width: 60px;
        height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
    }
    .date-badge .day { font-size: 1.4rem; font-weight: 800; line-height: 1; }
    .date-badge .month { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; }

    /* --- Inhalt --- */
    .card-content {
        flex: 1;
        min-width: 0; /* Verhindert Layout-Break bei langem Text */
    }

    h3 {
        margin: 0 0 0.4rem 0;
        color: #333;
        font-size: 1.15rem;
        line-height: 1.3;
    }

    .meta-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
        color: #666;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* --- Tags --- */
    .tag {
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .global-tag { background-color: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
    .class-tag { background-color: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }

    /* --- Messages --- */
    .status-msg { text-align: center; color: #555; padding: 2rem; font-weight: bold;}
    .error { color: #d32f2f; }
    .empty-state { text-align: center; color: #888; font-style: italic; padding: 2rem; }

    /* Mobile Optimierung für dein Grid */
    @media (max-width: 500px) {
        .event-card {
            flex-direction: column;
            align-items: flex-start;
        }
        .date-badge {
            width: 100%;
            height: 40px;
            flex-direction: row;
            gap: 0.5rem;
        }
        .date-badge .month { margin-top: 2px; }
    }
</style>
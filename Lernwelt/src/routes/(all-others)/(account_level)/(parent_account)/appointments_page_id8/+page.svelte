<script>
    import { onMount } from 'svelte';

    let { data } = $props();

    let { supabase, session } = data;

    /** @type {string | null} */
    let userRole = null;

    onMount(async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                userRole = profile.role;
            }
        }
    });

    async function getAppointments() {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('event_date', { ascending: true });

        if (error) {
            console.error('Fehler:', error);
            return [];
        }

        return data || [];
    }

    /**
     * @param {number} id
     */
    async function deleteAppointment(id) {
        if (!confirm('Wirklich löschen?')) return;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Fehler beim Löschen!');
            console.error(error);
        } else {
            window.location.reload();
        }
    }

    /**
     * @param {string} dateString
     */
    function formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' Uhr';
    }
</script>

<div id="placeholder">
    <div class="header">
        <h1>Neuigkeiten & Termine</h1>
        {#if userRole === 'admin' || userRole === 'teacher'}
            <a href="/create_appointments_page" class="add-button">➕ Neuen Termin hinzufügen</a>
        {/if}
    </div>

    {#await getAppointments()}
        <p>Lade Termine...</p>
    {:then appointments}
        {#if appointments && appointments.length > 0}
            <div class="appointments-list">
                {#each appointments as appointment}
                    <div class="appointment-card">
                        <div class="card-header">
                            <div class="header-content">
                                <h2>{appointment.title}</h2>
                                <span class="date-badge">{formatDateTime(appointment.event_date)}</span>
                            </div>
                            <button class="delete-btn" on:click={() => deleteAppointment(appointment.id)}>
                                🗑️ Löschen
                            </button>
                        </div>
                        <div class="card-body">
                            <p>{appointment.content || '-'}</p>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Button NACH der Liste, nicht in der Schleife -->
            <a href="/create_appointments_page" class="bottom-btn">➕ Neuen Termin hinzufügen</a>

        {:else}
            <p class="empty-message">Aktuell stehen keine Termine an.</p>
        {/if}
    {:catch error}
        <p style="color: red;">Fehler beim Laden</p>
    {/await}
</div>

<style>
    #placeholder {
        margin: 0;
        padding: 20px;
        min-height: 100vh;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    h1 {
        color: #333;
        margin: 0;
        font-size: 2rem;
    }

    .add-button {
        background: #548db9;
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        transition: background 0.3s ease;
    }

    .add-button:hover {
        background: #66a5e5;
    }

    .appointments-list {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .appointment-card {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }

    .card-header {
        background: rgba(201, 120, 12, 0.59);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-content {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
    }

    h2 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
    }

    .date-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: 500;
        white-space: nowrap;
    }

    .delete-btn {
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: 15px;
    }

    .delete-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .card-body {
        background: #F5F5DC;
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-top: none;
    }

    .card-body p {
        margin: 0;
        color: #333;
        line-height: 1.6;
    }

    .bottom-btn {
        display: block;
        margin-top: 20px;
        padding: 15px;
        background: rgba(52, 85, 108, 0.71);
        color: white;
        text-align: center;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        transition: background 0.3s ease;
    }

    .bottom-btn:hover {
        background: #3d7bb8;
    }

    .empty-message {
        text-align: center;
        color: #999;
        font-style: italic;
        padding: 40px;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
        }

        .add-button {
            text-align: center;
        }

        .header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
        }

        .card-header {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
        }

        .delete-btn {
            margin-left: 0;
            width: 100%;
        }

        .date-badge {
            align-self: flex-start;
        }
    }
</style>
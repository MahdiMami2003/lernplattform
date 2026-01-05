<!--Lernwelt/src/routes/(all-others)/(account_level)/(parent_account)/appointments_page_id8/+page.svelte-->
<script>
    import { onMount } from 'svelte';
    import { locale } from '$lib/i18n/config.ts';
    import { _ } from '$lib/i18n/config.ts';
    let { data } = $props();

    let { supabase, session } = data;

    let userRole = $state(null);
    let editingRight = $state(null);

    onMount(async () => {
        // Hole den eingeloggten User
        const { data: userData, error } = await supabase.auth.getUser();

        if (error || !userData?.user) {
            console.error("Fehler beim Holen des Users:", error);
            return;
        }

        // Hole Profil aus DB (mit editing_right)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, editing_right')
            .eq('id', userData.user.id)
            .single();

        if (profileError) {
            console.error("Fehler beim Holen des Profils:", profileError);
            return;
        } else {
            console.log("Gefundenes Profil:", profile);
            userRole = profile.role;
            editingRight = profile.editing_right;
            console.log("User Role:", userRole, "Editing Right:", editingRight);
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

    /**
     * Prüft ob User Bearbeitungsrechte hat
     */
    function hasEditingRights() {
        return (userRole === 'admin' || userRole === 'teacher') && editingRight === true;
    }

    function getTitle(item) {
        return $locale === 'en'
            ? item.title_en || item.title
            : item.title;
    }

    function getContent(item) {
        return $locale === 'en'
            ? item.content_en || item.content
            : item.content;
    }
</script>

<div id="placeholder" class="main_container">
    <div class="header">
        <h1>{$_('appointment.title')}</h1>
        {#if hasEditingRights()}
            <a href="/create_appointments_page" class="add-button">➕ {$_('appointment.add')}</a>
        {/if}
    </div>

    {#await getAppointments()}
        <p class="loading">{$_('appointment.loading')}</p>
    {:then appointments}
        {#if appointments && appointments.length > 0}
            <div class="appointments-list">
                {#each appointments as appointment}
                    <div class="appointment-card">
                        <div class="card-header">
                            <div class="header-content">
                                <h2>{getTitle(appointment)}</h2>
                                <span class="date-badge">{formatDateTime(appointment.event_date)}</span>
                            </div>
                            {#if hasEditingRights()}
                                <button class="delete-btn" on:click={() => deleteAppointment(appointment.id)}>
                                    🗑️ Löschen
                                </button>
                            {/if}
                        </div>
                        <div class="card-body">
                            <p>{getContent(appointment) || '-'}</p>
                        </div>
                    </div>
                {/each}
            </div>

        {:else}
            <p class="empty-message">{$_('appointment.empty')}</p>
        {/if}
    {:catch error}
        <p class="error-message">Fehler beim Laden</p>
    {/await}
</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #placeholder {
        margin: 0;
        padding: 20px;
        min-height: 100vh;
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ HEADER ============ */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 1rem;
    }

    h1 {
        color: var(--text-primary);
        margin: 0;
        font-size: 2rem;
        transition: color 0.3s ease;
    }

    .add-button {
        background: var(--button-bg);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s ease;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--button-border);
    }

    .add-button:hover {
        background: var(--button-hover);
        transform: translateY(-2px);
    }

    .add-button:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ APPOINTMENTS LIST ============ */
    .appointments-list {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .appointment-card {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
    }

    .appointment-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }

    /* ============ CARD HEADER ============ */
    .card-header {
        background: var(--border-accent);
        color: var(--text-primary);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.3s ease;
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
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    .date-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.9rem;
        font-weight: 500;
        white-space: nowrap;
        backdrop-filter: blur(10px);
    }

    /* ============ DELETE BUTTON ============ */
    .delete-btn {
        padding: 8px 14px;
        background: var(--delete-btn);
        color: white;
        border: 1px solid transparent;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        margin-left: 15px;
        min-height: 44px;
        min-width: 44px;
    }

    .delete-btn:hover {
        background: var(--delete-hover);
        transform: translateY(-2px);
    }

    .delete-btn:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    /* ============ CARD BODY ============ */
    .card-body {
        background: var(--bg-card);
        padding: 20px;
        border: 1px solid var(--border-color);
        border-top: none;
        transition: background-color 0.3s ease;
    }

    .card-body p {
        margin: 0;
        color: var(--text-primary);
        line-height: 1.6;
        transition: color 0.3s ease;
    }

    /* ============ BOTTOM BUTTON ============ */
    .bottom-btn {
        display: block;
        margin-top: 20px;
        padding: 15px;
        background: var(--button-bg);
        color: var(--text-primary);
        text-align: center;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        border: 1px solid var(--button-border);
        min-height: 44px;
    }

    .bottom-btn:hover {
        background: var(--button-hover);
        transform: translateY(-2px);
    }

    .bottom-btn:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ MESSAGES ============ */
    .loading,
    .empty-message {
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 40px;
        transition: color 0.3s ease;
    }

    .error-message {
        color: var(--error-color);
        text-align: center;
        padding: 40px;
        transition: color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        #placeholder {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
        }

        .add-button {
            text-align: center;
            justify-content: center;
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

        h1 {
            font-size: 1.5rem;
        }

        h2 {
            font-size: 1.1rem;
        }
    }
</style>
<script>
    import { onMount } from 'svelte';

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

    async function getTips() {
        let query = supabase
            .from('pedagogic_tips')
            .select('*')
            .order('created_at', { ascending: false });

        let {data: tips, error} = await query;

        if (error) {
            console.error('Fehler:', error);
            return [];
        }

        return tips || [];
    }

    /**
     * @param {number} id
     */
    async function deleteTip(id) {
        if (!confirm('Wirklich löschen?')) return;

        const { error } = await supabase
            .from('pedagogic_tips')
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
     * Prüft ob User Bearbeitungsrechte hat
     */
    function hasEditingRights() {
        return (userRole === 'admin' || userRole === 'teacher') && editingRight === true;
    }
</script>

<div id="placeholder">
    <div class="header">
        <h1>Pädagogische Tipps</h1>
        {#if hasEditingRights()}
            <a href="/pedagogic_form" class="add-button">➕ Neuen Tipp hinzufügen</a>
        {/if}
    </div>

    {#await getTips()}
        <p class="loading">Lade Tipps...</p>
    {:then tips}
        {#if tips && tips.length > 0}
            <ul class="tips-list">
                {#each tips as tip}
                    <li class="tip-item">
                        <a href="/pedagogic_content/{tip.id}" class="tip-link">
                            <div class="tip-title">{tip.title}</div>
                            {#if tip.description}
                                <div class="tip-preview">{tip.description}</div>
                            {/if}
                        </a>

                        {#if hasEditingRights()}
                            <button class="delete-btn" on:click={() => deleteTip(tip.id)}>
                                🗑️ Löschen
                            </button>
                        {/if}
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="no-tips">Aktuell sind keine pädagogischen Tipps verfügbar.</p>
        {/if}
    {:catch error}
        <p class="error">Fehler beim Laden: {error.message}</p>
    {/await}
</div>

<style>
    #placeholder {
        margin: 0;
        padding: 2rem;
        min-height: 100vh;
        font-family: "Inter", Arial, Helvetica, sans-serif;
        background-color: #fafafa;
    }

    /* ---- Header & Titel ---- */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    h1 {
        color: #0f2940;
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 2.5rem);
        font-weight: 700;
    }

    .add-button {
        background-color: #f3b06a;
        color: #000;
        padding: 0.65rem 1.3rem;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        border: 1px solid #e2a85a;
        transition: background-color 0.2s, transform 0.15s;
        cursor: pointer;
        white-space: nowrap;
    }

    .add-button:hover {
        background-color: #efc48b;
        transform: translateY(-2px);
    }

    /* ---- Tips List ---- */
    .tips-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .tip-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .tip-link {
        flex: 1;
        min-width: 250px;
        display: block;
        padding: 1rem 1.2rem;
        background-color: #fbead7;
        border-left: 4px solid #f3b06a;
        border-radius: 0.8rem;
        text-decoration: none;
        color: #0f2940;
        transition: all 0.2s ease;
        border: 1px solid #ffeed8;
        box-shadow: 0 2px 6px rgba(15, 41, 64, 0.08);
    }

    .tip-link:hover {
        background-color: #f5d4b3;
        border-left-color: #d89c48;
        transform: translateX(4px);
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
    }

    .tip-title {
        font-weight: 600;
        font-size: 1.1em;
        margin-bottom: 0.3rem;
    }

    .tip-preview {
        font-size: 0.9em;
        color: #666;
        line-height: 1.4;
    }

    /* ---- Delete Button ---- */
    .delete-btn {
        padding: 0.5rem 0.9rem;
        background-color: #ff6b6b;
        color: white;
        border: none;
        border-radius: 0.6rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .delete-btn:hover {
        background-color: #ff5252;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
    }

    /* ---- Messages ---- */
    .loading, .no-tips {
        text-align: center;
        color: #666;
        font-size: 1.1rem;
        padding: 2rem;
    }

    .error {
        color: #ff6b6b;
        text-align: center;
        padding: 1.5rem;
        background-color: #ffe5e5;
        border-radius: 0.8rem;
        border-left: 4px solid #ff6b6b;
    }

    /* ---- Responsive ---- */
    @media (max-width: 600px) {
        .tip-item {
            flex-direction: column;
            align-items: flex-start;
        }

        .delete-btn {
            align-self: flex-end;
            margin-right: 0;
        }
    }
</style>
<script>
    import { onMount } from 'svelte';

    import {locale} from "svelte-i18n";
    import { _ } from 'svelte-i18n';
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

    function getTitle(tip) {
        return $locale === 'en'
            ? tip.title_en || tip.title
            : tip.title;
    }

    function getDescription(tip) {
        return $locale === 'en'
            ? tip.description_en || tip.description
            : tip.description;
    }

    function getContent(tip) {
        return $locale === 'en'
            ? tip.content_en || tip.content
            : tip.content;
    }
</script>

<div id="placeholder" class="main_container">
    <div class="header">
        <h1>{$_('parent.sections.tips_title')}</h1>
        {#if hasEditingRights()}
            <a href="/pedagogic_form" class="add-button">➕ {$_('pedagogy.add')}</a>
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
                            <div class="tip-title">{getTitle(tip)}</div>
                            {#if tip.description}
                                <div class="tip-preview">{getDescription(tip)}</div>
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
        <p class="error">{$_('pedagogy.errors.load_error_title')}: {error.message}</p>
    {/await}
</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #placeholder {
        margin: 0;
        padding: 2rem;
        min-height: 100vh;
        font-family: "Inter", Arial, Helvetica, sans-serif;
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ HEADER & TITEL ============ */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    h1 {
        color: var(--text-primary);
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 2.5rem);
        font-weight: 700;
        transition: color 0.3s ease;
    }

    .add-button {
        background-color: var(--button-bg);
        color: var(--text-primary);
        padding: 0.65rem 1.3rem;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        border: 1px solid var(--button-border);
        transition: all 0.2s ease;
        cursor: pointer;
        white-space: nowrap;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
    }

    .add-button:hover {
        background-color: var(--button-hover);
        transform: translateY(-2px);
    }

    .add-button:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    /* ============ TIPS LIST ============ */
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
        background-color: var(--bg-card);
        border-left: 4px solid var(--border-accent);
        border-radius: 0.8rem;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.2s ease;
        border: 1px solid var(--border-color);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        min-height: 44px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .tip-link:hover {
        background-color: var(--bg-hover);
        border-left-color: var(--border-accent);
        transform: translateX(4px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .tip-link:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    .tip-title {
        font-weight: 600;
        font-size: 1.1em;
        margin-bottom: 0.3rem;
        color: var(--text-primary);
        transition: color 0.3s ease;
    }

    .tip-preview {
        font-size: 0.9em;
        color: var(--text-secondary);
        line-height: 1.4;
        transition: color 0.3s ease;
    }

    /* ============ DELETE BUTTON ============ */
    .delete-btn {
        padding: 0.5rem 0.9rem;
        background-color: var(--delete-btn);
        color: white;
        border: none;
        border-radius: 0.6rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s ease;
        white-space: nowrap;
        min-height: 44px;
        min-width: 44px;
    }

    .delete-btn:hover {
        background-color: var(--delete-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
    }

    .delete-btn:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
    }

    /* ============ MESSAGES ============ */
    .loading,
    .no-tips {
        text-align: center;
        color: var(--text-muted);
        font-size: 1.1rem;
        padding: 2rem;
        transition: color 0.3s ease;
    }

    .error {
        color: var(--error-color);
        text-align: center;
        padding: 1.5rem;
        background-color: var(--bg-card);
        border-radius: 0.8rem;
        border-left: 4px solid var(--error-color);
        transition: all 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 600px) {
        #placeholder {
            padding: 1rem;
        }

        .tip-item {
            flex-direction: column;
            align-items: flex-start;
        }

        .delete-btn {
            align-self: flex-end;
            margin-right: 0;
        }

        .tip-link {
            min-width: 100%;
        }

        h1 {
            font-size: 1.5rem;
        }
    }
</style>
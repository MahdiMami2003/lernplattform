<script>
    import { page } from '$app/stores';

    import {locale} from "svelte-i18n";
    import { _ } from 'svelte-i18n';
    let { data } = $props();

    let { supabase, session } = data;

    /**
     * @returns {Promise<any>}
     */
    async function getTip() {
        const tipId = $page.params.id;

        if (!tipId) {
            return null;
        }

        const { data, error } = await supabase
            .from('pedagogic_tips')
            .select('*')
            .eq('id', tipId)
            .single();

        if (error) {
            console.error('Fehler beim Laden:', error);
            return null;
        }

        return data;
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

<div id="content-container" class="main_container">
    {#await getTip()}
        <p class="loading">Lade Tipp...</p>
    {:then tip}
        {#if tip}
            <div class="tip-detail">
                <h1>{getTitle(tip)}</h1>

                {#if tip.description}
                    <p class="description-text">{@html getDescription(tip).replace(/\n/g, '<br>')}</p>
                    <hr class="divider">
                {/if}

                {#if tip.content}
                    <div class="content-text">{@html getContent(tip).replace(/\n/g, '<br>')}</div>
                {:else}
                    <p class="no-content">Kein Inhalt verfügbar</p>
                {/if}

                <a href="/pedagogy_page_id10" class="back-link">← {$_('pedagogy.errors.back_link')}</a>
            </div>
        {:else}
            <div class="error">
                <h1>{$_('pedagogy.errors.not_found_title')}</h1>
                <p>{$_('pedagogy.errors.not_found_text')}</p>
                <a href="/pedagogy_page_id10">
                    {$_('pedagogy.errors.back_link')}
                </a>
            </div>
        {/if}
    {:catch error}
        <div class="error">
            <h1>{$_('pedagogy.errors.load_error_title')}</h1>
            <p>{$_('pedagogy.errors.load_error_text')}</p>
            <a href="/pedagogy_page_id10">
                {$_('pedagogy.errors.back_link')}
            </a>
        </div>
    {/await}
</div>

<style>
    /* ============ MAIN CONTAINER ============ */
    #content-container {
        margin: 0;
        padding: 40px 20px;
        max-width: 900px;
        margin: 0 auto;
        min-height: 100vh;
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ TIP DETAIL ============ */
    .tip-detail {
        background-color: var(--bg-card);
        padding: 2rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
    }

    .tip-detail h1 {
        font-size: 2.5em;
        color: var(--text-primary);
        margin-bottom: 30px;
        text-align: center;
        transition: color 0.3s ease;
    }

    /* ============ DESCRIPTION TEXT ============ */
    .description-text {
        color: var(--text-secondary);
        line-height: 1.8;
        margin: 0 0 25px 0;
        font-size: 1.25em;
        text-align: center;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
        font-weight: 500;
        transition: color 0.3s ease;
    }

    /* ============ DIVIDER ============ */
    .divider {
        border: none;
        border-top: 2px solid var(--border-color);
        margin: 30px auto 30px auto;
        max-width: 80%;
        transition: border-color 0.3s ease;
    }

    /* ============ CONTENT TEXT ============ */
    .content-text {
        color: var(--text-primary);
        line-height: 1.9;
        font-size: 1.05em;
        max-width: 900px;
        margin: 0 auto 30px auto;
        transition: color 0.3s ease;
    }

    /* ============ BACK LINK ============ */
    .back-link {
        display: inline-block;
        margin-top: 25px;
        color: var(--button-bg);
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1em;
        transition: color 0.2s ease;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
    }

    .back-link:hover {
        text-decoration: underline;
        color: var(--button-hover);
        background-color: var(--bg-hover);
    }

    .back-link:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
    }

    /* ============ MESSAGES ============ */
    .loading,
    .no-content {
        text-align: center;
        color: var(--text-muted);
        font-size: 1.1rem;
        padding: 2rem;
        transition: color 0.3s ease;
    }

    /* ============ ERROR STATE ============ */
    .error {
        text-align: center;
        padding: 50px 20px;
        background-color: var(--bg-card);
        border-radius: 1rem;
        border: 2px solid var(--error-color);
        margin: 2rem auto;
        max-width: 600px;
        transition: all 0.3s ease;
    }

    .error h1 {
        color: var(--error-color);
        margin-bottom: 1rem;
        transition: color 0.3s ease;
    }

    .error p {
        color: var(--text-secondary);
        margin-bottom: 1.5rem;
        transition: color 0.3s ease;
    }

    .error a {
        display: inline-block;
        margin-top: 20px;
        color: var(--button-bg);
        text-decoration: none;
        font-weight: bold;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        background-color: var(--bg-hover);
        transition: all 0.2s ease;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
    }

    .error a:hover {
        text-decoration: underline;
        background-color: var(--button-bg);
        color: var(--text-primary);
    }

    .error a:focus-visible {
        outline: 2px solid var(--button-bg);
        outline-offset: 2px;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 768px) {
        #content-container {
            padding: 20px 15px;
        }

        .tip-detail {
            padding: 1.5rem;
        }

        .tip-detail h1 {
            font-size: 1.8em;
        }

        .description-text {
            font-size: 1.1em;
        }

        .content-text {
            font-size: 1em;
        }

        .back-link {
            font-size: 1em;
        }

        .error {
            padding: 30px 15px;
            margin: 1rem;
        }
    }

    /* ============ PRINT STYLES ============ */
    @media print {
        .back-link {
            display: none;
        }

        .tip-detail {
            border: none;
            box-shadow: none;
        }
    }
</style>
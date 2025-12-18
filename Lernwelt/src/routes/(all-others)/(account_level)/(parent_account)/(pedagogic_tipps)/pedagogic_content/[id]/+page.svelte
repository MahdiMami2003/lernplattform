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

<div id="content-container">
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
    #content-container {
        margin: 0;
        padding: 40px 20px;
        max-width: 900px;
        margin: 0 auto;
        min-height: 100vh;
    }

    .tip-detail h1 {
        font-size: 2.5em;
        color: #333;
        margin-bottom: 30px;
        text-align: center;
    }

    .description-text {
        color: #555;
        line-height: 1.8;
        margin: 0 0 25px 0;
        font-size: 1.25em;
        text-align: center;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
        font-weight: 500;
    }

    .divider {
        border: none;
        border-top: 2px solid #ddd;
        margin: 30px auto 30px auto;
        max-width: 80%;
    }

    .content-text {
        color: #333;
        line-height: 1.9;
        font-size: 1.05em;
        max-width: 900px;
        margin: 0 auto 30px auto;
    }

    .back-link {
        display: inline-block;
        margin-top: 25px;
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1em;
    }

    .back-link:hover {
        text-decoration: underline;
    }

    .loading, .no-content {
        text-align: center;
        color: #666;
        font-size: 1.1rem;
        padding: 2rem;
    }

    .error {
        text-align: center;
        padding: 50px 20px;
    }

    .error h1 {
        color: #f44336;
    }

    .error a {
        display: inline-block;
        margin-top: 20px;
        color: #4CAF50;
        text-decoration: none;
        font-weight: bold;
    }

    .error a:hover {
        text-decoration: underline;
    }
</style>
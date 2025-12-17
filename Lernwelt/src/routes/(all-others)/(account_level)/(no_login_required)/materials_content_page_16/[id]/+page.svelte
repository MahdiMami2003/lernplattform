<script>
    import { page } from '$app/stores';

    import {locale} from "svelte-i18n";
    import { _ } from 'svelte-i18n';
    let { data } = $props();

    let { supabase, session } = data;

    /**
     * @returns {Promise<any>}
     */
    async function getMaterial() {
        const materialId = $page.params.id;

        if (!materialId) {
            return null;
        }

        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('id', materialId)
            .single();

        if (error) {
            console.error('Fehler beim Laden:', error);
            return null;
        }

        return data;
    }

    /**
     * @param {string} url
     * @param {string} filename
     */
    async function downloadPDF(url, filename) {
        try {
            // Lade die PDF als Blob
            const response = await fetch(url);
            const blob = await response.blob();

            // Erstelle einen temporären Download-Link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;

            // Klicke automatisch
            document.body.appendChild(link);
            link.click();

            // Aufräumen
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download fehlgeschlagen:', error);
            alert('Download fehlgeschlagen. Bitte versuche es erneut.');
        }
    }
    function getTitle(material) {
        return $locale === 'en'
            ? material.title_en || material.title
            : material.title;
    }
    function getDescription(material) {
        return $locale === 'en'
            ? material.description_en || material.description
            : material.description;
    }
</script>

<div id="content-container">
    {#await getMaterial()}
        <p>{$_('materials.loading_m')}</p>
    {:then material}
        {#if material}
            <div class="material-detail">
                <h1>{getTitle(material)}</h1>

                {#if material.description}
                    <p class="description-text">{@html getDescription(material).replace(/\n/g, '<br>')}</p>
                {/if}

                {#if material.file_url}
                    <div class="pdf-section">
                        <iframe
                                src={material.file_url}
                                title="PDF Viewer"
                                class="pdf-viewer"
                        ></iframe>

                        <!-- Download Button mit JavaScript -->
                        <button
                                class="download-btn"
                                on:click={() => downloadPDF(material.file_url, `${material.title}.pdf`)}
                        >
                            📥 {$_('materials.download_pdf')}
                        </button>
                    </div>
                {:else}
                    <p class="no-pdf">{$_('materials.no_pdf')}</p>
                {/if}

                <a href="/material_page_id14" class="back-link">← {$_('pedagogy.errors.back_link')}</a>
            </div>
        {:else}
            <div class="error">
                <h1>{$_('materials.not_found_title')}</h1>
                <p>{$_('materials.not_found_texte')}</p>
                <a href="/material_page_id14">← {$_('pedagogy.errors.back_link')}</a>
            </div>
        {/if}
    {:catch error}
        <div class="error">
            <h1>{$_('materials.load_error')}</h1>
            <p>{$_('materials.load_error')}</p>
            <a href="/material_page_id14">← {$_('pedagogy.errors.back_link')}</a>
        </div>
    {/await}
</div>

<style>
    #content-container {
        margin: 0;
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
        min-height: 100vh;
    }

    .material-detail h1 {
        font-size: 2.5em;
        color: #333;
        margin-bottom: 30px;
        text-align: center;
    }

    .description-text {
        color: #333;
        line-height: 1.8;
        margin: 0 0 30px 0;
        font-size: 1.1em;
        text-align: center;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
    }

    .pdf-section {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .pdf-viewer {
        width: 100%;
        height: 85vh;
        border: 2px solid #ddd;
        border-radius: 8px;
    }

    .download-btn {
        display: inline-block;
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        border: none;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
        transition: background 0.3s ease;
        cursor: pointer;
    }

    .download-btn:hover {
        background: #45a049;
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

    .no-pdf {
        text-align: center;
        color: #999;
        font-style: italic;
        margin-top: 50px;
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
<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { page } from '$app/stores';

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
</script>

<div id="content-container">
    {#await getMaterial()}
        <p>Lade Material...</p>
    {:then material}
        {#if material}
            <div class="material-detail">
                <h1>{material.title}</h1>

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
                            PDF herunterladen
                        </button>
                    </div>
                {:else}
                    <p class="no-pdf">Kein PDF verfügbar</p>
                {/if}
            </div>
        {:else}
            <div class="error">
                <h1>Material nicht gefunden</h1>
                <p>Die angeforderte Material-ID existiert nicht.</p>
                <a href="/materials_page_id14">← Zurück zur Übersicht</a>
            </div>
        {/if}
    {:catch error}
        <div class="error">
            <h1>Fehler beim Laden</h1>
            <p>Es gab ein Problem beim Laden des Materials.</p>
            <a href="/materials_page_id14">← Zurück zur Übersicht</a>
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
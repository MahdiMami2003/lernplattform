<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { global_material_id } from "$lib/state.svelte.js";

    /**
     * @returns {Promise<any>}
     */
    async function getMaterial() {
        if (!global_material_id.aktuelleID) {
            return null;
        }

        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('id', global_material_id.aktuelleID)
            .single();

        if (error) {
            console.error('Fehler beim Laden:', error);
            return null;
        }

        return data;
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
    }

    .pdf-viewer {
        width: 100%;
        height: 85vh;
        border: 2px solid #ddd;
        border-radius: 8px;
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
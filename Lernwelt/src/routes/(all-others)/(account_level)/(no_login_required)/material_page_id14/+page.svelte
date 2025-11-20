//materials_page_id14\+page.svelte
<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { global_material_id } from '$lib/state.svelte.js';
    async function getMaterials() {
        let {data: learning_materials, error} = await supabase
            .from('learning_materials')
            .select('*')
            .order('subject', { ascending: true })

        if (error) {
            console.error('Fehler:', error);
            return [];
        }


        return learning_materials || [];
    }

    // Gruppiere Materialien nach Fach
    /**
     * @param {any[]} materials
     * @returns {Record<string, any[]>}
     */
    function groupBySubject(materials) {
        /** @type {Record<string, any[]>} */
        const grouped = {};

        materials.forEach(material => {
            if (!grouped[material.subject]) {
                grouped[material.subject] = [];
            }
            grouped[material.subject].push(material);
        });

        return grouped;
    }

    function set_material_id(id)
    {
        global_material_id.aktuelleID = id;
    }

</script>

<div id="placeholder">
    <h1>Übersicht Lerninhalte</h1>

    {#await getMaterials()}
        <p>Lade Materialien...</p>
    {:then materials}
        {#if materials && materials.length > 0}
            {@const groupedMaterials = groupBySubject(materials)}

            {#each Object.entries(groupedMaterials) as [subject, items]}
                <section class="subject-section">
                    <h2>{subject}</h2>
                    <ul>
                        {#each items as material}
                            <li>
                                <a href="/materials_content_page_id16" on:click={() => set_material_id(material.material_id)}>
                                    {material.title}
                                </a>
                            </li>
                        {/each}
                    </ul>
                </section>
            {/each}
        {:else}
            <p>Keine Materialien gefunden.</p>
        {/if}
    {:catch error}
        <p style="color: red;">Fehler beim Laden</p>
    {/await}
</div>

<style>
    div {
        margin: 0;
        padding: 20px;
        min-height: 100vh;
    }

    h1 {
        margin-bottom: 30px;
        color: #333;
    }

    .subject-section {
        margin-bottom: 40px;
    }

    .subject-section h2 {
        color: #4CAF50;
        border-bottom: 3px solid #4CAF50;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin-bottom: 10px;
    }

    a {
        display: block;
        padding: 15px 20px;
        background: #f5f5f5;
        border-left: 4px solid #4CAF50;
        border-radius: 5px;
        text-decoration: none;
        color: #333;
        transition: all 0.3s ease;
    }

    a:hover {
        background: #e8f5e9;
        border-left-color: #2E7D32;
        transform: translateX(5px);
    }
</style>
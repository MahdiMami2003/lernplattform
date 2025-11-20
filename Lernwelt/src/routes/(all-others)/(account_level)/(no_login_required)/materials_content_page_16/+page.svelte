//materials_content_page_id16\+page.svelte

<script>
    import { supabase } from '$lib/supabaseClient.js';
    import {global_material_id} from "$lib/state.svelte.js";

    /** @type {import('./$types').PageData} */
    export let data;

    const material = data.material;

</script>
    Id ist: {global_material_id.aktuelleID}

{#if material}
    <div class="material-detail">
        <h1>{material.title}</h1>
        <p>{material.content}</p>
    </div>
{:else}
    <div class="material-detail">
        <h1>Material nicht verfügbar</h1>
        <p>{data.error}</p>
    </div>
{/if}


<div id="placeholder">
    Lerninhalte Inhalt

</div>


<style>
    div{
        margin: 0;
        height: 200dvh;
    }
</style>
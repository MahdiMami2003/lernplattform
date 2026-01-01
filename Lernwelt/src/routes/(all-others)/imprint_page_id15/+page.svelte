<!--Lernwelt/src/routes/(all-others)/imprint_page_id15/+page.svelte-->
<script lang="ts">
    import { onMount } from 'svelte';



    // ✅ HINZUFÜGEN (Svelte 5):
    let { data } = $props();

    // Optional: Damit du nicht immer 'data.supabase' schreiben musst:
    let { supabase, session } = data;
    // Typen sauber definieren
    interface Klassenmitglied {
        full_name: string;
        classes: {
            name: string;
        }[]; // <-- Array, weil Supabase das so liefert!
    }


    let klassenmitglieder: Klassenmitglied[] = [];
    let fehlerMeldung: string | null = null;
    let isLoading = true;

    async function test({ classname = "Klasse 5a" }) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                full_name,
                classes!inner ( name )
            `)
            .eq('classes.name', classname);

        if (error) {
            fehlerMeldung = error.message;
        } else {
            klassenmitglieder = data ?? [];
        }
        isLoading = false;
    }

    onMount(() => {
        test({ classname: "Klasse 5a" });
    });
</script>


<div id="placeholder">

    <h2>Klassenmitglieder</h2>

    {#if isLoading}
        <p>Lade Daten...</p>

    {:else if fehlerMeldung}
        <p>Ein Fehler ist aufgetreten: {fehlerMeldung}</p>

    {:else if klassenmitglieder.length === 0}
        <p>Keine Mitglieder in dieser Klasse gefunden.</p>

    {:else}
        <ul>
            {#each klassenmitglieder as mitglied}
                <li>
                    <strong>{mitglied.classes.pop()}</strong>
                </li>
                <li>
                    <strong>{mitglied.full_name}</strong>
                </li>

            {/each}
        </ul>
    {/if}

</div>


<style>
    div{
        margin: 0;
        height: 200dvh;
    }
</style>
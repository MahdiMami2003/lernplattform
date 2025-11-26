<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';

    // --- NEU HINZUFÜGEN START ---
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { invalidate } from '$app/navigation';
    // --- NEU HINZUFÜGEN ENDE ---

    let { children } = $props();

    // --- NEU HINZUFÜGEN START ---
    onMount(() => {
        // Dieser "Wächter" läuft einmal beim Start der App.
        // Er prüft, ob im LocalStorage noch ein Login gespeichert ist.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

            // 'invalidate' sagt SvelteKit: "Der Auth-Status hat sich geändert,
            // bitte lade alle Daten neu, die davon abhängen."
            invalidate('supabase:auth');
        });

        return () => {
            subscription.unsubscribe();
        };
    });
    // --- NEU HINZUFÜGEN ENDE ---
</script>

<svelte:head>
    <meta charset="UTF-8">
    <title>HSGG-Lernwelt</title>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
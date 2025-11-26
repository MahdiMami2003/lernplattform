<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { invalidate } from '$app/navigation';

    let { children } = $props();

    onMount(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Optional: Du kannst hier auch auf spezifische Events reagieren
                // console.log('Auth event:', event, session);
                invalidate('supabase:auth');
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    });
</script>

<svelte:head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HSGG-Lernwelt</title>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
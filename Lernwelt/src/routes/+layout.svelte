<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { invalidate } from '$app/navigation';

    let { data, children } = $props();

    onMount(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
                if (_session?.expires_at !== data.session?.expires_at) {
                    invalidate('supabase:auth');
                }
            });

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
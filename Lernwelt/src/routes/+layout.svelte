<!--Lernwelt/src/routes/+layout.svelte-->
<script lang="ts">
	import '../app.css'; // ← Globale Dark Mode Styles
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { invalidate } from '$app/navigation';
	import { setupI18n, locale, _ } from '$lib/i18n/config';
	import { browser } from '$app/environment';

	let { data, children } = $props();

	function setLang(l: 'de' | 'en') {
		locale.set(l);
		if (browser) localStorage.setItem('lang', l);
	}

	// Initialize i18n ASAP
	setupI18n();

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, _session) => {
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
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>HSGG Lernwelt</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

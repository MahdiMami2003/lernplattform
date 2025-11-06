<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>
<svelte:head>
    <meta charset="UTF-8">
    <title>HSG-Lernwelt</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

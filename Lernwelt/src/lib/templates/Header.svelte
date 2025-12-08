<script lang="ts">
	import logo from '$lib/assets/icons/Logo.png';
	import login from '$lib/assets/icons/Login.png';
	import q_mark from '$lib/assets/icons/fragezeichen.png';
	import register from '$lib/assets/icons/register.png';
	import searchIcon from '$lib/assets/icons/search.png';
	import menu from '$lib/assets/icons/menu.png';

	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	let { data } = $props();

	// SIDEBAR STATES
	let testlogin = $state(false);
	let isMenuOpen = $state(false);
	let innerW = $state(0);
	let showMainSidebar = $state(true);

	// SEARCH STATE
	let searchOpen = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<any[]>([]);
	let searchInputRef = $state<HTMLInputElement>();

	function toggleSearch() {
		searchOpen = !searchOpen;
		if (!searchOpen) {
			searchQuery = '';
			searchResults = [];
		} else {
			// Focus on next tick
			setTimeout(() => searchInputRef?.focus(), 50);
		}
	}

	async function runSearch() {
		if (searchQuery.trim().length < 2) {
			searchResults = [];
			return;
		}

		const { data: rows, error } = await supabase
			.from('materials')
			.select('*')
			.or(
				`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,school_class.ilike.%${searchQuery}%`
			)
			.limit(10); // Limit results for performance

		if (!error) searchResults = rows ?? [];
	}

	function goToMaterial(id: number) {
		searchOpen = false;
		goto(`/materials_content_page_16/${id}`);
	}

	async function handleLogout() {
		const { error } = await data.supabase.auth.signOut();
		if (!error) goto('no_login_page_id7');
	}

	function going_dark(e: MouseEvent) {
		e.preventDefault();
		const main = document.querySelector('.main_container') as HTMLElement;
		if (main) main.classList.toggle('darkmode');
	}

	function toggle_slide_left(e?: MouseEvent) {
		if (e) e.preventDefault();
		showMainSidebar = !showMainSidebar;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
</script>

<nav class="header-root">
	<a style="text-decoration: none" href="/">
		<div class="signature">
			<img class="logo" src={logo} />
			<p>HSGG-Lernwelt</p>
		</div>
	</a>

	<!-- Only show user info if search is closed on small screens, or always on large -->
	{#if !searchOpen || innerW > 600}
		<div class="user-info">
			{#if data.session}
				<p>Hallo, {data.session.user.email}</p>
			{:else}
				<p>Du bist nicht eingeloggt.</p>
			{/if}
		</div>
	{/if}

	<div class="icon-container">
		<!-- Search Input Section -->
		<div class="search-wrapper {searchOpen ? 'active' : ''}">
			{#if searchOpen}
				<input
					bind:this={searchInputRef}
					type="text"
					placeholder="Suchen..."
					bind:value={searchQuery}
					on:input={runSearch}
				/>
			{/if}
			<button class="search" on:click={toggleSearch}>
				<img src={searchIcon} />
			</button>

			{#if searchOpen && searchResults.length > 0}
				<div class="search-dropdown">
					{#each searchResults as item (item.id)}
						<div class="search-item" on:click={() => goToMaterial(item.id)}>
							<strong>{item.title}</strong>
							<span class="search-meta">{item.subject}</span>
						</div>
					{/each}
					{#if searchResults.length === 0 && searchQuery.length > 1}
						<div class="search-item no-results">Keine Ergebnisse</div>
					{/if}
				</div>
			{/if}
		</div>

		<button class="q_mark"><img src={q_mark} /></button>

		{#if data.session}
			<button class="login" on:click={handleLogout}><img src={login} /></button>
		{:else}
			<a href="login_page_id2"><button class="login"><img src={login} /></button></a>
		{/if}

		<button class="menu" on:click={toggleMenu}><img src={menu} /></button>
	</div>
</nav>

<svelte:window bind:innerWidth={innerW} />

<style>
	:global(.main_container) {
		background-color: white;
		color: black;
		transition: background-color 0.5s;
	}
	:global(.main_container.darkmode) {
		background-color: #333333;
		color: white;
	}

	.header-root {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 1000;
		font-family: 'Inter', Arial, sans-serif;
		height: var(--header-height);
		background-color: #f0be71;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: space-between;
		--icon-size: calc(var(--header-height) * 0.6);
		padding: 0 1rem;
		box-sizing: border-box;
	}

	.signature {
		display: flex;
		flex-basis: auto;
		align-items: center;
		justify-content: start;
		gap: 0.5rem;
		padding-left: 0.5rem;
		font-size: calc(var(--header-height) * 0.6);
		font-weight: bold;
		color: black;
	}

	.logo {
		height: calc(var(--header-height) * 0.8);
		width: calc(var(--header-height) * 0.8);
	}

	.signature:hover {
		cursor: pointer;
	}

	.icon-container {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		justify-content: end;
	}

	.user-info {
		font-weight: bold;
		font-size: 1rem;
		color: black;
		text-align: center;
	}

	.menu {
		display: none;
	}

	.q_mark img {
		height: calc(var(--header-height) * 0.5);
		width: var(--icon-size);
		object-fit: contain;
	}

	.menu img,
	.login img,
	.search img {
		height: var(--icon-size);
		width: var(--icon-size);
		object-fit: contain;
	}

	button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.menu,
	.q_mark,
	.login,
	.search {
		padding-top: 1px;
		padding-left: 1rem;
		padding-right: 1rem;
		border: 3px outset #7c98bf;
		border-radius: 5px; /* Rectangular */
		background: #99becc;
		color: ghostwhite;
		transition:
			transform 0.1s ease,
			filter 0.3s ease;
	}

	.menu:hover,
	.q_mark:hover,
	.login:hover,
	.search:hover {
		transform: scale(1.1);
		filter: brightness(1.2);
		box-shadow: none;
	}

	.menu:active,
	.q_mark:active,
	.login:active,
	.search:active {
		transform: scale(0.9);
	}

	/* Search Wrapper */
	.search-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: transparent;
		border-radius: 5px; /* Rectangular */
		transition: all 0.3s ease;
	}

	.search-wrapper.active {
		background: white;
		padding-left: 0.8rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.search-wrapper input {
		border: none;
		outline: none;
		background: transparent;
		width: 15rem; /* Expanded width */
		font-size: 1rem;
		color: #333;
	}

	.search-wrapper .search {
		background: transparent;
		box-shadow: none;
		padding: 0.4rem;
		margin-left: 0.2rem;
	}
	.search-wrapper .search img {
		filter: invert(0.4); /* Make icon dark when usually white, if needed, or adjust */
	}
	/* If the icons are colored/png, we might not need filter. */
	/* Assuming existing buttons had specific style. Re-applying button style for non-active search */

	.search-wrapper:not(.active) .search {
		background: #99becc; /* Original button bg */
		border-radius: 50%;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.search-wrapper:not(.active) .search img {
		filter: none;
	}

	.search-dropdown {
		position: absolute;
		top: 120%;
		right: 0;
		width: 20rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.search-item {
		padding: 0.8rem 1rem;
		border-bottom: 1px solid #eee;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background 0.2s;
	}

	.search-item:last-child {
		border-bottom: none;
	}

	.search-item:hover {
		background: #f5f5f5;
	}

	.search-meta {
		font-size: 0.8rem;
		color: #888;
		background: #eee;
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
	}

	@media (max-width: 1000px) {
		.user-info {
			display: none;
		}
		.q_mark,
		.login {
			display: none; /* Hide others to make room for search on mobile? User didn't specify, but safer */
		}

		/* Keep search visible */
		.search-wrapper {
			z-index: 10;
		}

		.menu {
			display: block;
		}

		.search-wrapper.active {
			position: absolute;
			right: 4rem; /* space for menu */
			top: 50%;
			transform: translateY(-50%);
			width: auto;
		}

		.search-wrapper.active input {
			width: 40vw;
		}
	}

	/*============== Burger Menu ============*/
	.dd-menu-container {
		position: fixed;
		top: var(--header-height);
		left: 0;
		width: 100%;
		z-index: 999;
		background-color: #fdfaf2;
		border-top: 1px solid #ddd;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-height: 50vh;
		display: flex;
	}

	.dd-menu-container ul {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.dd-menu-container li {
		border-bottom: 1px solid #eee;
		flex-grow: 1;
		display: flex;
	}

	.dd-menu-container li:last-child {
		border-bottom: none;
	}

	.dd-menu-container li a {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		text-decoration: none;
		color: #333;
		font-size: 1.1rem;
		font-family: Arial, sans-serif;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
	}

	.dd-menu-container li a:hover {
		background-color: #f0f0f0;
	}

	.dd-menu-container li img {
		height: 28px;
		width: 28px;
		object-fit: contain;
	}

	@media (max-height: 500px) {
		.dd-menu-container {
			overflow-y: auto;
		}
	}

	/* Removed old overlay search styles */
</style>

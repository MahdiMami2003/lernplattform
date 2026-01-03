<script lang="ts">
	import logo from '$lib/assets/icons/Logo.png';
	import login from '$lib/assets/icons/Login.png';
	import q_mark from '$lib/assets/icons/fragezeichen.png';
	import register from '$lib/assets/icons/register.png';
	import searchIcon from '$lib/assets/icons/search.png';
	import menu from '$lib/assets/icons/menu.png';
	import access from '$lib/assets/icons/access.png';
	import classroom from '$lib/assets/icons/class.png';
	import progress from '$lib/assets/icons/prog.png';
	import subject from '$lib/assets/icons/sub.png';
	import task from '$lib/assets/icons/tasks.png';
	import Breadcrumbs from '$lib/Breadcrumbs.svelte';
	import { fly } from 'svelte/transition';

	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { browser } from '$app/environment';
	import { locale, _ } from '$lib/i18n/config';
	let { data } = $props();

	// USER ROLE STATE
	let userRole = $state<string | null>(null);

	// Fetch user role on mount or when session changes
	$effect(() => {
		if (data.session?.user?.id) {
			supabase
				.from('profiles')
				.select('role')
				.eq('id', data.session.user.id)
				.single()
				.then(({ data: profile }) => {
					userRole = profile?.role ?? null;
				});
		} else {
			userRole = null;
		}
	});

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

	const staticPages = [
		{
			title: 'Startseite',
			url: '/',
			keywords: 'home, start, index',
			subject: 'Seite',
			allowedRoles: null // null = Public
		},
		{
			title: 'Materialien',
			url: '/material_page_id14',
			keywords: 'material, search, suche, lernmaterial',
			subject: 'Seite',
			allowedRoles: null
		},
		{
			title: 'Registrierung',
			url: '/register_page_id3',
			keywords: 'register, anmelden, konto',
			subject: 'Seite',
			allowedRoles: null
		},
		{
			title: 'Barrierefreiheit',
			url: '/barrierefreiheit',
			keywords: 'access, accessibility',
			subject: 'Seite',
			allowedRoles: null
		},
		{
			title: 'Datenschutz',
			url: '/datenschutz',
			keywords: 'privacy, data',
			subject: 'Seite',
			allowedRoles: null
		},
		{
			title: 'Impressum',
			url: '/impressum',
			keywords: 'imprint, legal',
			subject: 'Seite',
			allowedRoles: null
		},
		{
			title: 'Schüler Übersicht',
			url: '/student_landing_page_id5',
			keywords: 'student, dashboard, schüler',
			subject: 'Seite',
			allowedRoles: ['student']
		},
		{
			title: 'Lehrer Übersicht',
			url: '/teacher_landing_page_id6',
			keywords: 'teacher, dashboard, lehrer',
			subject: 'Seite',
			allowedRoles: ['teacher']
		},
		{
			title: 'Eltern Übersicht',
			url: '/parents_landing_page_id4',
			keywords: 'parent, eltern, dashboard',
			subject: 'Seite',
			allowedRoles: ['parent']
		},
		{
			title: 'Lernfortschritt',
			url: '/progress_page_id11',
			keywords: 'progress, stats, statistik',
			subject: 'Seite',
			allowedRoles: ['student', 'parent']
		},
		{
			title: 'Aufgaben / Spiele',
			url: '/game_page_id12',
			keywords: 'games, tasks, aufgaben, spiele',
			subject: 'Seite',
			allowedRoles: ['student', 'admin']
		}
	];

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

		const query = searchQuery.toLowerCase();
		const isLoggedIn = !!data.session;

		// 1. Local Search (Static Pages)
		const pageResults = staticPages.filter((p) => {
			if (p.allowedRoles !== null) {
				if (!isLoggedIn || !userRole) return false;
				if (!p.allowedRoles.includes(userRole) && userRole !== 'admin') return false;
			}
			return p.title.toLowerCase().includes(query) || p.keywords.includes(query);
		});

		// 2. Subject Search (NEW)
		// Find subjects that match the query to provide direct section links
		const { data: subjectRows } = await data.supabase
			.from('materials')
			.select('subject')
			.ilike('subject', `%${query}%`);

		const uniqueSubjects = [...new Set(subjectRows?.map((r) => r.subject) || [])].filter((s) => s); // Filter nulls
		const subjectResults = uniqueSubjects.map((s) => ({
			title: s,
			url: `/material_page_id14#${s}`,
			subject: 'Fachgebiet'
		}));

		// 3. DB Search (Materials)
		const { data: rows, error } = await data.supabase
			.from('materials')
			.select('*')
			.or(
				`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`
			)
			.limit(5); // Limit DB results to mix with pages

		if (error) {
			console.error('Search Error:', error);
		}

		const dbResults = rows ?? [];

		// Combine results
		searchResults = [...pageResults, ...subjectResults, ...dbResults];
	}

	function handleResultClick(item: any) {
		searchOpen = false;
		if (item.url) {
			goto(item.url);
		} else {
			goto(`/materials_content_page_16/${item.id}`);
		}
	}

	async function handleLogout() {
		const { error } = await data.supabase.auth.signOut();
		if (!error) {
			// Force a hard reload to clear all state and ensure clean login page
			window.location.href = '/';
		}
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
	let showLangMenu = $state(false);

	function toggleLangMenu(e?: MouseEvent) {
		e?.preventDefault();
		showLangMenu = !showLangMenu;
	}

	function setLang(l: 'de' | 'en') {
		locale.set(l);
		if (browser) localStorage.setItem('lang', l);
		showLangMenu = false;
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
			{#if data.session?.user}
				<p>
					{$_('header.greeting')}
					<!-- 1. Name anzeigen oder Fallback auf Email -->
					{data.session.user.user_metadata?.full_name || data.session.user.email}

					<!-- 2. Rolle prüfen (alles in einer Zeile um Lücken zu vermeiden) -->
					{#if data.session.user.user_metadata?.role === 'student'}
						<a
							id="student"
							href="/student_landing_page_id5"
							style="color: var(--text-primary); cursor: pointer"
							title={$_('header.dashboard_student')}
							aria-label={$_('header.dashboard_student')}>{$_('header.role_student')}</a
						>
					{:else if data.session.user.user_metadata?.full_name === 'Günther Warnke'}
						<a
							id="admin"
							href="/admin_landing_page"
							style="color: var(--text-primary); cursor: pointer"
							title={$_('header.dashboard_admin')}
							aria-label={$_('header.dashboard_admin')}>(Admin)</a
						>
					{:else if data.session.user.user_metadata?.role === 'teacher'}
						<a
							id="teacher"
							href="/teacher_landing_page_id6"
							style="color: var(--text-primary); cursor: pointer"
							title={$_('header.dashboard_teacher')}
							aria-label={$_('header.dashboard_teacher')}>{$_('header.role_teacher')}</a
						>
					{:else if data.session.user.user_metadata?.role === 'parent'}
						<a
							id="parent"
							href="/parents_landing_page_id4"
							style="color: var(--text-primary); cursor: pointer"
							title={$_('header.dashboard_parent')}
							aria-label={$_('header.dashboard_parent')}>{$_('header.role_parent')}</a
						>
					{/if}
				</p>
			{:else}
				<p>{$_('header.not_logged_in')}</p>
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
					oninput={runSearch}
				/>
			{/if}
			<button class="search" onclick={toggleSearch}>
				<img src={searchIcon} />
			</button>

			{#if searchOpen && searchResults.length > 0}
				<div class="search-dropdown">
					{#each searchResults as item (item.id || item.url)}
						<div class="search-item" onclick={() => handleResultClick(item)}>
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
			<button class="login" onclick={handleLogout}><img src={login} /></button>
		{:else}
			<button class="login" style="cursor: default;"><img src={login} /></button>
		{/if}

		<button class="menu" onclick={toggleMenu}><img src={menu} /></button>
	</div>
	<!-- Dropdown Menu -->
	{#if isMenuOpen}
		<div class="dd-menu-container">
			<ul>
				<li>
					<a href="/" onclick={toggleMenu}><img alt="Home" src={logo} />Home</a>
				</li>
				<li>
					<a href="/materials_page" onclick={toggleMenu}
						><img alt="Material" src={searchIcon} />Materialien</a
					>
				</li>
				{#if !data.session}
					<li>
						<a href="/register_page_id3" onclick={toggleMenu}
							><img alt="Register" src={register} />Registrierung</a
						>
					</li>
				{/if}
			</ul>
		</div>
	{/if}

	<!-- Sidebar Overlay/Container -->
	{#if innerW > 1000}
		{#if showMainSidebar}
			<div class="nav__cont" transition:fly={{ x: -200, duration: 1000, opacity: 0 }}>
				<ul class="nav">
					{#if !testlogin}
						<li class="nav__items" id="reg">
							<a href="/register_page_id3">
								<img alt="Registrieren" src={register} />
								<span class="nav-text">Registrieren</span>
							</a>
						</li>
					{/if}

					<li class="nav__items" id="sub">
						<a href="/material_page_id14">
							<img alt="Fächer" src={subject} />
							<span class="nav-text">Fächer</span>
						</a>
					</li>

					<li class="nav__items" id="task">
						{#if data.session && (userRole === 'student' || userRole === 'admin')}
							<a href="/game_page_id12">
								<img alt="Aufgaben" src={task} />
								<span class="nav-text">Aufgaben</span>
							</a>
						{:else}
							<div class="nav__items_disabled_wrapper" style="cursor: not-allowed;">
								<a
									href="#"
									class="disabled-link"
									title="Nur für Schüler verfügbar!"
									onclick={(e) => e.preventDefault()}
									style="pointer-events: none;"
								>
									<img alt="Aufgaben" src={task} />
									<span class="nav-text">Aufgaben 🔒</span>
								</a>
							</div>
						{/if}
					</li>

					{#if testlogin}
						<li class="nav__items" id="prog">
							<a href="#">
								<img alt="Fortschritt" src={progress} />
								<span class="nav-text">Fortschritt</span>
							</a>
						</li>
						<li class="nav__items" id="classroom">
							<a href="#">
								<img alt="Klassenzimmer" src={classroom} />
								<span class="nav-text">Klasse</span>
							</a>
						</li>
					{/if}

					<li class="nav__items" id="access">
						<a onclick={toggle_slide_left} href="#">
							<img alt="Barrierefreiheit" src={access} />
							<span class="nav-text">Barrierefrei</span>
						</a>
					</li>
				</ul>
			</div>
		{:else}
			<div class="nav__cont" transition:fly={{ x: -200, duration: 1000, opacity: 0 }}>
				<ul class="nav">
					<li class="nav__items" id="reg">
						<a href="#" onclick={going_dark}>
							<span class="nav-text">Darkmode</span>
						</a>
					</li>
					<li class="nav__items" id="sub">
						<a href="#">
							<span class="nav-text">Kontrastmodus</span>
						</a>
					</li>
					<li class="nav__items" id="task">
						<a href="#" onclick={toggleLangMenu}>
							<span class="nav-text">{$_('header.change_language')}</span>
						</a>

						{#if showLangMenu}
							<div class="lang-submenu">
								<button class:selected={$locale === 'de'} onclick={() => setLang('de')}>DE</button>

								<button class:selected={$locale === 'en'} onclick={() => setLang('en')}>EN</button>
							</div>
						{/if}
					</li>
					<li class="nav__items" id="access">
						<a onclick={toggle_slide_left} href="#"> <span class="nav-text">Zurück</span> </a>
					</li>
				</ul>
			</div>
		{/if}
	{/if}
</nav>
<div class="bread-bar">
	<Breadcrumbs />
</div>
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
		height: var(--header-height);
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

	/* --- NEUE BREADCRUMB BAR --- */
	.bread-bar {
		position: fixed;
		top: var(--header-height); /* Beginnt direkt unter dem Header */
		left: 0;
		width: 100%;
		height: var(--bread-height);
		background-color: #f1af69; /* Helleres Beige passend zum Header */
		border-bottom: 1px solid #e0cdb0;
		display: flex;
		align-items: center;
		padding: 0 1rem; /* Gleiches Padding wie Header für Ausrichtung */
		box-sizing: border-box;
		z-index: 990; /* Unter Header (1000) und Mobile Menu (999) */
		font-size: 0.85rem;
		color: #44546a;
	}

	.bread-bar a {
		text-decoration: none;
		color: #44546a;
		transition: color 0.2s;
		display: flex;
		align-items: center;
	}

	.bread-bar a:hover {
		color: #000;
		text-decoration: underline;
	}

	.bread-bar .separator {
		margin: 0 0.5rem;
		color: #888;
		font-size: 0.7rem; /* Kleinerer Pfeil */
	}

	.bread-bar .current {
		font-weight: bold;
		color: #222;
		cursor: default;
	}

	@media (max-width: 1000px) {
		.signature p {
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

	@media (max-height: 500px) {
		.dd-menu-container {
			overflow-y: auto;
		}
	}

	/*========== Nav-Bar vertical ==============*/
	.nav__cont {
		position: fixed;
		width: 5rem;
		border: 3px outset #7c98bf;
		border-radius: 0.8em;
		margin-left: 3px;
		margin-top: max(45dvh, 50%);
		padding-top: 1rem;
		height: auto;
		z-index: 1001;
		background-color: #a0bdca;
		overflow: hidden;
		transition: width 0.3s ease;
		cursor: pointer;
		box-shadow: 4px 7px 10px rgba(0, 0, 0, 0.4);
	}

	.nav__cont:hover {
		width: 12rem;
	}

	.nav {
		list-style-type: none;
		color: white;
		margin: 0;
		padding: 0;
	}

	.nav__items {
		padding-bottom: 1rem;
		font-family: 'roboto', Arial, sans-serif;
	}

	.nav__items a:hover {
		background-color: #99becc;
		filter: brightness(1.4);
	}

	.nav__items a {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 0.5rem;
		height: 3rem;
		text-decoration: none;
		color: black;
		font-family: 'roboto', Arial, sans-serif;
		font-weight: 400;
		border-top: #44546a 1px solid;
		border-bottom: #44546a solid 1px;
	}

	.nav__items img {
		width: 2.5rem;
		height: 2.5rem;
		object-fit: contain;
		flex-shrink: 0;
		transition: margin-left 0.3s ease;
	}

	.nav-text {
		display: none;
		opacity: 0;
		white-space: nowrap;
		margin-left: 1rem;
		font-size: 1.1rem;
		transition:
			opacity 0.2s ease,
			visibility 0.2s ease;
	}

	.nav__cont:hover .nav__items a {
		justify-content: flex-start;
	}

	.nav__cont:hover .nav__items img {
		margin-left: 1.25rem;
	}

	.nav__cont:hover .nav-text {
		display: initial;
		opacity: 1;
		transition-delay: 0.2s;
	}

	.nav__items a.disabled-link {
		cursor: not-allowed;
		opacity: 0.5;
		background-color: rgba(0, 0, 0, 0.1);
	}

	.nav__items a.disabled-link:hover {
		background-color: rgba(0, 0, 0, 0.1);
		filter: none;
	}
	.lang-submenu {
		margin-left: 1rem;
		margin-top: 0.4rem;
		display: flex;
		gap: 0.4rem;
	}

	.lang-submenu button {
		border: 1px solid #ccc;
		background: white;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.lang-submenu button.selected {
		font-weight: 700;
		text-decoration: underline;
	}
</style>

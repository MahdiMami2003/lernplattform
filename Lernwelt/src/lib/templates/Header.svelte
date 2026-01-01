<!--Lernwelt/src/lib/templates/Header.svelte-->
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
    import { onMount } from 'svelte';

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

    // DARK MODE STATE
    let isDark = $state(false);

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


        const {data: rows, error} = await supabase
            .from('materials')
            .select('*')
            .or(
                `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,school_class.ilike.%${searchQuery}%`
            )
            .limit(10); // Limit results for performance


        if (!error) {
            searchResults = rows ?? [];
        } else {
            console.error("Suchfehler:", error);
            searchResults = [];
        }

    }


        function goToLogin() {
            goto(`/`);
        }

        function goToMaterial(id: number) {
            searchOpen = false;
            goto(`/materials_content_page_16/${id}`);
        }

        async function handleLogout() {
            const {error} = await data.supabase.auth.signOut();
            if (!error) window.location.href = '/';
        }

        function going_dark(e: MouseEvent) {
            e.preventDefault();
            isDark = !isDark;

            // Toggle auf HTML-Element für globale CSS-Variablen
            if (isDark) {
                document.documentElement.classList.add('darkmode');
                if (browser) localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('darkmode');
                if (browser) localStorage.setItem('theme', 'light');
            }
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

        onMount(() => {
            // Theme aus localStorage laden
            if (browser) {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                    isDark = true;
                    document.documentElement.classList.add('darkmode');
                }
            }
        });

</script>

<nav class="header-root">
	<a style="text-decoration: none" href="/">
		<div class="signature">
			<img class="logo" src={logo} alt="Logo" />
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
                                {$_('header.role_student')}
                            {:else if data.session.user.user_metadata?.full_name === 'Günther Warnke'}
                                (Admin)
                            {:else if data.session.user.user_metadata?.role === 'teacher'}
                                {$_('header.role_teacher')}
                            {:else if data.session.user.user_metadata?.role === 'parent'}
                                {$_('header.role_parent')}
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
					placeholder="{$_('header.search_placeholder')}..."
					bind:value={searchQuery}
					oninput={runSearch}
				/>
			{/if}
			<button class="search" onclick={toggleSearch}>
				<img alt="Suche" src={searchIcon} />
			</button>

            {#if searchOpen && searchResults.length > 0}
                <div class="search-dropdown" role="listbox">
                    {#each searchResults as item (item.id)}
                        <div
                                class="search-item"
                                onclick={() => goToMaterial(item.id)}
                                role="option"
                                tabindex="0"
                                onkeydown={(e) => e.key === 'Enter' && goToMaterial(item.id)}
                        >
                            <strong>{item.title}</strong>
                            <span class="search-meta">{item.subject}</span>
                        </div>
                    {/each}
                    {#if searchResults.length === 0 && searchQuery.length > 1}
                        <div class="search-item no-results">{$_('header.search_no_results')}</div>
                    {/if}
                </div>
            {/if}
        </div>

		{#if data.session}
			<button class="login" onclick={handleLogout}><img alt="Logout" src={login} /></button>
		{:else}
			<button class="login" onclick={goToLogin} style="cursor: default;"><img src={login} alt="Login" /></button>
		{/if}

		<button class="menu" onclick={toggleMenu}><img src={menu} alt="Menü" /></button>
	</div>
	<!-- Dropdown Menu -->
	{#if isMenuOpen}
		<div class="dd-menu-container">
			<ul>
				<li>
					<a href="/" onclick={toggleMenu}><img alt="Home" src={logo} />{$_('header.menu_home')}</a>
				</li>
				<li>
					<a href="/material_page_id14" onclick={toggleMenu}
						><img alt="Material" src={searchIcon} />{$_('header.menu_materials')}</a
					>
				</li>
                {#if data.session}
                <li>
                    <a href="/" onclick={handleLogout}><img alt="logout" src={login} />{$_('header.menu_logout')}</a>
                </li>
                {/if}
				{#if !data.session}
                    <li>
                        <a href="/" onclick={goToLogin}><img alt="login" src={login} />{$_('header.menu_login')}</a>
                    </li>
                    <li>
						<a href="/register_page_id3" onclick={toggleMenu}
							><img alt="Register" src={register} />{$_('header.menu_register')}</a
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
                        <!--<li class="nav__items" id="reg">
                            <a href="/register_page_id3">
                                <img alt="Registrieren" src={register} />
                                <span class="nav-text">Registrieren</span>
                            </a>
                        </li>-->
                    {/if}

                    <li class="nav__items" id="sub">
                        <a href="/material_page_id14">
                            <img alt="Fächer" src={subject} />
                            <span class="nav-text">{$_('header.nav_learning_content')}</span>
                        </a>
                    </li>

                    <li class="nav__items" id="task">
                        <a
                                href={data.session ? '/game_page_id12' : '#'}
                                class={!data.session ? 'disabled-link' : ''}
                                title={!data.session ? $_('header.tooltip_login_required') : ''}
                                onclick={!data.session ? (e) => e.preventDefault() : undefined}
                        >
                            <img alt="Aufgaben" src={task} />
                            <span class="nav-text">{$_('header.nav_tasks')} {!data.session ? '🔒' : ''}</span>
                        </a>
                    </li>

                    {#if testlogin}
                        <li class="nav__items" id="prog">
                            <a href="#">
                                <img alt="Fortschritt" src={progress} />
                                <span class="nav-text">{$_('header.nav_progress')}</span>
                            </a>
                        </li>
                        <li class="nav__items" id="classroom">
                            <a href="#">
                                <img alt="Klassenzimmer" src={classroom} />
                                <span class="nav-text">{$_('header.nav_class')}</span>
                            </a>
                        </li>
                    {/if}

                    <li class="nav__items" id="access">
                        <a
                                onclick={toggle_slide_left}
                                href="#"
                                aria-label="{$_('header.aria_accessibility_open')}"
                        >
                            <img alt="Barrierefreiheit" src={access} />
                            <span class="nav-text">{$_('header.nav_accessibility')}</span>
                        </a>
                    </li>
                </ul>
            </div>
        {:else}
            <div class="nav__cont" transition:fly={{ x: -200, duration: 1000, opacity: 0 }}>
                <ul class="nav">
                    <li class="nav__items" id="reg">
                        <a
                                href="#"
                                onclick={going_dark}
                                aria-label={isDark ? $_('header.aria_switch_light') : $_('header.aria_switch_dark')}
                                aria-pressed={isDark}
                        >
							<span class="nav-text">
								{isDark ? $_('header.mode_light') : $_('header.mode_dark')}
							</span>
                        </a>
                    </li>
                    <li class="nav__items" id="sub">
                        <a href="#">
                            <span class="nav-text">{$_('header.nav_contrast')}</span>
                        </a>
                    </li>
                    <li class="nav__items" id="task">
                        <a href="#" onclick={toggleLangMenu}>
                            <span class="nav-text">{$_('header.change_language')}</span>
                        </a>

                        {#if showLangMenu}
                            <div class="lang-submenu">
                                <button
                                        class:selected={$locale === 'de'}
                                        onclick={() => setLang('de')}
                                        aria-label="Deutsch"
                                >DE</button>

                                <button
                                        class:selected={$locale === 'en'}
                                        onclick={() => setLang('en')}
                                        aria-label="English"
                                >EN</button>
                            </div>
                        {/if}
                    </li>
                    <li class="nav__items" id="access">
                        <a
                                onclick={toggle_slide_left}
                                href="#"
                                aria-label="{$_('header.aria_back_nav')}"
                        >
                            <span class="nav-text">{$_('header.nav_back')}</span>
                        </a>
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
    /* ============ CSS VARIABLEN FÜR LIGHT/DARK MODE ============ */
    :root {
        /* Light Mode (Standard) */
        --bg-main: #fdfaf2;
        --bg-card: #ffffff;
        --bg-hover: #f0f0f0;
        --border-color: #e0cdb0;

        --text-primary: #1a1a1a;
        --text-secondary: #44546a;
        --text-muted: #6a6a6a;

        --header-bg: #f0be71;
        --header-text: #000000;
        --sidebar-bg: #a0bdca;
        --sidebar-hover: #99becc;
        --sidebar-border: #7c98bf;

        --search-dropdown-bg: #ffffff;
        --search-meta-bg: #eeeeee;
        --search-meta-text: #888888;
    }

    :root.darkmode {
        /* Dark Mode - Barrierefrei mit guten Kontrasten */
        --bg-main: #1a1d23;
        --bg-card: #252a33;
        --bg-hover: #2f3541;
        --border-color: #3d4450;

        --text-primary: #e6edf3;
        --text-secondary: #adbac7;
        --text-muted: #768390;

        --header-bg: #2d3139;
        --header-text: #e6edf3;
        --sidebar-bg: #343a46;
        --sidebar-hover: #3d4450;
        --sidebar-border: #4a5362;

        --search-dropdown-bg: #252a33;
        --search-meta-bg: #3d4450;
        --search-meta-text: #adbac7;
    }

    /* Global Container */
    :global(.main_container) {
        background-color: var(--bg-main);
        color: var(--text-primary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ HEADER ============ */
    .header-root {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        font-family: 'Inter', Arial, sans-serif;
        height: var(--header-height);
        background-color: var(--header-bg);
        color: var(--header-text);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        --icon-size: calc(var(--header-height) * 0.6);
        padding: 0 1rem;
        box-sizing: border-box;
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    .signature {
        display: flex;
        height: var(--header-height);
        flex-basis: auto;
        align-items: center;
        justify-content: start;
        gap: 0.5rem;
        padding-left: 0.5rem;
    }

    .signature p {
        font-family: 'Roboto', Arial, sans-serif;
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--header-text);
        margin: 0;
        transition: color 0.3s ease;
    }

    .signature .logo {
        height: calc(var(--icon-size) * 1.2);
        width: calc(var(--icon-size) * 1.2);
        object-fit: contain;
    }

    .signature:hover {
        cursor: pointer;
    }

    /* USER INFO */
    .user-info {
        flex: 1;
        text-align: center;
        color: var(--header-text);
        font-size: 1rem;
        font-weight: bold;
        transition: color 0.3s ease;
    }

    .user-info p {
        margin: 0;
    }

    /* ICON CONTAINER */
    .icon-container {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        justify-content: end;
    }

    .icon-container button {
        background-color: var(--sidebar-hover);
        border: none;
        padding: 0.4rem;
        cursor: pointer;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, background-color 0.3s ease;
        min-width: 44px;
        min-height: 44px;
    }

    .icon-container button:hover {
        transform: scale(1.1);
        background-color: var(--sidebar-bg);
        filter: brightness(1.2);
    }

    .icon-container button:active {
        transform: scale(0.9);
    }

    .icon-container button:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    .icon-container img {
        height: var(--icon-size);
        width: var(--icon-size);
        object-fit: contain;
        pointer-events: none;
        transition: filter 0.3s ease;
    }

    /* Icons im Dark Mode invertieren für bessere Sichtbarkeit */
    :root.darkmode .icon-container img {
        filter: invert(1) brightness(1.2);
    }

    .menu {
        display: none;
    }

    /* ============ SEARCH ============ */
    .search-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        background: transparent;
        border-radius: 5px;
        transition: all 0.3s ease;
    }

    .search-wrapper.active {
        background: var(--bg-card);
        padding-left: 0.8rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .search-wrapper input {
        border: none;
        outline: none;
        background: transparent;
        width: 15rem;
        font-size: 1rem;
        color: var(--text-primary);
        transition: width 0.3s ease, color 0.3s ease;
    }

    .search-wrapper input::placeholder {
        color: var(--text-muted);
    }

    .search-wrapper input:focus {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
        width: 18rem;
        border-radius: 4px;
    }

    .search-wrapper .search {
        background: transparent;
        box-shadow: none;
        padding: 0.4rem;
        margin-left: 0.2rem;
    }

    .search-wrapper .search img {
        filter: invert(0.4);
    }

    .search-wrapper:not(.active) .search {
        background: var(--sidebar-hover);
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .search-wrapper:not(.active) .search img {
        filter: none;
    }

    /* Im Dark Mode: Wenn Search nicht aktiv ist, Icon auch invertieren */
    :root.darkmode .search-wrapper:not(.active) .search img {
        filter: invert(1) brightness(1.2);
    }

    .search-dropdown {
        position: absolute;
        top: 120%;
        right: 0;
        width: 20rem;
        background: var(--search-dropdown-bg);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: background 0.3s ease, color 0.3s ease;
        z-index: 100;
    }

    .search-item {
        padding: 0.8rem 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background 0.2s;
    }

    .search-item:last-child {
        border-bottom: none;
    }

    .search-item:hover,
    .search-item:focus {
        background: var(--bg-hover);
        outline: none;
    }

    .search-meta {
        font-size: 0.8rem;
        color: var(--search-meta-text);
        background: var(--search-meta-bg);
        padding: 0.2rem 0.5rem;
        border-radius: 1rem;
        transition: background 0.3s ease, color 0.3s ease;
    }

    /* ============ BREADCRUMB BAR ============ */
    .bread-bar {
        position: fixed;
        top: var(--header-height);
        left: 0;
        width: 100%;
        height: var(--bread-height);
        background-color: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        padding: 0 1rem;
        box-sizing: border-box;
        z-index: 990;
        font-size: 0.85rem;
        color: var(--text-secondary);
        transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 1000px) {
        .signature p {
            display: none;
        }

        .q_mark,
        .login {
            display: none;
        }

        .search-wrapper {
            z-index: 10;
        }

        .menu {
            display: block;
        }

        .search-wrapper.active {
            position: absolute;
            right: 4rem;
            top: 50%;
            transform: translateY(-50%);
            width: auto;
        }

        .search-wrapper.active input {
            width: 40vw;
        }
    }

    /* ============ BURGER MENU ============ */
    .dd-menu-container {
        position: fixed;
        top: var(--header-height);
        left: 0;
        width: 100%;
        z-index: 999;
        background-color: var(--bg-card);
        border-top: 1px solid var(--border-color);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: 50vh;
        display: flex;
        transition: background-color 0.3s ease;
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
        border-bottom: 1px solid var(--border-color);
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
        color: var(--text-primary);
        font-size: 1.1rem;
        font-family: Arial, sans-serif;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        transition: background 0.2s, color 0.3s ease;
    }

    .dd-menu-container li a:hover {
        background-color: var(--bg-hover);
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

    /* ============ SIDEBAR (VERTICAL NAV) ============ */
    .nav__cont {
        position: fixed;
        width: 5rem;
        border: 3px outset var(--sidebar-border);
        border-radius: 0.8em;
        margin-left: 3px;
        margin-top: max(45dvh, 50%);
        padding-top: 1rem;
        height: auto;
        z-index: 1001;
        background-color: var(--sidebar-bg);
        overflow: hidden;
        transition: width 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
        cursor: pointer;
        box-shadow: 4px 7px 10px rgba(0, 0, 0, 0.4);
    }

    .nav__cont:hover {
        width: 12rem;
    }

    .nav {
        list-style-type: none;
        color: var(--text-primary);
        margin: 0;
        padding: 0;
    }

    .nav__items {
        padding-bottom: 1rem;
        font-family: 'roboto', Arial, sans-serif;
    }

    .nav__items a:hover {
        background-color: var(--sidebar-hover);
        filter: brightness(1.2);
    }

    .nav__items a:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: -2px;
    }

    .nav__items a {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-right: 0.5rem;
        height: 3rem;
        text-decoration: none;
        color: var(--text-primary);
        font-family: 'roboto', Arial, sans-serif;
        font-weight: 400;
        border-top: var(--border-color) 1px solid;
        border-bottom: var(--border-color) solid 1px;
        transition: background-color 0.2s, color 0.3s ease;
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
        border: 1px solid var(--border-color);
        background: var(--bg-card);
        color: var(--text-primary);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.2s, color 0.3s ease, border-color 0.3s ease;
        min-width: 44px;
        min-height: 44px;
    }

    .lang-submenu button:hover {
        background: var(--bg-hover);
    }

    .lang-submenu button:focus-visible {
        outline: 2px solid var(--text-primary);
        outline-offset: 2px;
    }

    .lang-submenu button.selected {
        font-weight: 700;
        text-decoration: underline;
    }
</style>
<script>
    import logo from '$lib/assets/icons/Logo.png';
    import login from '$lib/assets/icons/login.png';
    import q_mark from '$lib/assets/icons/fragezeichen.png';
    import register from '$lib/assets/icons/register.png';
    import search from '$lib/assets/icons/search.png';
    import menu from '$lib/assets/icons/menu.png';
    import access from '$lib/assets/icons/access.png';
    import classroom from '$lib/assets/icons/class.png';
    import progress from '$lib/assets/icons/prog.png';
    import subject from '$lib/assets/icons/sub.png';
    import task from '$lib/assets/icons/tasks.png';

    import { goto } from '$app/navigation';
    import { fly } from 'svelte/transition';

    let { data } = $props();

    let testlogin = $state(false);
    let isMenuOpen = $state(false);
    let innerW = $state(0);


    let showMainSidebar = $state(true);

    async function handleLogout() {
        const { error } = await data.supabase.auth.signOut();

        if (error) {
            console.error('Logout Fehler:', error);
        } else {
            await goto('/no_login_page_id7');
            isMenuOpen = false;
        }
    }

    function going_dark(e){
        e.preventDefault(); // Verhindert Neuladen bei a-Tags
        let main_class = document.getElementsByClassName('main_container')[0];
        if(main_class){
            main_class.classList.toggle('darkmode');
        }
    }

    function toggle_slide_left(e) {
        if(e) e.preventDefault();
        showMainSidebar = !showMainSidebar;
    }

    function toggleLogin(){
        testlogin = !testlogin;
    }

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    $effect(() => {
        if (innerW > 1000) {
            if (isMenuOpen) {
                // Nutze den Setter direkt, um Rekursion zu vermeiden, falls nötig
                isMenuOpen = !isMenuOpen;
            }
        }
    });
</script>

<nav class="header-root">
    <a style="text-decoration: none" href="/">
        <div title="Zum Hauptmenü" class="signature">
            <img class="logo" src={logo} alt="Schul-Logo">
            <p>HSGG-Lernwelt</p>
        </div>
    </a>

    <div class="user-info">
        {#if data.session}
            <p>Hallo, {data.session.user.email}</p>
        {:else}
            <p>Du bist nicht eingeloggt.</p>
        {/if}
    </div>

    <div class="icon-container">
        <button type="button" title="Suche" class="search"><img alt="Search" src={search}> </button>
        <button type="button" title="Fragen" class="q_mark"> <img alt="q_mark" src={q_mark}> </button>
        {#if data.session}
            <a href="/no_login_page_id7">
            <button
                    type="button"
                    title="Abmelden"
                    class="login"
                    onclick={handleLogout}
            >

                <img alt="Logout" src={login}>
            </button>
            </a>
        {:else}
            <a href="/login_page_id2">
                <button type="button" title="Einloggen" class="login">
                    <img alt="Login" src={login}>
                </button>
            </a>
        {/if}
        <button type="button" title="Menü ausklappen" class="menu" onclick={toggleMenu}><img alt="Menu" src={menu}></button>
    </div>
</nav>

<svelte:window bind:innerWidth={innerW} />

{#if innerW > 1000}
    {#if showMainSidebar}
        <div
                class="nav__cont"
                transition:fly={{ x: -200, duration: 1000, opacity: 0 }}
        >
            <ul class="nav">
                {#if !testlogin}
                    <li class="nav__items" id="reg">
                        <a href="/register_page_id3">
                            <img alt="Registrieren" src={register}>
                            <span class="nav-text">Registrieren</span>
                        </a>
                    </li>
                {/if}

                <li class="nav__items" id="sub">
                    <a href="/material_page_id14">
                        <img alt="Fächer" src={subject}>
                        <span class="nav-text">Fächer</span>
                    </a>
                </li>

                <li class="nav__items" id="task">
                    <a href="game_page_id12">
                        <img alt="Aufgaben" src={task}>
                        <span class="nav-text">Aufgaben</span>
                    </a>
                </li>

                {#if testlogin}
                    <li class="nav__items" id="prog">
                        <a href="#">
                            <img alt="Fortschritt" src={progress}>
                            <span class="nav-text">Fortschritt</span>
                        </a>
                    </li>
                    <li class="nav__items" id="classroom">
                        <a href="#">
                            <img alt="Klassenzimmer" src={classroom}>
                            <span class="nav-text">Klasse</span>
                        </a>
                    </li>
                {/if}

                <li class="nav__items" id="access">
                    <a onclick={toggle_slide_left} href="#">
                        <img alt="Barrierefreiheit" src={access}>
                        <span class="nav-text">Barrierefrei</span>
                    </a>
                </li>
            </ul>
        </div>
    {:else}
        <div
                class="nav__cont"
                transition:fly={{ x: -200, duration: 1000, opacity: 0 }}
        >
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
                    <a href="#">
                        <span class="nav-text">Sprache ändern</span>
                    </a>
                </li>
                <li class="nav__items" id="access">
                    <a onclick={toggle_slide_left} href="#">
                        <span class="nav-text">Zurück</span>
                    </a>
                </li>
            </ul>
        </div>
    {/if}

{/if}


{#if isMenuOpen}
    <div class="dd-menu-container">
        <ul>
            <li><a href="#" onclick={toggleMenu}><img alt="Search" src={search}>Suchen</a></li>
            <li><a href="#" onclick={toggleMenu}><img alt="q_mark" src={q_mark}>Hilfe</a></li>
            <li><a href="/login_page_id2" onclick={toggleMenu}><img alt="Login" src={login}>Login</a></li>
            <li><a href="/register_page_id3" onclick={toggleMenu}><img alt="Register" src={register}>Registrierung</a></li>
        </ul>
    </div>
{/if}

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
        font-family: Arial, sans-serif;
        height: var(--header-height);
        background-color: #f0be71;
        box-shadow: 0 1px 1px rgba(0,0,0,0.30);
        display: flex;
        align-items: center;
        justify-content: space-between;
        --icon-size: calc(var(--header-height) * 0.6);
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

    .signature:active {
        color: black;
    }

    .icon-container {
        display: flex;
        align-items: center;
        flex-basis: auto;
        gap: 1rem;
        justify-content: end;
        padding-right: 1rem;
    }

    .user-info {
        font-weight: bold;
        font-size: 1.1rem;
        color: black;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .menu {
        display: none;
    }

    .q_mark img {
        height: calc(var(--header-height) * 0.5);
        width: var(--icon-size);
        object-fit: contain;
        padding: 0.1rem 0 0.1rem 0;
    }

    .menu img,
    .login img,
    .search img {
        height: var(--icon-size);
        width: var(--icon-size);
        object-fit: contain;
    }

    .menu,
    .q_mark,
    .login,
    .search {
        padding-top: 1px;
        padding-left: 1rem;
        padding-right: 1rem;
        border: 3px outset #7c98bf;
        border-radius: 0.8em;
        background: #99becc;
        color: ghostwhite;
        transition: transform 0.1s ease, filter 0.3s ease;
    }

    .menu:hover,
    .q_mark:hover,
    .login:hover,
    .search:hover {
        cursor: pointer;
        filter: brightness(1.4);
    }

    .menu:active,
    .q_mark:active,
    .login:active,
    .search:active {
        transform: scale(0.95);
    }

    @media(max-width: 1000px) {
        .signature {
            padding: 2.5px 1rem;
            margin-left: 1rem;
            border: 3px outset #7c98bf;
            border-radius: 0.8em;
            background: #99becc;
            color: ghostwhite;
            transition: transform 0.1s ease, filter 0.3s ease;
        }
        .signature p{
            display: none;
        }
        .signature img{
            height: calc(var(--header-height) * 0.6);
            width: calc(var(--header-height) * 0.6);
        }
        .signature:active {
            transform: scale(0.95);
            filter: brightness(1.4);
        }
        .user-info {
            display: none;
        }
        .q_mark,
        .login,
        .search {
            display: none;
        }
        .menu {
            display: block;
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
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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

    @media(max-height: 500px) {
        .dd-menu-container{
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
        margin-top: min(35dvh, 40%);
        padding-top: 1rem;
        height: auto;
        z-index: 1001;
        background-color: #a0bdca;
        overflow: hidden;
        transition: width .3s ease;
        cursor: pointer;
        box-shadow: 4px 7px 10px rgba(0, 0, 0, .4);
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
        transition: opacity 0.2s ease, visibility 0.2s ease;
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
</style>
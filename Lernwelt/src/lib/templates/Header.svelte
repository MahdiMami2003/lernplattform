<nav class="header-root">

    <a style="text-decoration: none" href="/"><div title="Zum Hauptmenü" class="signature"><img class="logo" src={logo} alt="Schul-Logo"><p>HSGG-Lernwelt</p></div>
    </a>
    <!--<div class="lernwelt">HSG-Lernwelt</div> -->

    <div class="icon-container">

        <button type="button" title="Suche" class="search"><img alt="Search" src={search}> </button>

        <button type="button" title="Fragen" class="q_mark"> <img alt="q_mark" src={q_mark}> </button>

        <button type="button" title="Einloggen" class="login" on:click={toggleLogin}> <img alt="Login" src={login}> </button>

        <button type="button" title="Menü ausklappen" class="menu" on:click={toggleMenu}><img alt="Menu" src={menu}></button>

    </div>

</nav>

<svelte:window bind:innerWidth={innerW} />


{#if innerW > 1000}

    <div class="nav__cont">

        <ul class="nav">

            {#if !testlogin}

                <li class="nav__items" id="reg">

                    <a href="">

                        <img alt="Registrieren" src={register}>

                        <span class="nav-text">Registrieren</span>

                    </a>

                </li>

            {/if}

            <li class="nav__items" id="sub">

                <a href="">

                    <img alt="Fächer" src={subject}>

                    <span class="nav-text">Fächer</span>

                </a>

            </li>

            <li class="nav__items" id="task">

                <a href="">

                    <img alt="Aufgaben" src={task}>

                    <span class="nav-text">Aufgaben</span>

                </a>

            </li>

            {#if testlogin}

                <li class="nav__items" id="prog">

                    <a href="">

                        <img alt="Fortschritt" src={progress}>

                        <span class="nav-text">Fortschritt</span>

                    </a>

                </li>

                <li class="nav__items" id="classroom">

                    <a href="">

                        <img alt="Klassenzimmer" src={classroom}>

                        <span class="nav-text">Klasse</span>

                    </a>

                </li>

            {/if}

            <li class="nav__items" id="access">

                <a href="">

                    <img alt="Barrierefreiheit" src={access}>

                    <span class="nav-text">Barrierefrei</span>

                </a>

            </li>

        </ul>

    </div>

{/if}







{#if isMenuOpen}

    <div class="dd-menu-container">

        <ul>

            <li><a href=""><img alt="Search" src={search}>Suchen</a></li>

            <li><a href=""><img alt="q_mark" src={q_mark}>Hilfe</a></li>

            <li><a href=""><img alt="Login" src={login}>Login</a></li>

            <li><a href=""><img alt="Register" src={register}>Registrierung</a></li>

        </ul>

    </div>

{/if}







<script>

    import logo from '$lib/assets/icons/Logo.png'

    import login from '$lib/assets/icons/login.png'

    import q_mark from '$lib/assets/icons/fragezeichen.png'

    import register from '$lib/assets/icons/register.png'

    import search from '$lib/assets/icons/search.png'

    import menu from '$lib/assets/icons/menu.png'

    import access from '$lib/assets/icons/access.png'

    import classroom from '$lib/assets/icons/class.png'

    import progress from '$lib/assets/icons/prog.png'

    import subject from '$lib/assets/icons/sub.png'

    import task from '$lib/assets/icons/tasks.png'



    //Nav-bar

    let testlogin = false;

    let isMenuOpen = false;

    let innerW = 0;



    function toggleLogin(){

        testlogin = !testlogin;

    }

    function toggleMenu() {

        isMenuOpen = !isMenuOpen;

    }



    $: {

        if (innerW > 1000) {

            if (isMenuOpen) {

                toggleMenu();

            }

        }

    }





</script>



<style>

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



    /*======= Signature-> Logo + Titel ============*/



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


    /*============ Icons ================*/
    /*
    .lernwelt{

        display: none;

    }

     */





    .icon-container {

        display: flex;

        align-items: center;

        flex-basis: auto;

        gap: 1rem;

        justify-content: end;

        padding-right: 1rem;

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

        color: ghostwhite; /* Falls du mal Text hinzufügst */

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

            color: ghostwhite; /* Falls du mal Text hinzufügst */

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

        /*=========== Titel ==============*/

        /* .lernwelt{

        display: block;

        font-size: min(calc(var(--header-height)/3),16px);

        font-family: Arial, sans-serif;

        font-weight: bold;



        margin-left:1rem;

        margin-right: 1rem;



        padding-top: 1px;

        padding-left: max(16px, 1rem);

        padding-right: max(16px,1rem);



        border: 3px outset #7c98bf;

        background: #99becc;



        }

        */



        /*=========== Icons =============*/



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

        /* display: flex; <== ÄNDERN VON FLEX...*/

        display: grid; /* <== ZU GRID */

        grid-template-columns: auto 1fr; /* 1. Spalte (Icon) so breit wie nötig, 2. Spalte (Text) füllt den Rest */



        align-items: center;

        gap: 1rem;

        padding: 1rem 1.5rem;

        text-decoration: none;

        color: #333;

        font-size: 1.1rem;

        font-family: Arial, sans-serif;



        width: 100%;

        height: 100%;



        /* === DAS IST DIE LÖSUNG (für Höhe) === */

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

    /* === NEUER CSS-CODE FÜR DIE VERTIKALE SIDEBAR === */

    /* === (Dein SASS-Code, übersetzt in reines CSS) === */



    .nav__cont {

        position: fixed;

        /* Wir nutzen 'rem' für eine stabilere, zugänglichere Größe.

        5dvw ist auf großen Monitoren riesig, auf kleinen winzig.

        'rem' skaliert mit dem User-Zoom. */

        width: 5rem; /* (ca. 80px) */

        border: 3px outset #7c98bf;

        border-radius: 0.8em;

        margin-left: 3px;

        margin-top: min(35dvh, 40%);

        padding-top: 1rem; /* Reduziert von var(--header-height) */

        height: auto;

        z-index: 1001;

        background-color: #a0bdca;

        overflow: hidden; /* Wichtig, damit der Text nicht "rausragt" */

        transition: width .3s ease;

        cursor: pointer;

        box-shadow: 4px 7px 10px rgba(0, 0, 0, .4);

    }



    .nav__cont:hover {

        /* Breite beim Ausklappen */

        width: 12rem; /* (ca. 256px) */

    }



    .nav {

        list-style-type: none;

        color: white;

        margin: 0;

        padding: 0;

    }

    .nav__items {

        /* Reduziertes Padding für bessere Listenansicht */

        padding-bottom: 1rem;

        font-family: 'roboto', Arial, sans-serif;

    }

    .nav__items a:hover {
        background-color: #99becc;
        filter: brightness(1.4);
    }


    .nav__items a {

        /* WICHTIG: Flexbox für die Ausrichtung */

        display: flex;

        align-items: center; /* Vertikal zentrieren */



        /* Im eingeklappten Zustand: Icon zentrieren */

        justify-content: center;



        /* Sauberes Padding statt alter Margin/Padding-Werte */

        padding-right: 0.5rem;



        height: 3rem; /* Feste Höhe für jeden Link */



        text-decoration: none;

        color: black;

        font-family: 'roboto', Arial, sans-serif;

        font-weight: 400; /* 100 war sehr dünn */

        border-top: #44546a 1px solid;

        border-bottom: #44546a solid 1px;

        /* (Alte Stile wie top, transition, etc. entfernt/ersetzt) */

    }



    /* Das Icon selbst (KORRIGIERT) */

    .nav__items img {

        /* Feste, skalierbare Größe */

        width: 2.5rem; /* (ca. 40px) */

        height: 2.5rem;

        object-fit: contain;



        /* Wichtig: Verhindert, dass das Icon beim Ausklappen "springt" */

        flex-shrink: 0;



        /* HIER WURDE DER 'margin-left: 4.5rem' ENTFERNT */



        /* Sorgt dafür, dass sich nur der Margin sanft ändert */

        transition: margin-left 0.3s ease;

    }









    /* Der neue Titel-Text */

    .nav-text {

        /* Standardmäßig versteckt */

        display: none;

        opacity: 0;



        /* Verhindert Textumbruch */

        white-space: nowrap;



        margin-left: 1rem; /* Abstand zwischen Icon und Text */

        font-size: 1.1rem;



        /* Übergang für sanftes Einblenden */

        transition: opacity 0.2s ease, visibility 0.2s ease;

    }



    /* --- DER HOVER-EFFEKT (KORRIGIERT) --- */



    .nav__cont:hover .nav__items a {

        /* Im ausgeklappten Zustand: Links ausrichten */

        justify-content: flex-start;

    }



    /* NEUE REGEL HINZUGEFÜGT */

    .nav__cont:hover .nav__items img {

        /* Fügt den Abstand NUR hinzu, wenn die Sidebar ausgeklappt ist */

        /* (1.25rem ist ein guter Startwert, passe ihn bei Bedarf an) */

        margin-left: 1.25rem;

    }



    .nav__cont:hover .nav-text {

        /* Text sichtbar machen */

        display: initial;

        opacity: 1;

        transition-delay: 0.2s;


    }



</style>
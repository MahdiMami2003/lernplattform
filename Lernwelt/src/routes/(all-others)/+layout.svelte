<script lang="ts">
    import Header from "$lib/templates/Header.svelte";
    import Footer from "$lib/templates/Footer.svelte";
    let { children } = $props();
</script>

<div class="parent_grid">

    <div class="head_container">
        <Header />
    </div>

    <div class="left_container"></div>

    <div class="main_container">
        {@render children?.()}
    </div>

    <div class="right_container"></div>

    <div class="footer_container">
        <Footer />
    </div>

</div>

<style>



    .parent_grid {
        --header-height: min(4rem, 5dvh);
        --main-padding: 2.5rem;
        --main-radius: 0.75rem;

        display: grid;
        grid-template-columns: 1fr 10fr 1fr;
        grid-template-rows: auto 1fr auto;
        grid-template-areas:
        "header header header"
        "left   main   right"
        "footer footer footer";

        min-height: 100dvh;

        background-image: url("$lib/assets/images/bg_f.jpeg");
        background-size: 100%;
        background-repeat: repeat-y;
    }

    .head_container {
        grid-column: 1;
        grid-area: header;
    }

    .main_container {
        grid-area: main;

        padding: var(--main-padding);
        border-radius: var(--main-radius);
        margin-top: var(--header-height);
        margin-bottom: 2rem;

        font-family: Arial, Helvetica, sans-serif;
        box-shadow: 0 1.1875rem 2.375rem rgba(0,0,0,0.30), 0 0.9375rem 0.75rem rgba(0,0,0,0.22);
    }

    .footer_container {
        grid-area: footer;
        max-width: 100%;
    }

    @media (max-width: 1000px) {
        .parent_grid {
            --header-height: min(5rem, 15dvh);
            --main-padding-right: min(2.5rem, 12.125dvw);

            grid-template-columns: 100%;
            grid-template-rows: auto;
            grid-template-areas:
            "header"
            "left"
            "main"
            "right"
            "footer";
        }

        .head_container {
            box-shadow: none;
        }

        .main_container {
            margin-right: var(--main-padding-right);
            margin-bottom: var(--main-padding);



            border-radius: 0 var(--main-radius) var(--main-radius) 0;
            overflow: hidden;
        }
    }

    /* --- GLOBAL FIXES --- */
    html, body {
        margin: 0;
        padding: 0;
        overflow-x: hidden; /* verhindert horizontales Scrollen */
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }

    /* WICHTIG: Alle Elemente berücksichtigen Border & Padding in der Breite */
    *, *::before, *::after {
        box-sizing: inherit;
    }

    /* Sidebar darf nie nach rechts hinausragen
    .nav__cont {
        max-width: 100vw;
        overflow-x: hidden;
    }
    */

    /* Footer fixen */
    footer, .footer_container {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
    }

    /* Header fixen
    .header-root {
        width: 100%;
        max-width: 100%;
        left: 0;
        right: 0;
    }
*/
    /* Hauptgrid fixen */
    .parent_grid {
        overflow-x: hidden;
        max-width: 100%;
    }


</style>
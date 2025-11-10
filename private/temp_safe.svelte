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
        display: grid;

        grid-template-columns: 1fr 10fr 1fr;
        grid-template-rows: auto 1fr auto;
        grid-template-areas:
        "header header header"
        "left   main   right"
        "footer footer footer";
        min-height: 100dvh;

        background-image: url("/src/lib/assets/images/bg_f.jpeg");
        background-size: 100%;
        background-repeat: repeat-y;
    }


    .head_container {
        grid-column: 1;
        grid-area: header;
    }

    .main_container {
        grid-area: main;
        background-color: white;
        padding: 5dvh;
        border-radius: 0.83dvh;
        box-shadow: 0 1.1875rem 2.375rem rgba(0,0,0,0.30), 0 0.9375rem 0.75rem rgba(0,0,0,0.22);
        margin-top: 3rem;
        margin-bottom: 1dvh;
    }

    .footer_container {
        grid-area: footer;
        max-width: 100%;

    }

    @media (max-width: 1000px) {
        .parent_grid {

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
            margin-top: 10dvh;
            margin-right: 10dvh;
            margin-bottom: 5dvh;
            border-radius: 0 0.83dvh 0.83dvh 0;
            overflow: hidden;

        }
    }
</style>

<script lang="ts">
    import Header from "$lib/templates/Header.svelte";
    import Footer from "$lib/templates/Footer.svelte";
    let { children } = $props();
</script>
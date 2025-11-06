<div class="landing_grid">

    <main class="main_container">
        <h1>Willkommen auf der Landing Page</h1>
        <p>Dies ist eine einfache Startseite für dein SvelteKit-Projekt.</p>
        <p>
            Hier auf die <a href="/example_page">Beispielseite</a>
        </p>
    </main>

</div>

<style>
    .landing_grid {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 100dvh;

        background-image: url("$lib/assets/images/bg_f.jpeg");
        background-size: cover;
        background-repeat: no-repeat;
    }

    .main_container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        background-color: rgba(255, 255, 255, 0.9);
        padding: 3rem;
        margin: 2rem auto;
        height: 80dvh;
        border-radius: 0.75rem;
        max-width: 600px;

        font-family: Arial, Helvetica, sans-serif;
        text-align: center;
        box-shadow: 0 1rem 2rem rgba(0,0,0,0.2);
    }

    a {
        color: #0077cc;
        text-decoration: none;
        font-weight: bold;
    }

    a:hover {
        text-decoration: underline;
    }

    /*.footer_container {
        width: 100%;
    }*/

    html, body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        width: 100%;
    }
</style>

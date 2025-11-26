<!--*implement landing page here***
    links to be included:


********************************-->
<script lang="ts">
   import {goto} from '$app/navigation'
    function goStudent(){
        goto('/student_landing_page_id5');
    }
    function goTeacher() {
        goto('/login_page_id2');
    }

    function goParent() {
        goto('/parents_landing_page_id4');
    }

    function goLogin() {
        goto('/login_page_id2');
    }
</script>
<div class="landing_grid">

    <main class="main_container">
                <header>
                    <h1 class="start-title">Willkommen in der HSGG-Lernwelt</h1>
                    <p class="start-subtitle">
                        Deine digitale Umgebung zum Lernen, Üben und Begleiten.
                    </p>
                </header>

                <section class="start-roles">
                    <h2 class="start-roles-title">Wie möchtest du starten?</h2>

                    <div class="start-roles-grid">
                        <button class="role-card" type="button" on:click={goStudent}>
                            <span class="role-icon">🧒</span>
                            <span class="role-title">Ich bin Schüler*in</span>
                            <span class="role-text">
                                Spiele, Weekly-Tests und Lernmaterialien für deine Klasse.
                            </span>
                        </button>

                        <button class="role-card" type="button" on:click={goTeacher}>
                            <span class="role-icon">👩‍🏫</span>
                            <span class="role-title">Ich bin Lehrperson</span>
                            <span class="role-text">
                                Klassen, Materialien und Lernfortschritt deiner Schüler*innen.
                            </span>
                        </button>

                        <button class="role-card" type="button" on:click={goParent}>
                            <span class="role-icon">👨‍👩‍👧</span>
                            <span class="role-title">Ich bin Elternteil</span>
                            <span class="role-text">
                                Überblick über Lernstand und Angebote für Ihr Kind.
                            </span>
                        </button>
                    </div>
                </section>

                <footer class="start-footer">
                    <button class="start-login-btn" type="button" on:click={goLogin}>
                        Schon registriert? Hier einloggen
                    </button>
                </footer>

    </main>
</div>
<style>
    .landing_grid {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 100dvh;

        background-image: url("../lib/assets/images/bg_f.jpeg");
        background-size: cover;
        background-repeat: no-repeat;
    }
    .main_container {
        display: flex;
        flex-direction: column;
        align-items: center;

        background-color: rgba(255, 255, 255, 0.9);
        padding: clamp(1.5rem, 4vw, 3rem);
        margin: 1.5rem auto;
        width: min(95%, 600px);
        height: auto;

        border-radius: 0.75rem;
        font-family: Arial, Helvetica, sans-serif;
        text-align: center;
        box-shadow: 0 1rem 2rem rgba(0,0,0,0.2);
    }

    .start-title {
        font-size: clamp(2.2rem, 4vw, 3rem);
        margin-top: -1rem;
        margin-bottom: 0.8rem;
        font-weight: 700;
    }

    .start-subtitle {
        font-size: clamp(1.1rem, 2vw, 1.4rem);
        color: #444;
        margin-bottom: 2rem;
    }

    .start-roles {
        margin-top: clamp(1.8rem, 3vw, 2.3rem);
    }

    .start-roles-title {
        font-size: clamp(1.4rem, 3vw, 2rem);
        margin-bottom: 1.5rem;
        font-weight: 600;
    }

    .start-roles-grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
    }

    @media (max-width: 800px) {
        .start-roles-grid {
            grid-template-columns: 1fr;
        }
    }

    .role-card {
        border: none;
        border-radius: 0.9rem;
        background: #f3be6a;
        padding: 1rem 1.1rem;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
    }

    .role-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(15, 41, 64, 0.18);
    }

    .role-icon {
        font-size: clamp(1.4rem, 3vw, 2rem);
    }

    .role-title {
        font-weight: 700;
        font-size: clamp(0.9rem, 2.2vw, 1.2rem);
    }

    .role-text {
        font-size: clamp(0.8rem, 1.8vw, 1rem);
    }

    .start-footer {
        margin-top: clamp(1.5rem, 3vw, 2rem);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
    }

    .start-login-btn {
        border-radius: 999px;
        padding: 0.55rem 1.6rem;
        border: 1px solid #236c93;
        background: #236c93;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
    }

    .start-login-btn:hover {
        opacity: 0.9;
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

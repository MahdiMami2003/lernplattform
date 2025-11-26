<script>
    import { supabase } from "$lib/supabaseClient.js";
    import { onMount } from "svelte";


    let role = $state(null);
    let userId = $state(null);

    onMount(async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
            console.error("Fehler beim Holen des Users:", error);
            return;
        }

        userId = data.user.id;

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, role")      // hier 'id', nicht 'uuid'
            .eq("id", data.user.id)  // mit der auth-UID vergleichen
            .single();

        if (profileError) {
            console.error("Fehler beim Holen des Profils:", profileError);
            return;
        }

        console.log("Gefundenes Profil:", profile);
        role = profile.role;         // z.B. "teacher" oder "admin"
    });
</script>
<div id="placeholder">
    <h1 class="überschrift">Lehrpersonen-Dashboard</h1>
    <p class="untertitel">
        Hier sehen Sie Ihre Klassen, Fächer und können Lernmaterialien bearbeiten
    </p>
    <div class="tipps">
        <h2>Pädagogische Tipps</h2>
        <div class="tipps-grid">
            <p>Lernstrategien zur Unterstützung Ihrer Schüler
                <button class="small-btn">Tipps bearbeiten</button>
            </p>

        </div>
    </div>
    <section class="classes-section">
        <h2>Ihre Klassen & Fächer</h2>

        <div class="class-grid">
            <!-- Klasse 5a -->
            <article class="class-card">
                <h3>Klasse 5a</h3>
                <p class="class-info">Fächer:</p>
                <ul>
                    <li>
                        Mathematik
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Deutsch
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Biologie
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                </ul>
            </article>

            <!-- Klasse 5b -->
            <article class="class-card">
                <h3>Klasse 5b</h3>
                <p class="class-info">Fächer:</p>
                <ul>
                    <li>
                        Mathematik
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Deutsch
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Biologie
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                </ul>
            </article>

            <!-- Klasse 5c -->
            <article class="class-card">
                <h3>Klasse 5c</h3>
                <p class="class-info">Fächer:</p>
                <ul>
                    <li>
                        Mathematik
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Deutsch
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                    <li>
                        Biologie
                        <button class="small-btn">Lernmaterial bearbeiten</button>
                    </li>
                </ul>
            </article>
        </div>
    </section>

    {#if role === "admin"}
        <div class="admin-panel" id="adminPanel">
            <h2>Admin-Verwaltung</h2>
            <p>Hier können Sie Nutzer, Klassen und Berechtigungen verwalten.</p>
            <button class="admin-btn">Benutzer verwalten</button>
            <button class="admin-btn">Klassen verwalten</button>
            <button class="admin-btn">Berechtigungen bearbeiten</button>
        </div>
    {/if}
</div>

<style>
    #placeholder {
        min-height: 100vh;
    }
    .überschrift {
        display: flex;
        justify-content: center;
        font-size: clamp(1.8rem, 4vw, 4rem);
        text-align: center;
    }
    .untertitel{
        display: flex;
        justify-content: center;
        font-size: clamp(0.9rem, 2.2vw, 1.4rem);
        margin-top: clamp(0.5rem, 2vw, 2rem);
        text-align: center;
    }
    .tipps-grid{
        background-color: #F5F5DC;
        border-radius: 0.9rem;
        border: 1px solid #D5DFEC;
        font-size: clamp(0.8rem, 1.8vw, 1rem);
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
    }
    .class-card {
        background-color: #F5F5DC;
        border-radius: 0.9rem;
        padding: 1rem 1.2rem;
        border: 1px solid #D5DFEC;
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
        font-size: clamp(0.8rem, 1.8vw, 1rem);
    }
    .class-grid{
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 5rem;
    }
    .class-card ul {
        margin: 0;
        padding-left: 1rem;
        font-size: 0.9rem;
    }
    .small-btn {
        font-size: clamp(0.7rem, 1.5vw, 0.9rem);
        border-color: #4CAF50;
        cursor: pointer;
    }
    .admin-panel {
        margin-top: 3rem;
        padding: 1.5rem;
        background-color: #F3BE6A;
        border: 2px solid #d8b16c;
        border-radius: 1rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        max-width: 700px;
    }
    .admin-btn {
        display: inline-block;
        margin: 0.5rem 0.5rem 0 0;
        padding: 0.6rem 1.2rem;
        background-color: beige;
        border: none;
        color: black;
        font-weight: 600;
        border-radius: .6rem;
        cursor: pointer;
    }
    div{
        margin: 0;
    }
</style>

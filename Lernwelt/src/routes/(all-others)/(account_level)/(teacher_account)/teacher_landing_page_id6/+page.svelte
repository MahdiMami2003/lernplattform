<script>

    import { onMount } from "svelte";


    let { data } = $props();

    let { supabase, session } = data;

    let role = $state(null);
    let userId = $state(null);
    let classes = $state([]);

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
        } else {
            console.log("Gefundenes Profil:", profile);
            role = profile.role;         // z.B. "teacher" oder "admin"
        }
        // 3. Klassen holen (Dynamisch aus der DB)
        const { data: classesData, error: classesError } = await supabase
            .from("classes")
            .select("*")
            .order("name", { ascending: true }); // Sortiert nach Namen (5a, 5b...)

        if (classesError) {
            console.error("Fehler beim Laden der Klassen:", classesError);
        } else {
            classes = classesData;
        }
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
                <a href="/pedagogy_page_id10"><button class="small-btn">Tipps bearbeiten</button></a>
            </p>

        </div>
    </div>
    <section class="classes-section">
        <h2>Ihre Klassen & Fächer</h2>

        <div class="class-grid">
            {#if classes.length === 0}
                <p>Lade Klassen oder keine Klassen vorhanden...</p>
            {:else}
                {#each classes as schoolClass}
                    <article class="class-card">
                        <h3>
                            <a href="/class_page_id9/{schoolClass.id}" class="class-link">
                                {schoolClass.name}
                            </a>
                        </h3>
                        <p class="class-info">Fächer:</p>
                        <ul>
                            <li>
                                Mathematik
                                <a href="/material_page_id14"><button class="small-btn">Bearbeiten</button></a>
                            </li>
                            <li>
                                Deutsch
                                <a href="/material_page_id14"><button class="small-btn">Bearbeiten</button></a>
                            </li>
                            <li>
                                Biologie
                                <a href="/material_page_id14"><button class="small-btn">Bearbeiten</button></a>
                            </li>
                        </ul>
                    </article>
                {/each}
            {/if}
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

    .class-link {
        text-decoration: none;
        color: inherit;
        transition: color 0.2s;
    }
    .class-link:hover {
        color: #d89c48; /* Ein etwas dunklerer Ton beim Hover */
        text-decoration: underline;
    }
    /* ---- Grundlayout ---- */
    #placeholder {
        min-height: 100vh;
        font-family: "Inter", Arial, Helvetica, sans-serif;
        padding-bottom: 2rem;
    }

    /* ---- Titel ---- */
    .überschrift {
        display: flex;
        justify-content: center;
        font-size: clamp(1.8rem, 4vw, 3rem);
        font-weight: 700;
        text-align: center;
    }

    .untertitel {
        display: flex;
        justify-content: center;
        font-size: clamp(1rem, 2vw, 1.4rem);
        margin-top: clamp(0.5rem, 2vw, 2rem);
        color: #444;
        text-align: center;
    }

    /* ---- Tipps ---- */
    .tipps-grid {
        background-color: #fbead7;
        border-radius: 1.2rem;
        border: 1px solid #ffeed8;
        padding: 1rem 1.2rem;
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
    }

    /* ---- Klassenübersicht ---- */
    .class-grid {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .class-card {
        background-color: #fbead7;
        border-radius: 1.2rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid #ffeed8;
        box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
        font-size: clamp(0.9rem, 1.8vw, 1rem);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .class-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(15, 41, 64, 0.18);
    }

    .class-card ul {
        margin: 0;
        padding-left: 1rem;
    }

    .class-card li {
        margin-bottom: 0.75rem; /* <-- verhindert Überlappung */
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* ---- Buttons klein ---- */
    .small-btn {
        padding: 0.35rem 0.9rem;
        background-color: #f4d4b3;
        font-size: clamp(0.75rem, 1.5vw, 0.9rem);
        border: 1px solid #f3b06a;
        color: #000;
        border-radius: 999px; /* <-- deutlich runder */
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s, transform 0.15s;
    }

    .small-btn:hover {
        background-color: #efc48b;
        transform: translateY(-1px);
    }

    /* ---- Admin Panel ---- */
    .admin-panel {
        margin-top: 3rem;
        padding: 1.8rem;
        background-color: #f3be6a;
        border: 2px solid #d8b16c;
        border-radius: 1.2rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.12);
        max-width: 700px;
    }

    .admin-btn {
        margin: 0.5rem 0.5rem 0 0;
        padding: 0.65rem 1.3rem;
        background-color: #f3e7d9;
        border: 1px solid #e2d2c0;
        color: #000;
        font-weight: 600;
        border-radius: 999px; /* <-- auch hier schön rund */
        cursor: pointer;
        transition: background 0.2s, transform 0.15s;
    }

    .admin-btn:hover {
        background-color: #ecdac4;
        transform: translateY(-2px);
    }

    /* ---- Reset ---- */
    div {
        margin: 0;
    }

</style>

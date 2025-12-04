<script>
    let { data } = $props();

    let { supabase, session } = data;
</script>

<div class="landing-wrapper">

    <div class="hero-section">
        <h1>Willkommen in der <span class="highlight">HSGG-Lernwelt</span></h1>
        <p class="subtitle">
            Deine Schule als Spiel. Sammle XP, löse Missionen und verfolge deinen Fortschritt – gemeinsam mit Lehrern und Eltern.
        </p>

        <div class="cta-buttons">
            <a href="/login_page_id2" class="btn btn-primary">Anmelden</a>
            <a href="/register_page_id3" class="btn btn-secondary">Konto erstellen</a>
        </div>
    </div>

    <div class="quick-access-grid">
        <a href="/material_page_id14" class="access-card learning">
            <div class="access-icon">📖</div>
            <div class="access-content">
                <h2>Lerninhalte</h2>
                <p>Entdecke unsere Fächer und Materialien.</p>

            </div>
        </a>

        <a href="/appointments_page_id8" class="access-card dates">
            <div class="access-icon">📅</div>
            <div class="access-content">
                <h2>Termine & Aktuelles</h2>
                <p>Verpasse keine Events und Neuigkeiten.</p>

            </div>
        </a>
    </div>

    <h3 class="section-title">So funktioniert es</h3>
    <div class="features-grid">

        <div class="feature-card student">
            <div class="icon">🎓</div>
            <h3>Für Schüler*innen</h3>
            <p>Mach Lernen zum Abenteuer! Erstelle deinen Avatar, erledige Missionen für deine Klasse und level dich hoch.</p>
        </div>

        <div class="feature-card teacher">
            <div class="icon">📚</div>
            <h3>Für Lehrpersonen</h3>
            <p>Verwalte deine Klassen digital. Erstelle spannende Aufgaben und behalte den Lernfortschritt im Blick.</p>
        </div>

        <div class="feature-card parent">
            <div class="icon">👨‍👩‍👧‍👦</div>
            <h3>Für Eltern</h3>
            <p>Sei Teil der Lernreise. Verknüpfe dich mit deinem Kind und feiere gemeinsam erreichte Meilensteine.</p>
        </div>

    </div>

</div>

<style>
    .landing-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 3rem;
        text-align: center;
    }

    /* --- Hero Section --- */
    .hero-section {
        padding: 3rem 1rem;
        background: linear-gradient(135deg, #fdfbf7 0%, #fff 100%);
        border-radius: 12px;
        border: 1px solid #f3be6a;
        box-shadow: 0 4px 20px rgba(243, 190, 106, 0.15);
    }

    h1 {
        font-size: 2.5rem;
        color: #236C93;
        margin-bottom: 1rem;
        line-height: 1.2;
    }

    .highlight {
        color: #236C93;
        text-shadow: 1px 1px 0px #236C93;
    }

    .subtitle {
        font-size: 1.1rem;
        color: #555;
        max-width: 600px;
        margin: 0 auto 2rem auto;
        line-height: 1.6;
    }

    .cta-buttons {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .btn {
        text-decoration: none;
        padding: 0.8rem 2rem;
        border-radius: 8px;
        font-weight: bold;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 1rem;
    }

    .btn:hover { transform: translateY(-3px); }

    .btn-primary {
        background-color: #236C93;
        color: white;
        border: 2px solid #236C93;
        box-shadow: 0 4px 10px rgba(35, 108, 147, 0.3);
    }

    .btn-secondary {
        background-color: white;
        color: #236C93;
        border: 2px solid #236C93;
    }
    .btn-secondary:hover { background-color: #f0f8ff; }


    /* --- NEU: Quick Access Grid (Lerninhalte & Termine) --- */
    .quick-access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* Zwei Spalten */
        gap: 2rem;
        margin-top: -1rem; /* Etwas näher an den Hero ziehen */
    }

    .access-card {
        text-decoration: none;
        background: white;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        text-align: left;
        transition: all 0.2s ease;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        position: relative;
        overflow: hidden;
    }

    .access-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        border-color: #236C93;
    }

    /* Farbige Akzente links */
    .access-card.learning { border-left: 5px solid #f3be6a; } /* Gold */
    .access-card.dates { border-left: 5px solid #236C93; }    /* Blau */

    .access-icon {
        font-size: 2.5rem;
        background: #f9f9f9;
        width: 60px;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
    }

    .access-content h2 { margin: 0 0 0.3rem 0; color: #333; font-size: 1.3rem; }
    .access-content p { margin: 0; color: #666; font-size: 0.95rem; }

    .arrow {
        position: absolute;
        right: 1.5rem;
        font-size: 1.5rem;
        color: #ccc;
        transition: color 0.2s, right 0.2s;
    }

    .access-card:hover .arrow {
        color: #236C93;
        right: 1rem; /* Kleine Animation nach rechts */
    }


    /* --- Feature Grid --- */
    .section-title { margin-top: 2rem; font-size: 1.5rem; color: #888; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem; }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .feature-card {
        background: #fff;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        transition: transform 0.3s ease;
        border-top: 5px solid transparent;
    }

    .feature-card:hover { transform: translateY(-5px); }

    .feature-card.student { border-top-color: #f3be6a; }
    .feature-card.teacher { border-top-color: #236C93; }
    .feature-card.parent { border-top-color: #66bb6a; }

    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h3 { color: #333; margin-bottom: 0.8rem; font-size: 1.3rem; }
    .feature-card p { color: #666; line-height: 1.5; font-size: 0.95rem; }

    /* Mobile Anpassung */
    @media (max-width: 700px) {
        h1 { font-size: 2rem; }
        .cta-buttons { flex-direction: column; width: 100%; }
        .btn { width: 100%; text-align: center; }

        /* Quick Access auf Handy untereinander */
        .quick-access-grid { grid-template-columns: 1fr; }
    }
</style>
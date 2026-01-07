<!-- Lernwelt/src/routes/(all-others)/(account_level)/(no_login_required)/no_login_page_id7/+page.svelte -->
<script>
    let { data } = $props();

    let { supabase, session } = data;
</script>

<div class="landing-wrapper">
    <div class="hero-section">
        <h1>Willkommen in der <span class="highlight">HSGG-Lernwelt</span></h1>
        <p class="subtitle">
            Deine Schule als Spiel. Sammle XP, löse Missionen und verfolge deinen Fortschritt – gemeinsam
            mit Lehrern und Eltern.
        </p>

        <div class="cta-buttons">
            <a href="/" class="btn btn-primary">Anmelden</a>
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
            <p>
                Mach Lernen zum Abenteuer! Erstelle deinen Avatar, erledige Missionen für deine Klasse und
                level dich hoch.
            </p>
        </div>

        <div class="feature-card teacher">
            <div class="icon">📚</div>
            <h3>Für Lehrpersonen</h3>
            <p>
                Verwalte deine Klassen digital. Erstelle spannende Aufgaben und behalte den Lernfortschritt
                im Blick.
            </p>
        </div>

        <div class="feature-card parent">
            <div class="icon">👨‍👩‍👧‍👦</div>
            <h3>Für Eltern</h3>
            <p>
                Sei Teil der Lernreise. Verknüpfe dich mit deinem Kind und feiere gemeinsam erreichte
                Meilensteine.
            </p>
        </div>
    </div>
</div>

<style>
    /* ============ DARK MODE SUPPORT ============ */
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
        background: linear-gradient(135deg, var(--bg-card, #fdfbf7) 0%, var(--bg-card, #fff) 100%);
        border-radius: 12px;
        border: 1px solid #f3be6a;
        box-shadow: 0 4px 20px rgba(243, 190, 106, 0.15);
        transition: all 0.3s ease;
    }

    :root.darkmode .hero-section {
        background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%);
        box-shadow: 0 4px 20px rgba(243, 190, 106, 0.1);
    }

    h1 {
        font-size: 2.5rem;
        color: #236c93;
        margin-bottom: 1rem;
        line-height: 1.2;
        transition: color 0.3s ease;
    }

    :root.darkmode h1 {
        color: #4a9fc7;
    }

    .highlight {
        color: #236c93;
        text-shadow: 1px 1px 0px #236c93;
        transition: all 0.3s ease;
    }

    :root.darkmode .highlight {
        color: #4a9fc7;
        text-shadow: 1px 1px 0px #4a9fc7;
    }

    .subtitle {
        font-size: 1.1rem;
        color: var(--text-secondary, #555);
        max-width: 600px;
        margin: 0 auto 2rem auto;
        line-height: 1.6;
        transition: color 0.3s ease;
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
        transition: all 0.2s ease;
        font-size: 1rem;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .btn:hover {
        transform: translateY(-3px);
    }

    .btn:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    .btn-primary {
        background-color: #236c93;
        color: white;
        border: 2px solid #236c93;
        box-shadow: 0 4px 10px rgba(35, 108, 147, 0.3);
    }

    .btn-primary:hover {
        background-color: #1d5875;
        border-color: #1d5875;
    }

    .btn-secondary {
        background-color: var(--bg-card, white);
        color: #236c93;
        border: 2px solid #236c93;
        transition: all 0.2s ease;
    }

    .btn-secondary:hover {
        background-color: var(--bg-hover, #f0f8ff);
    }

    :root.darkmode .btn-secondary {
        color: #4a9fc7;
        border-color: #4a9fc7;
    }

    /* --- Quick Access Grid (Lerninhalte & Termine) --- */
    .quick-access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: -1rem;
    }

    .access-card {
        text-decoration: none;
        background: var(--bg-card, white);
        border: 1px solid var(--border-color, #eee);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        text-align: left;
        transition: all 0.2s ease;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        position: relative;
        overflow: hidden;
    }

    .access-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        border-color: #236c93;
    }

    :root.darkmode .access-card:hover {
        border-color: #4a9fc7;
    }

    .access-card:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    /* Farbige Akzente links - bleiben in beiden Modi */
    .access-card.learning {
        border-left: 5px solid #f3be6a;
    }

    .access-card.dates {
        border-left: 5px solid #236c93;
    }

    :root.darkmode .access-card.dates {
        border-left: 5px solid #4a9fc7;
    }

    .access-icon {
        font-size: 2.5rem;
        background: var(--bg-hover, #f9f9f9);
        width: 60px;
        height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        transition: background-color 0.3s ease;
    }

    .access-content h2 {
        margin: 0 0 0.3rem 0;
        color: var(--text-primary, #333);
        font-size: 1.3rem;
        transition: color 0.3s ease;
    }

    .access-content p {
        margin: 0;
        color: var(--text-secondary, #666);
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    .arrow {
        position: absolute;
        right: 1.5rem;
        font-size: 1.5rem;
        color: var(--text-muted, #ccc);
        transition: all 0.2s ease;
    }

    .access-card:hover .arrow {
        color: #236c93;
        right: 1rem;
    }

    :root.darkmode .access-card:hover .arrow {
        color: #4a9fc7;
    }

    /* --- Feature Grid --- */
    .section-title {
        margin-top: 2rem;
        font-size: 1.5rem;
        color: var(--text-muted, #888);
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 0.9rem;
        transition: color 0.3s ease;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .feature-card {
        background: var(--bg-card, #fff);
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
        border-top: 5px solid transparent;
    }

    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    /* Farbige Top-Borders bleiben in beiden Modi */
    .feature-card.student {
        border-top-color: #f3be6a;
    }

    .feature-card.teacher {
        border-top-color: #236c93;
    }

    :root.darkmode .feature-card.teacher {
        border-top-color: #4a9fc7;
    }

    .feature-card.parent {
        border-top-color: #66bb6a;
    }

    .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    h3 {
        color: var(--text-primary, #333);
        margin-bottom: 0.8rem;
        font-size: 1.3rem;
        transition: color 0.3s ease;
    }

    .feature-card p {
        color: var(--text-secondary, #666);
        line-height: 1.5;
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 700px) {
        h1 {
            font-size: 2rem;
        }

        .cta-buttons {
            flex-direction: column;
            width: 100%;
        }

        .btn {
            width: 100%;
            text-align: center;
        }

        /* Quick Access auf Handy untereinander */
        .quick-access-grid {
            grid-template-columns: 1fr;
        }

        .hero-section {
            padding: 2rem 1rem;
        }

        .feature-card {
            padding: 1.5rem;
        }
    }
</style>
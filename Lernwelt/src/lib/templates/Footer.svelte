<!--Lernwelt/src/lib/templates/Footer.svelte-->
<footer>
    <div class="footer-content">
        <span class="copyright">© 2025 HSG-Lernwelt</span>
        <nav class="footer-nav">
            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
            <a href="/barrierefreiheit">Barrierefreiheit</a>
        </nav>
    </div>
</footer>

<style>
    footer {
        padding: 2rem 2.5rem; /* Passt zum --main-padding [cite: 5] */
        background-color: #2c2c2c; /* Dunkler, neutraler Hintergrund */
        color: #ccc;
        font-family: Arial, Helvetica, sans-serif;
        box-sizing: border-box;
    }

    .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap; /* Für den Fall, dass es eng wird */
        gap: 1.5rem;
    }

    .copyright {
        font-size: 0.9rem;
    }

    .footer-nav {
        display: flex;
        gap: 1.5rem;
    }

    .footer-nav a {
        color: #ccc;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .footer-nav a:hover {
        /* Benutzt die Header-Farbe (aus unserem Chatverlauf) für Konsistenz */
        color: #f0be71;
        text-decoration: underline;
    }

    /* Passt zum Breakpoint deines Layouts [cite: 13] */
    @media (max-width: 1000px) {
        footer {
            width: 100%;

        }
        .footer-content {
            flex-direction: column; /* Stapelt alles vertikal */
            align-items: center;
            gap: 1rem;
        }
    }
    @media (max-width: 320px) {

    }
</style>
<script lang="ts">
    import { page } from '$app/stores';
    import { breadService } from '$lib/breadService.svelte';
    import { afterNavigate } from '$app/navigation';

    // 1. Statisches Mapping für EXAKTE Ordnernamen/Routen
    const routeMap: Record<string, string> = {
        '/': 'Home',
        '/login_page_id2': 'Login',
        '/register_page_id3': 'Registrierung',
        '/imprint_page_id15': 'Impressum',
        '/datenschutz': 'Datenschutz',
        '/barrierefreiheit': 'Barrierefreiheitserklärung',
        '/impressum': 'Impressum',

        // no_login_required
        '/material_page_id14': 'Lernmaterialien',
        '/no_login_page_id7': 'Gastzugang',

        //parent_account
            //pedagogic_tipps
            '/pedagogic_content': 'Tipp',
            '/pedagogic_form': 'Tipp erstellen',
            '/pedagogy_page_id10': 'Pädagogische Tipps',
        '/appointments_page_id8': 'Termine',
        '/create_appointments_page': 'Termin erstellen',
        '/parents_landing_page_id4': 'Eltern-Dashboard',

        //student_account
            //tests + games
            '/game_page_id12': 'Lernspiele',
            '/deutsch_game' : 'Spiel: Deutsch',
            '/mathe_game' : 'Spiel: Mathe',
            '/englisch_game' : 'Spiel: Englisch',
            '/physik_game' : 'Spiel: Physik',
            '/weekly_test_page_id17' : 'Wochentests',
        '/progress_page_id11': 'Lernfortschritt',
        '/student_landing_page_id5': 'SuS-Dashboard',

        //teacher_account
        '/weekly_test_page': 'Wochentests',
        '/form_for_adding_content': 'Inhalte hinzufügen',
        '/form_for_adding_weekly_test': 'Wochentest erstellen',
        '/game_management': 'Spiele verwalten',
        '/teacher_landing_page_id6': 'Lehrpersonen-Dashboard',
    };

    // 2. Intelligente Namensfindung
    function getReadableName(path: string): string {
        // Schritt A: Pfad bereinigen (Trailing Slash entfernen, Query-Params ignorieren)
        // '/teacher_landing_page_id6/' wird zu '/teacher_landing_page_id6'
        let cleanPath = path.split('?')[0];
        if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
            cleanPath = cleanPath.slice(0, -1);
        }

        // Schritt B: Exakter Treffer in der Map?
        if (routeMap[cleanPath]) {
            return routeMap[cleanPath];
        }

        // Schritt C: Teil-Treffer Logik für Unterseiten (Dynamic Routes)
        // Beispiel: /materials_content_page_16/123 -> Das ist nicht in der Map, da dynamisch

        if (path.includes('materials_content_page_16')) return 'Material';
        if (path.includes('weekly_test_content_page')) return 'Wochentest';
        if (path.includes('class_page_id9')) return 'Klassenzimmer';

        // Schritt D: Generischer Fallback
        // Versucht aus "/mein_ordner_name_id5" -> "Mein Ordner Name" zu machen
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments.pop();

        if (!lastSegment) return 'Seite';

        // Wenn das Segment eine reine ID ist (z.B. .../123), nehmen wir den Ordner davor
        if (!isNaN(Number(lastSegment)) && segments.length > 0) {
            const parentSegment = segments.pop();
            return `Detail (${cleanName(parentSegment || '')})`;
        }

        return cleanName(lastSegment);
    }

    // Hilfsfunktion zum Aufräumen von Strings für den Fallback
    function cleanName(segment: string): string {
        return segment
            .replace(/_id\d+/g, '') // Entfernt IDs wie "_id6" aus dem Namen
            .replace(/_page/g, '')  // Entfernt "_page"
            .replace(/_/g, ' ')     // Unterstriche zu Leerzeichen
            .replace(/\b\w/g, c => c.toUpperCase()); // Erster Buchstabe groß
    }

    // Wir nutzen afterNavigate, um sicherzustellen, dass die Navigation abgeschlossen ist
    afterNavigate(({ to, from }) => {
        // Wenn Navigation abgebrochen wurde oder ungültig ist
        if (!to) return;

        const currentPath = to.url.pathname;
        const label = getReadableName(currentPath);

        // Wir rufen die neue Update-Logik auf
        breadService.update(label, to.url, from?.url);
    });
</script>

<!-- UI -->
{#if breadService.crumbs.length > 0}
    <div class="bread-bar">
        {#each breadService.crumbs as crumb, index}
            <!-- Link rendern -->
            <a
                    href={crumb.href}
                    class:current={index === breadService.crumbs.length - 1}
                    aria-current={index === breadService.crumbs.length - 1 ? 'page' : undefined}
                    title={crumb.label}
            >
                <!-- Bei Home ein Icon statt Text anzeigen (optional, sieht oft sauberer aus) -->
                {#if crumb.path === '/'}
                    <i class="fa-solid fa-house"></i>
                    <span class="sr-only">Home</span>
                {:else}
                    {crumb.label}
                {/if}
            </a>

            <!-- Separator (nicht nach dem letzten Element) -->
            {#if index < breadService.crumbs.length - 1}
                <span class="separator"><i class="fa-solid fa-chevron-right"></i></span>
            {/if}
        {/each}
    </div>
{/if}
<style>
    /* Definiere die Höhe der Breadcrumb-Leiste hier als Variable,
       damit du sie leicht ändern kannst.
    */
    :root {
        --bread-height: 32px;
    }



    .bread-bar {
        position: fixed;
        font-family: Arial, Helvetica, sans-serif;
        top: var(--header-height, 80px);
        left: 0;
        width: 100%;
        height: var(--bread-height);

        background-color: #faeacc;
        border-bottom: 1px solid #e0cdb0;

        /* Flexbox erzwingt, dass die Elemente NEBENEINANDER stehen */
        display: flex;
        align-items: center;

        padding: 0 1rem;
        box-sizing: border-box;

        /* Z-Index muss niedriger sein als der Header (meist 1000),
           aber höher als der Seiteninhalt (0) */
        z-index: 990;

        overflow-x: auto; /* Scrollbar, falls Pfad zu lang */
        white-space: nowrap;
    }

    a {
        text-decoration: none;
        color: var(--text-secondary);
        transition: color 0.2s ease;
        display: flex;
        align-items: center;
        white-space: nowrap;
    }

    a:hover:not(.current) {
        color: var(--text-primary);
        text-decoration: underline;
        background-color: var(--bg-hover);
    }

    /* Aktive Seite (letztes Element) */
    a.current {
        font-weight: bold;
        color: var(--text-primary);
        pointer-events: none;
        cursor: default;
        text-decoration: none;
        cursor: default;
    }

    /* ============ SEPARATOR ============ */
    .separator {
        margin: 0 0.5rem;
        color: var(--text-muted);
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Hilfsklasse für Screenreader (für das Home-Icon) */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
    }
</style>
<!--Lernwelt/src/lib/Breadcrumbs.svelte-->
<script lang="ts">
    import { breadService } from '$lib/breadService.svelte';
    import { afterNavigate } from '$app/navigation'; // Wichtig: Wir holen afterNavigate zurück
    import { _ } from '$lib/i18n/config';

    // ---------------------------------------------------------
    // 1. LOGIK FÜR NAVIGATIONS-STRUKTUR (Pfad aufbauen)
    // ---------------------------------------------------------
    // Wird nur ausgeführt, wenn man wirklich die Seite wechselt.
    // Das garantiert, dass die "Kette" (Home > Seite A > Seite B) erhalten bleibt.
    afterNavigate(({ to, from }) => {
        if (!to) return;

        // Wir holen den Namen in der *aktuellen* Sprache
        const label = getReadableName(to.url.pathname);

        // Wir übergeben 'from', damit der Service weiß, ob er anhängen oder abschneiden muss
        breadService.update(label, to.url, from?.url);
    });

    // ---------------------------------------------------------
    // 2. LOGIK FÜR SPRACHWECHSEL (Texte aktualisieren)
    // ---------------------------------------------------------
    // Dieser Effekt feuert JEDES MAL, wenn sich $_ (die Sprache) ändert.
    // Er repariert die Labels aller vorhandenen Breadcrumbs.
    $effect(() => {
        // Wir abonnieren die Sprachänderung

        // Wir gehen durch ALLE existierenden Crumbs und übersetzen sie neu.
        // Wir ändern NICHT die Struktur (Länge des Arrays), nur die Labels.
        breadService.crumbs.forEach((crumb, index) => {
            // Wir brauchen den Pfad des Crumbs, um den Namen neu zu berechnen
            // (Wir nehmen an, dein Crumb-Objekt hat 'path' oder wir extrahieren es aus href)
            const pathForName = crumb.path || new URL(crumb.href).pathname;

            // Label aktualisieren
            breadService.crumbs[index].label = getReadableName(pathForName);
        });
    });

    // ---------------------------------------------------------
    // 3. NAMENS-FINDUNG (Bleibt fast gleich)
    // ---------------------------------------------------------
    function getReadableName(path: string): string {
        let cleanPath = path.split('?')[0];
        if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
            cleanPath = cleanPath.slice(0, -1);
        }

        // Map wird bei Aufruf frisch generiert
        const routeMap: Record<string, string> = {
            '/': $_('breadcrumbs.home'),
            '/login_page_id2': $_('breadcrumbs.login'),
            '/register_page_id3': $_('breadcrumbs.register'),
            '/imprint_page_id15': $_('breadcrumbs.imprint'),
            '/datenschutz': $_('breadcrumbs.privacy'),
            '/accessibility': $_('breadcrumbs.accessibility'),
            '/impressum': $_('breadcrumbs.imprint'),
            '/agb': $_('breadcrumbs.agb'),



            // no_login_required
            '/material_page_id14': $_('breadcrumbs.learning_materials'),
            '/no_login_page_id7': $_('breadcrumbs.guest_access'),
            '/no_permission_page_id18': $_('breadcrumbs.access_denied'),

            //admin_account
            '/admin_dashboard_page_id13': $_('breadcrumbs.admin_dashboard'),


            //parent_account
            '/pedagogic_content': $_('breadcrumbs.tip_single'),
            '/pedagogic_form': $_('breadcrumbs.tip_create'),
            '/pedagogy_page_id10': $_('breadcrumbs.tips_pedagogic'),
            '/appointments_page_id8': $_('breadcrumbs.appointments'),
            '/create_appointments_page': $_('breadcrumbs.appointments_create'),
            '/parents_landing_page_id4': $_('breadcrumbs.dashboard_parents'),

            //student_account
            '/game_page_id12': $_('breadcrumbs.games'),
            '/deutsch_game' : $_('breadcrumbs.game_german'),
            '/mathe_game' : $_('breadcrumbs.game_math'),
            '/englisch_game' : $_('breadcrumbs.game_english'),
            '/physik_game' : $_('breadcrumbs.game_physics'),
            '/weekly_test_page_id17' : $_('breadcrumbs.weekly_tests'),
            '/progress_page_id11': $_('breadcrumbs.progress'),
            '/student_landing_page_id5': $_('breadcrumbs.dashboard_student'),
            '/cloze_game': $_('breadcrumbs.cloze_test'),

            //teacher_account
            '/weekly_test_page': $_('breadcrumbs.weekly_tests'),
            '/form_for_adding_content': $_('breadcrumbs.add_content'),
            '/form_for_adding_weekly_test': $_('breadcrumbs.create_weekly_test'),
            '/game_management': $_('breadcrumbs.game_management'),
            '/mission_management': $_('breadcrumbs.mission_management'),
            '/teacher_landing_page_id6': $_('breadcrumbs.dashboard_teacher'),
            '/class_page_id9': $_('breadcrumbs.classroom_generic'),
            '/class_progress': $_('breadcrumbs.progress'),
        };

        if (routeMap[cleanPath]) return routeMap[cleanPath];

        if (path.includes('materials_content_page_16')) return $_('breadcrumbs.material_generic');
        if (path.includes('weekly_test_content_page')) return $_('breadcrumbs.weekly_test_generic');
        if (path.includes('class_page_id9')) return $_('breadcrumbs.classroom_generic');

        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments.pop();

        if (!lastSegment) return $_('breadcrumbs.page_generic');

        if (!isNaN(Number(lastSegment)) && segments.length > 0) {
            const parentSegment = segments.pop();
            return `${$_('breadcrumbs.detail_prefix')} (${cleanName(parentSegment || '')})`;
        }

        return cleanName(lastSegment);
    }

    function cleanName(segment: string): string {
        return segment
            .replace(/_id\d+/g, '')
            .replace(/_page/g, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
</script>

{#if breadService.crumbs.length > 0}
    <div class="bread-bar">
        {#each breadService.crumbs as crumb, index}
            <a
                    href={crumb.href}
                    class:current={index === breadService.crumbs.length - 1}
                    aria-current={index === breadService.crumbs.length - 1 ? 'page' : undefined}
                    title={crumb.label}
            >
                {#if crumb.path === '/'}
                    <i class="fa-solid fa-house"></i>
                    <span class="sr-only">{$_('breadcrumbs.home')}</span>
                {:else}
                    {crumb.label}
                {/if}
            </a>

            {#if index < breadService.crumbs.length - 1}
                <span class="separator" aria-hidden="true">
                    <i class="fa-solid fa-chevron-right"></i>
                </span>
            {/if}
        {/each}
    </div>
{/if}

<style>
    /* CSS bleibt gleich */
    .bread-bar {
        position: fixed;
        font-family: Arial, Helvetica, sans-serif;
        top: var(--header-height, 80px);
        left: 0;
        width: 100%;
        height: var(--bread-height, 32px);
        background-color: var(--header-bg, #faeacc);
        border-bottom: 1px solid var(--border-color, #e0cdb0);
        display: flex;
        align-items: center;
        padding: 0 1rem;
        box-sizing: border-box;
        z-index: 990;
        overflow-x: auto;
        white-space: nowrap;
        transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    a {
        text-decoration: none;
        color: var(--text-secondary, #44546a);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        white-space: nowrap;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        gap: 0.25rem;
    }

    a:hover:not(.current) {
        color: var(--text-primary, #1a1a1a);
        text-decoration: underline;
        background-color: var(--bg-hover, #f0f0f0);
    }

    a:focus-visible {
        outline: 2px solid var(--text-primary, #1a1a1a);
        outline-offset: 2px;
    }

    a.current {
        font-weight: bold;
        color: var(--text-primary, #1a1a1a);
        pointer-events: none;
        cursor: default;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .separator {
        margin: 0 0.5rem;
        color: var(--text-muted, #6a6a6a);
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s ease;
    }

    .separator i {
        color: var(--text-muted, #6a6a6a);
    }

    a i.fa-house {
        font-size: 0.9rem;
        color: var(--text-secondary, #44546a);
        transition: color 0.2s ease;
    }

    a:hover:not(.current) i.fa-house {
        color: var(--text-primary, #1a1a1a);
    }

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

    @media (max-width: 768px) {
        .bread-bar {
            font-size: 0.8rem;
            padding: 0 0.5rem;
        }

        a {
            padding: 0.2rem 0.4rem;
        }

        .separator {
            margin: 0 0.3rem;
            font-size: 0.6rem;
        }
    }

    .bread-bar::-webkit-scrollbar {
        height: 4px;
    }

    .bread-bar::-webkit-scrollbar-track {
        background: var(--bg-hover, #f0f0f0);
    }

    .bread-bar::-webkit-scrollbar-thumb {
        background: var(--border-color, #e0cdb0);
        border-radius: 2px;
    }

    .bread-bar::-webkit-scrollbar-thumb:hover {
        background: var(--text-muted, #6a6a6a);
    }
</style>
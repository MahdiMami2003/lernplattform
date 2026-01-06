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
        const label = getReadableName(to.url.pathname, $_);

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
        const translate = $_;

        // Wir gehen durch ALLE existierenden Crumbs und übersetzen sie neu.
        // Wir ändern NICHT die Struktur (Länge des Arrays), nur die Labels.
        breadService.crumbs.forEach((crumb, index) => {
            // Wir brauchen den Pfad des Crumbs, um den Namen neu zu berechnen
            // (Wir nehmen an, dein Crumb-Objekt hat 'path' oder wir extrahieren es aus href)
            const pathForName = crumb.path || new URL(crumb.href).pathname;

            // Label aktualisieren
            breadService.crumbs[index].label = getReadableName(pathForName, translate);
        });
    });

    // ---------------------------------------------------------
    // 3. NAMENS-FINDUNG (Bleibt fast gleich)
    // ---------------------------------------------------------
    function getReadableName(path: string, $t: any): string {
        let cleanPath = path.split('?')[0];
        if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
            cleanPath = cleanPath.slice(0, -1);
        }

        // Map wird bei Aufruf frisch generiert
        const routeMap: Record<string, string> = {
            '/': $t('breadcrumbs.home'),
            '/login_page_id2': $t('breadcrumbs.login'),
            '/register_page_id3': $t('breadcrumbs.register'),
            '/imprint_page_id15': $t('breadcrumbs.imprint'),
            '/datenschutz': $t('breadcrumbs.privacy'),
            '/barrierefreiheit': $t('breadcrumbs.accessibility'),
            '/impressum': $t('breadcrumbs.imprint'),

            // no_login_required
            '/material_page_id14': $t('breadcrumbs.learning_materials'),
            '/no_login_page_id7': $t('breadcrumbs.guest_access'),

            //parent_account
            '/pedagogic_content': $t('breadcrumbs.tip_single'),
            '/pedagogic_form': $t('breadcrumbs.tip_create'),
            '/pedagogy_page_id10': $t('breadcrumbs.tips_pedagogic'),
            '/appointments_page_id8': $t('breadcrumbs.appointments'),
            '/create_appointments_page': $t('breadcrumbs.appointments_create'),
            '/parents_landing_page_id4': $t('breadcrumbs.dashboard_parents'),

            //student_account
            '/game_page_id12': $t('breadcrumbs.games'),
            '/deutsch_game' : $t('breadcrumbs.game_german'),
            '/mathe_game' : $t('breadcrumbs.game_math'),
            '/englisch_game' : $t('breadcrumbs.game_english'),
            '/physik_game' : $t('breadcrumbs.game_physics'),
            '/weekly_test_page_id17' : $t('breadcrumbs.weekly_tests'),
            '/progress_page_id11': $t('breadcrumbs.progress'),
            '/student_landing_page_id5': $t('breadcrumbs.dashboard_student'),

            //teacher_account
            '/weekly_test_page': $t('breadcrumbs.weekly_tests'),
            '/form_for_adding_content': $t('breadcrumbs.add_content'),
            '/form_for_adding_weekly_test': $t('breadcrumbs.create_weekly_test'),
            '/game_management': $t('breadcrumbs.manage_games'),
            '/teacher_landing_page_id6': $t('breadcrumbs.dashboard_teacher'),
            '/no_permission_page_id18': $t('breadcrumbs.access_denied'),
        };

        if (routeMap[cleanPath]) return routeMap[cleanPath];

        if (path.includes('materials_content_page_16')) return $t('breadcrumbs.material_generic');
        if (path.includes('weekly_test_content_page')) return $t('breadcrumbs.weekly_test_generic');
        if (path.includes('class_page_id9')) return $t('breadcrumbs.classroom_generic');

        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments.pop();

        if (!lastSegment) return $t('breadcrumbs.page_generic');

        if (!isNaN(Number(lastSegment)) && segments.length > 0) {
            const parentSegment = segments.pop();
            return `${$t('breadcrumbs.detail_prefix')} (${cleanName(parentSegment || '')})`;
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
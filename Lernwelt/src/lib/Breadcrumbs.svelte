<script lang="ts">
    import { page } from '$app/stores';
    import { breadService } from '$lib/breadService.svelte';
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    // Mapping für "schöne" Namen basierend auf IDs oder Pfaden
    // In einer echten App könnte das auch aus der DB kommen
    function getReadableName(path: string, params: Record<string, string>): string {
        if (path === '/') return 'Home';
        if (path.includes('materials')) return 'Lernmaterialien';
        if (path.includes('register')) return 'Registrierung';
        if (path.includes('no_login')) return 'Ohne Login';
        if (path.includes('parents')) return 'Dashboard';
        if (path.includes('appointments')) return 'Termine';
        if (path.includes('pedagogy')) return 'Pädagogische Tipps';
        if (path.includes('game')) return 'Spielerisches Lernen';
        if (path.includes('weekly')) return 'Wochentests';
        if (path.includes('progress')) return 'Fortschritt';
        if (path.includes('student')) return 'Dashboard';
        if (path.includes('class')) return 'Klasse';
        if (path.includes('overview')) return 'Klassenübersicht';
        if (path.includes('teacher')) return 'Dashboard';
        if (path.includes('login_page_id2')) return 'Login';
        if (path.includes('imprint')) return 'Impressum';
        // Fallback: Den Pfad hübsch machen (z.B. "my_page" -> "My Page")
        const segment = path.split('/').pop() || 'Seite';
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    // Wir nutzen afterNavigate, um sicherzustellen, dass die Navigation abgeschlossen ist
    afterNavigate(() => {
        const currentPath = $page.url.pathname;
        const currentParams = $page.params;

        // Titel generieren
        // HINWEIS: Wenn du den Titel dynamisch aus der Seite (z.B. aus der DB) hast,
        // kannst du ihn auch via Store übergeben. Hier machen wir es url-basiert.
        let label = getReadableName(currentPath, currentParams);

        // Sonderfall: Wenn wir auf Home sind, alles resetten
        if (currentPath === '/') {
            breadService.reset();
            breadService.addCrumb('Home', $page.url);
        } else {
            // Wenn der Verlauf leer ist (z.B. direkter Einstieg per Link), Home erzwingen
            if (breadService.crumbs.length === 0) {
                breadService.addCrumb('Home', new URL($page.url.origin));
            }
            breadService.addCrumb(label, $page.url);
        }
    });
</script>

<!-- Das HTML für deine Leiste -->
    {#each breadService.crumbs as crumb, index}
        <a href={crumb.href} class:current={index === breadService.crumbs.length - 1}>
            {crumb.label}
        </a>

        {#if index < breadService.crumbs.length - 1}
            <span class="separator"><i class="fa-solid fa-chevron-right"></i></span>
        {/if}
    {/each}


<style>
    a {
        text-decoration: none;
        color: #44546a;
        transition: color 0.2s;
        display: flex;
        align-items: center;
    }

    a:hover {
        color: #000;
        text-decoration: underline;
    }

    /* Aktive Seite nicht klickbar machen oder hervorheben */
     a.current {
        font-weight: bold;
        color: #222;
        pointer-events: none;
        text-decoration: none;
    }

    .separator {
        margin: 0 0.5rem;
        color: #888;
        font-size: 0.7rem;
    }
</style>
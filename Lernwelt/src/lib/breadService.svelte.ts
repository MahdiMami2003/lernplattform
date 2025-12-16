import { browser } from '$app/environment';

export type Crumb = {
    label: string;
    href: string;
    path: string; // Nur der Pfad ohne Query Params zum Vergleichen
};

class BreadcrumbService {
    // Svelte 5 Rune für reaktiven State
    crumbs = $state<Crumb[]>([]);

    constructor() {
        // Beim Starten: Versuchen aus SessionStorage zu laden (für Reloads)
        if (browser) {
            const stored = sessionStorage.getItem('hsgg_breadcrumbs');
            if (stored) {
                this.crumbs = JSON.parse(stored);
            }
        }
    }

    // Diese Funktion wird bei jeder Navigation aufgerufen
    addCrumb(label: string, url: URL) {
        const newPath = url.pathname;
        const fullHref = url.pathname + url.search; // Pfad + Query Params behalten

        // 1. Prüfen: Ist es exakt die gleiche Seite (nur Reload)?
        const lastCrumb = this.crumbs[this.crumbs.length - 1];
        if (lastCrumb && lastCrumb.path === newPath && lastCrumb.href === fullHref) {
            // Es ist exakt derselbe Link (Reload) -> Nichts tun
            return;
        }

        // 2. Prüfen: Ist es die gleiche Seite, aber andere Parameter?
        // Bsp: /search?q=A -> /search?q=B
        if (lastCrumb && lastCrumb.path === newPath) {
            // Wir ersetzen den letzten Eintrag, damit die Breadcrumbs nicht unendlich lang werden
            // bei Filtern o.ä.
            this.crumbs[this.crumbs.length - 1] = { label, href: fullHref, path: newPath };
            this.save();
            return;
        }

        // 3. Prüfen: Existiert dieser Pfad schon weiter oben im Baum?
        // Bsp: Home > Material > Mathe > Aufgabe
        // User klickt auf "Material". Wir wollen nicht: Home > Material > Mathe > Aufgabe > Material
        // Sondern: Home > Material (und den Rest abschneiden)
        const existingIndex = this.crumbs.findIndex((c) => c.path === newPath);
        if (existingIndex !== -1) {
            // Schneide alles nach dem gefundenen Index ab
            this.crumbs = this.crumbs.slice(0, existingIndex + 1);
            // Update evt. Parameter, falls sie sich geändert haben
            this.crumbs[existingIndex].href = fullHref;
        } else {
            // 4. Fall: Komplette neue Seite -> Anhängen
            // Sicherheitslimit: Max 5 Ebenen, damit es mobil nicht platzt
            if (this.crumbs.length >= 5) {
                this.crumbs.shift(); // Den ältesten (nach Home) entfernen
            }
            this.crumbs.push({ label, href: fullHref, path: newPath });
        }

        this.save();
    }

    // Breadcrumbs komplett zurücksetzen (z.B. bei Logout oder Klick auf Home Logo)
    reset() {
        this.crumbs = [];
        this.save();
    }

    private save() {
        if (browser) {
            sessionStorage.setItem('hsgg_breadcrumbs', JSON.stringify(this.crumbs));
        }
    }
}

// Exportiere eine einzige Instanz (Singleton)
export const breadService = new BreadcrumbService();
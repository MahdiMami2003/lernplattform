import { browser } from '$app/environment';

export type Crumb = {
    label: string;
    href: string;
    path: string;
};

class BreadcrumbService {
    crumbs = $state<Crumb[]>([]);

    constructor() {
        if (browser) {
            const stored = sessionStorage.getItem('hsgg_breadcrumbs');
            if (stored) {
                try {
                    this.crumbs = JSON.parse(stored);
                } catch {
                    this.crumbs = [];
                }
            }
        }
    }

    /**
     * Die zentrale Logik-Methode.
     * Wird von der UI-Komponente nach der Navigation aufgerufen.
     */
    update(label: string, toUrl: URL, fromUrl?: URL | null) {
        // 1. Pfade normalisieren (Trailing Slashes entfernen für sauberen Vergleich)
        // Ausnahme: Root '/' bleibt '/'
        const toPath = toUrl.pathname === '/' ? '/' : toUrl.pathname.replace(/\/$/, '');
        const fromPath = fromUrl ? (fromUrl.pathname === '/' ? '/' : fromUrl.pathname.replace(/\/$/, '')) : null;

        const fullHref = toUrl.pathname + toUrl.search;
        const homeCrumb: Crumb = { label: 'Home', href: '/', path: '/' };
        const newCrumb: Crumb = { label, href: fullHref, path: toPath };

        // -----------------------------------------------------------
        // REGEL 1: Ziel ist HOME
        // -> Alles löschen, nur Home bleibt.
        // -----------------------------------------------------------
        if (toPath === '/') {
            this.crumbs = [homeCrumb];
            this.save();
            return;
        }

        // -----------------------------------------------------------
        // REGEL 2: Wir kommen von HOME (oder from ist null beim Root-Start)
        // -> Harter Reset: [Home, NeueSeite]
        // -> Löscht alle "hängengebliebenen" Crumbs von früher.
        // -----------------------------------------------------------
        if (fromPath === '/') {
            this.crumbs = [homeCrumb, newCrumb];
            this.save();
            return;
        }

        // -----------------------------------------------------------
        // REGEL 3: Direkteinstieg oder Reload Check
        // Wenn 'from' null ist (Browser-Refresh oder Bookmark), müssen wir aufpassen.
        // -----------------------------------------------------------
        if (!fromPath) {
            const lastStored = this.crumbs[this.crumbs.length - 1];
            // Wenn der Speicher leer ist -> [Home, Current]
            if (this.crumbs.length === 0) {
                this.crumbs = [homeCrumb, newCrumb];
                this.save();
                return;
            }
            // Wenn wir nicht auf der Seite sind, die im Speicher zuletzt war
            // (z.B. User ändert URL manuell), dann Reset auf [Home, Current]
            if (lastStored && lastStored.path !== toPath) {
                this.crumbs = [homeCrumb, newCrumb];
                this.save();
                return;
            }
            // Sonst war es ein F5-Reload auf der gleichen Seite -> Status behalten
        }

        // -----------------------------------------------------------
        // REGEL 4: Standard Navigation (Deep Linking)
        // -----------------------------------------------------------

        // Fallback: Falls Liste leer ist (sollte durch Regel 3 abgedeckt sein, aber sicher ist sicher)
        if (this.crumbs.length === 0) this.crumbs.push(homeCrumb);

        const lastCrumb = this.crumbs[this.crumbs.length - 1];

        // A. Exakt gleicher Link (Reload-Sicherheit)
        if (lastCrumb.href === fullHref) return;

        // B. Gleicher Pfad oder gleiches Label -> Ersetzen (Update)
        // Verhindert "Material > Material" oder "Page 1 > Page 2" (wenn gleiches Template)
        if (lastCrumb.path === toPath || lastCrumb.label === label) {
            this.crumbs[this.crumbs.length - 1] = newCrumb;
            this.save();
            return;
        }

        // C. Rückwärts-Navigation Check
        // Prüfen, ob der Pfad schon irgendwo in der Liste steht
        const existingIndex = this.crumbs.findIndex((c) => c.path === toPath);
        if (existingIndex !== -1) {
            // Alles danach abschneiden
            this.crumbs = this.crumbs.slice(0, existingIndex + 1);
            // Update Params/Label falls geändert
            this.crumbs[existingIndex] = newCrumb;
        } else {
            // D. Vorwärts-Navigation -> Anhängen
            if (this.crumbs.length >= 6) {
                // Erstes Element nach Home löschen um nicht zu lang zu werden
                this.crumbs.splice(1, 1);
            }
            this.crumbs.push(newCrumb);
        }

        this.save();
    }

    private save() {
        if (browser) {
            sessionStorage.setItem('hsgg_breadcrumbs', JSON.stringify(this.crumbs));
        }
    }
}

export const breadService = new BreadcrumbService();
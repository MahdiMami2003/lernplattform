//Lernwelt/src/lib/i18n/config.ts
import { browser } from '$app/environment';
import { register, init, getLocaleFromNavigator, locale, _, isLoading } from 'svelte-i18n';

register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));

// Track if initialization has already been done
let initialized = false;

export function setupI18n(initialLocale?: string): void {
    if (initialized) return;
    initialized = true;

    init({
        fallbackLocale: 'de',
        initialLocale:
            initialLocale ??
            (browser ? localStorage.getItem('lang') ?? getLocaleFromNavigator() : 'de')
    });
}

// Auto-initialize on module load to prevent race conditions
setupI18n();

export { locale, _, isLoading };

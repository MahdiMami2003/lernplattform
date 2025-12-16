import { browser } from '$app/environment';
import { register, init, getLocaleFromNavigator, locale, _ } from 'svelte-i18n';

register('de', () => import('./locales/de.json'));
register('en', () => import('./locales/en.json'));

export function setupI18n(initialLocale?: string): void {
    init({
        fallbackLocale: 'de',
        initialLocale:
            initialLocale ??
            (browser ? localStorage.getItem('lang') ?? getLocaleFromNavigator() : 'de')
    });
}

export { locale, _ };

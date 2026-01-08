<!--Lernwelt/src/routes/(all-others)/(account_level)/accessibility/+page.svelte-->
<script lang="ts">
  import { locale, _ } from '$lib/i18n/config';
  import { browser } from '$app/environment';

  let isDark = $state(false);
  let selectedLang: 'de' | 'en' = $state('de');

  function initFromStorage() {
    if (!browser) return;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      isDark = true;
      document.documentElement.classList.add('darkmode');
    }
    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'de' || savedLang === 'en') {
      selectedLang = savedLang;
      locale.set(savedLang);
    }
  }

  function toggleDark() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('darkmode');
      if (browser) localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('darkmode');
      if (browser) localStorage.setItem('theme', 'light');
    }
  }

  function setLang(l: 'de' | 'en') {
    selectedLang = l;
    locale.set(l);
    if (browser) localStorage.setItem('lang', l);
  }

  function goBack() {
    // Zurück zur vorherigen Seite
    history.back();
  }

  $effect(initFromStorage);
</script>

<div class="page-root">
  <header class="page-header">
    <h1>{$_('access.title')}</h1>
    <p class="subtitle">{$_('access.intro')}</p>
  </header>

  <main class="card">
    <section class="form-section">
      <h2 class="section-title">{$_('access.appearance')}</h2>
      <div class="row">
        <label for="dark-toggle">{isDark ? $_('access.mode_light') : $_('access.mode_dark')}</label>
        <button id="dark-toggle" class="btn" onclick={toggleDark} aria-pressed={isDark}>
          {isDark ? $_('access.switch_light') : $_('access.switch_dark')}
        </button>
      </div>
    </section>

    <section class="form-section">
      <h2 class="section-title">{$_('access.language')}</h2>
      <fieldset class="fieldset">
        <legend class="legend">{$_('access.select_language')}</legend>
        <div class="lang-row" aria-labelledby="lang-legend">
          <button class="btn" aria-label="Deutsch" aria-pressed={selectedLang === 'de'} onclick={() => setLang('de')}>DE</button>
          <button class="btn" aria-label="English" aria-pressed={selectedLang === 'en'} onclick={() => setLang('en')}>EN</button>
        </div>
      </fieldset>
    </section>

    <section class="form-section">
      <div class="row">
        <button class="btn secondary" onclick={goBack} aria-label={$_('access.back')}>
          ← {$_('access.back')}
        </button>
      </div>
    </section>
  </main>
</div>

<style>
  .page-root {
    padding: calc(var(--header-height) + var(--bread-height) + 1rem) 1rem 2rem;
    background: var(--bg-main);
    color: var(--text-primary);
    min-height: 100vh;
    box-sizing: border-box;
  }
  .page-header {
    margin: 0 0 1rem 0;
  }
  .page-header h1 {
    margin: 0;
    color: var(--text-primary);
  }
  .subtitle {
    color: var(--text-secondary);
    margin: 0.2rem 0 0 0;
  }
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
  }
  .form-section {
    margin-bottom: 1rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
  }
  .section-title {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }
  .lang-row {
    display: flex;
    gap: 0.4rem;
  }
  .btn {
    background: var(--sidebar-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
  }
  .btn.secondary {
    background: var(--bg-hover);
  }
  .btn:focus-visible {
    outline: 2px solid var(--text-primary);
    outline-offset: 2px;
  }
  .vis {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0 0 0 0);
    overflow: hidden;
  }
  .fieldset {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
  }
  .legend {
    color: var(--text-secondary);
    padding: 0 0.25rem;
  }
</style>

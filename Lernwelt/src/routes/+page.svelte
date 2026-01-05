<!--Lernwelt/src/routes/+page.svelte-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { locale, _, isLoading } from '$lib/i18n/config';

    function setLang(l: 'de' | 'en') {
        locale.set(l);
        if (browser) localStorage.setItem('lang', l);
    }

    function goStudent() {
        goto('/student_landing_page_id5');
    }
    function goTeacher() {
        goto('/teacher_landing_page_id6');
    }
    function goParent() {
        goto('/parents_landing_page_id4');
    }
    function goReg() {
        goto('/register_page_id3');
    }
    async function goGuest() {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.log('No active session to sign out');
        }
        // Use full page navigation to avoid auth state race conditions
        window.location.href = '/no_login_page_id7';
    }

    // ✅ HINZUFÜGEN (Svelte 5):
    let { data } = $props();

    // Optional: Damit du nicht immer 'data.supabase' schreiben musst:
    let { supabase, session } = data;

    // Sign out any active session when landing on login page
    onMount(async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.log('No active session to sign out');
        }
    });

    let email = $state('');
    let password = $state('');
    let message = $state('');

    async function handleLogin(e: Event) {
        e.preventDefault();
        try {
            message = $_('login.logging_in');

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Hole die Rolle des Benutzers aus der Datenbank
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (userError) {
                throw userError;
            }

            message = $_('login.success_redirect');

            // ✅ UPDATE: Separate Weiterleitung für Admins
            if (userData.role === 'student') {
                await goto('/student_landing_page_id5');
            } else if (userData.role === 'admin') {
                await goto('/admin_landing_page'); // Hier geht's jetzt zur Admin-Seite
            } else if (userData.role === 'teacher') {
                await goto('/teacher_landing_page_id6');
            } else if (userData.role === 'parent') {
                await goto('/parents_landing_page_id4');
            } else {
                // Falls keine Rolle gefunden wurde
                throw new Error($_('login.no_valid_role'));
            }
        } catch (error: any) {
            message = `${$_('login.failed')}: ${error?.message ?? error}`;
            // Lösche nur das Passwort, behalte die E-Mail
            password = '';
        }
    }
</script>

{#if $isLoading}
    <div
            style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: var(--bg-main, #fdfaf2);"
    >
        <p style="color: var(--text-primary, #000);">Laden...</p>
    </div>
{:else}
    <div class="landing_grid">
        <main class="main_container">
            <div class="lang-switch">
                <button type="button" class:selected={$locale === 'de'} onclick={() => setLang('de')}
                >DE</button
                >
                <button type="button" class:selected={$locale === 'en'} onclick={() => setLang('en')}
                >EN</button
                >
            </div>
            <header>
                <h1 class="start-title">{$_('login.title')}</h1>
                <p class="start-subtitle">{$_('login.subtitle')}</p>
            </header>

            <div class="center-content-wrapper">
                <h2>{$_('login.cta')}</h2>
                <div class="auth-section">
                    <form onsubmit={handleLogin} class="login-form">
                        <div class="input-row">
                            <input
                                    type="email"
                                    class="login-input"
                                    placeholder={$_('login.email_placeholder')}
                                    bind:value={email}
                                    required
                            />
                            <input
                                    type="password"
                                    class="login-input"
                                    name="password"
                                    placeholder={$_('login.password_placeholder')}
                                    bind:value={password}
                                    required
                            />
                        </div>
                        <button type="submit" class="full-width-btn primary-btn"
                        >{$_('login.login_button')}</button
                        >
                        {#if message}
                            <p class="message-text">{message}</p>
                        {/if}
                    </form>

                    <button class="full-width-btn secondary-btn" type="button" onclick={goReg}>
                        {$_('login.register_button')}
                    </button>
                </div>

                <div class="guest-section">
                    <div class="divider"><span>{$_('login.or')}</span></div>
                    <button class="guest-btn" type="button" onclick={goGuest}>
                        {$_('login.guest_button')}
                    </button>
                </div>
            </div>
        </main>
    </div>
{/if}

<style>
    /* ============ DARK MODE OVERLAY FÜR BACKGROUND ============ */
    .landing_grid {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 100dvh;
        background-image: url('../lib/assets/images/bg_f.jpeg');
        background-size: cover;
        background-repeat: no-repeat;
        position: relative;
    }

    /* Dark Mode Overlay */
    :root.darkmode .landing_grid::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        pointer-events: none;
        z-index: 0;
    }

    /* ============ MAIN CONTAINER ============ */
    .main_container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: var(--bg-card, rgba(255, 255, 255));
        padding: clamp(1.5rem, 4vw, 3rem);
        margin: 1.5rem auto;
        width: min(95%, 600px);
        min-height: 80vh;
        height: auto;
        border-radius: 0.75rem;
        font-family: Arial, Helvetica, sans-serif;
        text-align: center;
        box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
        transition: background-color 0.3s ease;
    }

    /* ============ LANGUAGE SWITCH ============ */
    .lang-switch {
        position: absolute;
        top: 0.8rem;
        right: 0.8rem;
        display: flex;
        gap: 0.4rem;
    }

    .lang-switch button {
        border: 1px solid var(--border-color, #ccc);
        background: var(--bg-card, white);
        color: var(--text-primary, #000);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        min-width: 44px;
        min-height: 44px;
    }

    .lang-switch button:hover {
        background: var(--bg-hover, #f5f5f5);
    }

    .lang-switch button.selected {
        font-weight: 700;
        text-decoration: underline;
        background: var(--button-bg, #f0be71);
    }

    /* ============ CENTER CONTENT WRAPPER ============ */
    .center-content-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-grow: 1;
        width: 100%;
        margin: 1rem 0;
    }

    .center-content-wrapper h2 {
        color: var(--text-primary, #000);
        transition: color 0.3s ease;
    }

    /* ============ AUTH SECTION ============ */
    .auth-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 500px;
        gap: 0.8rem;
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        width: 100%;
    }

    .input-row {
        display: flex;
        gap: 0.8rem;
        width: 100%;
    }

    .login-input {
        padding: 0.75rem 1.2rem;
        border: 1px solid var(--border-color, #ccc);
        background: var(--bg-card, white);
        color: var(--text-primary, #000);
        border-radius: 999px;
        font-size: 0.95rem;
        outline: none;
        flex: 1;
        text-align: center;
        transition: all 0.2s ease;
    }

    .login-input::placeholder {
        color: var(--text-muted, #888);
    }

    .login-input:focus {
        border-color: var(--button-bg, #f4d584);
        box-shadow: 0 0 0 3px rgba(240, 190, 113, 0.3);
    }

    .full-width-btn {
        width: 100%;
        padding: 0.75rem 1.5rem;
        border-radius: 999px;
        font-weight: 700;
        cursor: pointer;
        font-size: 0.95rem;
        text-align: center;
        transition: all 0.2s ease;
        border: 1px solid var(--button-border, #f0be71);
        min-height: 44px;
    }

    .full-width-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }

    .full-width-btn:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    .primary-btn {
        background-color: var(--button-bg, #f0be71);
        color: var(--text-primary, #000);
    }

    .secondary-btn {
        background-color: var(--button-bg, #f0be71);
        color: var(--text-primary, #000);
    }

    .message-text {
        color: var(--error-color, red);
        margin-top: 0.5rem;
        font-size: 0.9rem;
        transition: color 0.3s ease;
    }

    /* ============ GUEST SECTION ============ */
    .guest-section {
        width: 100%;
        max-width: 500px;
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .divider {
        display: flex;
        align-items: center;
        text-align: center;
        width: 100%;
        color: var(--text-muted, #888);
        font-size: 0.85rem;
        margin: 0.5rem 0;
        transition: color 0.3s ease;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--border-color, #ddd);
    }

    .divider span {
        padding: 0 10px;
    }

    .guest-btn {
        background: transparent;
        border: 2px solid var(--border-color, #ccc);
        color: var(--text-secondary, #666);
        padding: 0.6rem 1.5rem;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
        min-height: 44px;
    }

    .guest-btn:hover {
        border-color: var(--text-secondary, #888);
        color: var(--text-primary, #333);
        background-color: var(--bg-hover, rgba(0, 0, 0, 0.02));
    }

    .guest-btn:focus-visible {
        outline: 2px solid var(--text-primary, #000);
        outline-offset: 2px;
    }

    /* ============ TYPOGRAPHY ============ */
    .start-title {
        font-size: clamp(2.2rem, 4vw, 3rem);
        margin-top: -1rem;
        margin-bottom: 0.8rem;
        font-weight: 700;
        color: var(--text-primary, #000);
        transition: color 0.3s ease;
    }

    .start-subtitle {
        font-size: clamp(1.1rem, 2vw, 1.4rem);
        color: var(--text-secondary, #444);
        margin-bottom: 0;
        transition: color 0.3s ease;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 500px) {
        .input-row {
            flex-direction: column;
        }

        .main_container {
            margin: 0.5rem auto;
            width: 98%;
        }
    }

    /* ============ GLOBAL RESET ============ */
    html,
    body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        width: 100%;
    }
</style>
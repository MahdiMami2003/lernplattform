<!--Lernwelt/src/routes/(all-others)/(account_level)/login_page_id2/+page.svelte-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let { data } = $props();

    let email = $state('');
    let password = $state('');
    let message = $state('');
    let redirectTo = '';

    /**
     * sichere Prüfung, ob der Redirect interner Pfad ist
     * @param {string} p
     */
    function isSafeInternalPath(p) {
        return p && p.startsWith('/');
    }

    // Lese optionalen Query-Parameter über page store
    onMount(() => {
        const unsubscribe = page.subscribe(($page) => {
            let r = $page.url.searchParams.get('redirectTo') ?? '';
            try { r = r ? decodeURIComponent(r) : ''; } catch (e) {}
            redirectTo = r;
        });
        return () => unsubscribe();
    });

    /**
     * Handle login form submit
     * @param {Event} e
     */
    async function handleLogin(e) {
        e.preventDefault();
        try {
            message = 'Melde an...';

            const { data: authData, error } = await data.supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                throw error;
            }

            // Hole die Rolle des Benutzers aus der Datenbank
            const { data: userData, error: userError } = await data.supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError) {
                throw userError;
            }

            message = 'Anmeldung erfolgreich! Leite weiter...';

            // Wenn ein sicherer redirectTo gegeben ist, benutze diesen
            if (redirectTo && isSafeInternalPath(redirectTo)) {
                await goto(redirectTo);
                return;
            }

            // Leite basierend auf der Rolle weiter
            if (userData.role === 'student') {
                await goto('/student_landing_page_id5');
            } else if (userData.role === 'teacher' || userData.role === 'admin') {
                await goto('/teacher_landing_page_id6'); // Passe den Pfad an
            } else if (userData.role === 'parent') {
                await goto('/parents_landing_page_id4'); // Passe den Pfad an
            } else {
                // Falls keine Rolle gefunden wurde
                throw new Error('Keine gültige Rolle gefunden');
            }

        } catch (err) {
            console.error(err);
            const errMsg = err instanceof Error ? err.message : String(err);
            message = `Anmeldung fehlgeschlagen: ${errMsg}`;
            // Lösche nur das Passwort, behalte die E-Mail
            password = '';
        }
    }
</script>

<div id="placeholder">
    <h1>Willkommen zurück!</h1>
    <p>Logge dich ein, um deine Lernfortschritte zu sehen.</p>

    <form onsubmit={handleLogin}>
        <input type="email" placeholder="E-Mail" bind:value={email} required>
        <br>
        <input type="password" placeholder="Passwort" bind:value={password} required>
        <br>
        <button type="submit">Einloggen</button>
    </form>

    {#if message}
        <p>{message}</p>
    {/if}

    <a href="/register_page_id3" class="register-link">Noch kein Konto? Hier registrieren</a>
</div>

<style>
    #placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5rem;
        text-align: center;
        font-size: 30px;
        min-height: 90dvh;
        padding: 2rem;
    }

    form {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 250px;
        border-radius: 10px;
        background-color: #F3BE6A;
        padding: 0.7rem;
        flex-direction: column;
    }

    input {
        width: 90%;
        padding: 0.6rem;
        border-radius: 5px;
        border: none;
    }

    button {
        border-radius: 5px;
        width: 97%;
        padding: 0.6rem;
        border: none;
        cursor: pointer;
        background-color: #236C93;
        color: white;
    }

    .register-link {
        text-decoration: none;
        color: #236C93;
        font-weight: bold;
    }
</style>
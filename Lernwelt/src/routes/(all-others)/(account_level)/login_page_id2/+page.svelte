<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { goto } from '$app/navigation';

    let email = '';
    let password = '';
    let message = '';

    async function handleLogin() {
        try {
            message = 'Melde an...';

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
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

            message = 'Anmeldung erfolgreich! Leite weiter...';

            // Leite basierend auf der Rolle weiter
            if (userData.role === 'Schueler.in') {
                await goto('/student_landing_page_id5');
            } else if (userData.role === 'Lehrperson') {
                await goto('/teacher_landing_page_id6'); // Passe den Pfad an
            } else if (userData.role === 'Elternteil') {
                await goto('/parents_landing_page_id4'); // Passe den Pfad an
            } else {
                // Falls keine Rolle gefunden wurde
                throw new Error('Keine gültige Rolle gefunden');
            }

        } catch (error) {
            message = `Anmeldung fehlgeschlagen: ${error.message}`;
            // Lösche nur das Passwort, behalte die E-Mail
            password = '';
        }
    }
</script>

<div id="placeholder">
    <h1>Willkommen zurück!</h1>
    <p>Logge dich ein, um deine Lernfortschritte zu sehen.</p>

    <form on:submit|preventDefault={handleLogin}>
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
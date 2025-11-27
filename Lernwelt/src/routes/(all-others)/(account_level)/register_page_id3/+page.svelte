<script>
    import { supabase } from '$lib/supabaseClient.js';
    import { goto } from '$app/navigation';

    let firstName = '';
    let lastName = '';
    let email = '';
    let password = '';
    let confirmPassword = '';

    // Standard-Wert setzen
    let role = 'student';

    let termsAccepted = false;
    let message = '';

    async function handleRegister() {
        try {
            message = '';

            // 1. Validierung
            if (password !== confirmPassword) {
                message = 'Die Passwörter stimmen nicht überein.';
                return;
            }

            if (!termsAccepted) {
                message = 'Bitte akzeptiere die AGB und Datenschutzerklärung.';
                return;
            }

            // 2. User registrieren
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        role: role
                    }
                }
            });

            if (authError) throw authError;

            // 3. Prüfen & Weiterleiten
            if (authData.session) {
                message = 'Registrierung erfolgreich! Leite weiter...';

                // Kurze Pause für die UX (damit man die Nachricht liest)
                setTimeout(async () => {

                    // HIER IST DIE NEUE LOGIK:
                    // Wir nutzen die Variable 'role', die der User oben ausgewählt hat.

                    if (role === 'student') {
                        await goto('/student_landing_page_id5');
                    }
                    else if (role === 'teacher') {
                        await goto('/teacher_landing_page_id6');
                    }
                    else if (role === 'parent') {
                        await goto('/parents_landing_page_id4');
                    }
                    else {
                        // Fallback, falls irgendwas schief läuft
                        await goto('/');
                    }

                }, 1000);

            } else {
                // Falls "Confirm Email" in Supabase doch noch an ist
                message = 'Registrierung erfolgreich! Bitte bestätige deine E-Mail.';
            }

        } catch (error) {
            console.error('Fehler:', error);
            message = `Registrierung fehlgeschlagen: ${error.message}`;
        }
    }
</script>

<div id="placeholder">
    <h1>Willkommen bei HSG-Lernwelt</h1>
    <h2>Konto erstellen</h2>
    <p>Registriere dich, um deine Lernfortschritte zu speichern.</p>

    <form on:submit|preventDefault={handleRegister}>

        <input type="text" bind:value={firstName} placeholder="Vorname" required />
        <br />
        <input type="text" bind:value={lastName} placeholder="Nachname" required />
        <br />
        <input type="email" bind:value={email} placeholder="E-Mail-Adresse" required />
        <br />
        <input type="password" bind:value={password} placeholder="Passwort" required />
        <br />
        <input type="password" bind:value={confirmPassword} placeholder="Passwort bestätigen" required />
        <br />

        <div class="role">
            <p class="role-title">Du willst registrieren als:</p>

            <div class="role-options">
                <label>
                    <input type="radio" name="roles" bind:group={role} value="student" required />
                    <span>Schüler/in</span>
                </label>

                <label>
                    <input type="radio" name="roles" bind:group={role} value="teacher" />
                    <span>Lehrer/in</span>
                </label>

                <label>
                    <input type="radio" name="roles" bind:group={role} value="parent" />
                    <span>Elternteil</span>
                </label>
            </div>
        </div>

        <div class="terms">
            <label>
                <input type="checkbox" bind:checked={termsAccepted} required />
                <span>Ich akzeptiere die <a href="/agb">AGB</a> und die <a href="/datenschutz">Datenschutzerklärung</a>.</span>
            </label>
        </div>

        <button type="submit">Registrieren</button>
    </form>

    {#if message}
        <p style="color: #fff; margin-top: 1rem; font-weight: bold;">{message}</p>
    {/if}

    <a href="/login_page_id2" class="login-link">Schon registriert? Hier einloggen</a>
</div>

<style>
    #placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    div {
        justify-content: center;
        text-align: center;
    }
    p {
        font-weight: bold;
    }
    form {
        background-color: #f3be6a;
        align-items: center;
        height: auto;
        min-height: 500px;
        width: 400px;
        padding: 1rem 0.7rem 1rem 0.7rem;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
    }
    input {
        border-radius: 5px;
        padding: 0.6rem;
        width: 85%;
        border: none;
    }
    .role {
        width: 100%;
        max-width: 360px;
        margin: 1rem 0 1.25rem;
        color: #fff;
    }

    .role-title {
        text-align: center;
        font-weight: 700;
        margin: 0 0 0.5rem;
    }

    .role-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem 1.25rem;
        justify-items: start;
    }

    .role-options label {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.55rem 0.75rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid #236C93;
        border-radius: 10px;
        cursor: pointer;
    }
    .terms {
        width: 100%;
        max-width: 360px;
        margin: 0.25rem 0 1rem;
        color: white;
    }

    .terms label {
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        font-size: 0.95rem;
        line-height: 1.35;
    }

    .terms input[type='checkbox'] {
        accent-color: #236C93;
        width: 18px;
        height: 18px;
        margin-top: 0.1rem;
    }

    .terms a {
        color: #236C93;
        text-decoration: underline;
    }
    button {
        background-color: #236C93;
        color: white;
        border-radius: 5px;
        padding: 0.6rem;
        width: 92%;
        font-weight: bold;
        border: none;
        cursor: pointer;
    }
    .login-link {
        text-align: center;
        display: block;
        margin-top: 30px;
        color: #236c93;
        text-decoration: none;
        font-weight: bold;
    }
</style>
<script>
</script>

<body>
<div id="placeholder">
    <h1>Willkommen bei HSG-Lernwelt</h1>
    <h2>Konto erstellen</h2>
    <p>registriere dich, um deine Lernfortschritte zu speichern.</p>
    <form>
        <input type="text" placeholder="Vorname" required />
        <br />
        <input type="text" placeholder="Nachname" required />
        <br />
        <input type="email" placeholder="E-Mail-Adresse" required />
        <br />
        <input type="password" placeholder="Passwort" required />
        <br />
        <input type="password" placeholder="Passwort bestätigen" required />
        <br />
        <div class="role">
            <p class="role-title">Du willst registrieren als:</p>

            <div class="role-options">
                <label>
                    <input type="radio" name="role" value="student" required />
                    <span>Schüler/in</span>
                </label>

                <label>
                    <input type="radio" name="role" value="teacher" />
                    <span>Lehrer/in</span>
                </label>

                <label>
                    <input type="radio" name="role" value="parent" />
                    <span>Elternteil</span>
                </label>
            </div>
        </div>

        <div class="terms">
            <label>
                <input type="checkbox" name="terms" required />
                <span
                >Ich akzeptiere die <a href="/agb">AGB</a> und die
						<a href="/datenschutz">Datenschutzerklärung</a>.</span
                >
            </label>
        </div>
        <button type="submit">registrieren</button>
    </form>
    <a href="/login_page_id2" class="login-link">Schon registriert? Hier einloggen</a>
</div>
</body>

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
        height: 500px;
        width: 400px;
        padding: 0.7rem;
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
        grid-template-columns: 1fr 1fr; /* 2 Spalten; bricht automatisch um */
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
        margin-top: 0.1rem; /* optisch mittig zur Textzeile */
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

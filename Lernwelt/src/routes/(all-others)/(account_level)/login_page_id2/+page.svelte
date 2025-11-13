<script>
</script>

<body>
<div id="placeholder">
    <h1>Willkommen zurück!</h1>
    <p>Logge dich ein, um deine Lernfortschritte zu sehen.</p>
    <form>
        <input type="text" placeholder="Benutzername" required>
        <br>
        <input type="text" placeholder="Passwort" required>
        <br>
        <button type="submit">Einloggen</button>
    </form>
    <a href="/register_page_id3" class="register-link"> Noch kein Konto? Hier registrieren</a>
</div>
</body>

<style>
    #placeholder{
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5rem;
    }
    div{
        text-align: center;
        font-size: 30px;
        height: 200dvh;
        /*min-height: 100vh;*/
    }
    form{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 250px;
        border-radius: 10px;
        background-color: #F3BE6A;
        padding: 0.7rem;
        flex-direction: column;

    }
    input{
        width: 90%;
        padding: 0.6rem;
        border-radius: 5px;
        border: none;
    }
    button{
        border-radius: 5px;
        width: 97%;
        padding: 0.6rem;
        border: none;
        cursor: pointer;
        background-color: #236C93;
        color: white;
    }
    .register-link{
        text-decoration: none;
        color: #236C93;
        font-weight: bold;
    }
</style>
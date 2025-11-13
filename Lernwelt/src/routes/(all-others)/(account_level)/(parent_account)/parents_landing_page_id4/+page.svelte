<script>
</script>

<body>
<div id="placeholder">
    <h1>Hallo liebes Elternteil.</h1>
        <div>Herzlich willkommen auf der Website der HSGG Lernwelt</div>
        <div>Bitte klicken Sie auf das Thema das Sie interessiert.</div>
    <br>
    <!--link to the other websites -->
    <ul>
        <li>
            <a href="http://localhost:5173/appointments_page_id8"><h3>Termine und Aktuelles</h3></a>
            <div class="link_description">Hier finden sie aktuelle Informationen die Sie nicht verpassen sollten</div>
        </li>
        <li>
            <a href="http://localhost:5173/progress_page_id11"><h3>Fortschritt meines Kindes</h3></a>
            <div class="link_description">Falls Sie sehen wollen auf welchem Lernstand ihr Kind ist, klicken Sie hier </div>
        </li>
        <li>
            <a href="http://localhost:5173/pedagogy_page_id10"><h3>Pädagogische Tipps</h3></a>
            <div class="link_description">Wenn Sie herausfinden wollen wie Sie ihr Kind beim lernen unterstützen können, klicken Sie hier.</div>
        </li>
        <li>
            <a href="http://localhost:5173/material_page_id14"><h3>Lernunterlagen meines Kindes</h3></a>
            <div class="link_description">Hier finden Sie die Lernunterlagen die Ihr Kind ebenfalls zur Verfügung gestellt bekommt.</div>
        </li>

    </ul>
</div>

</body>
<style>
    /* Korrektur: Entfernt den Standard-Padding/Margin, der die Liste verschiebt */
    ul {
        padding: 0;
        margin: 0;
    }

    a{
        margin: 0;
        color: black;
        text-decoration: none;
    }
    li{
        list-style-type: none;
        border: solid lightgray;
        border-style: groove;
        border-width: thin;
        margin: 1dvh;
        padding-left: 3dvh;
        background-color: #f5f5dc;
        border-radius: 5px;
    }
    li:hover{
        background-color: #dcdcc5;
    }
    body{
        font-family: Bahnschrift;
    }
    a:hover, a:hover:visited{
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description{
        padding-bottom: 2dvh;
        padding-left: 3dvh;
    }
</style>
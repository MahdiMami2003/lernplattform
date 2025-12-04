<script>
    let { data } = $props();

    let { supabase, session } = data;
    let title = "Hausaufgabenhilfe richtig gestalten";
    let text = `
Hausaufgaben sind eine gute Gelegenheit, Selbstständigkeit zu üben.
Eltern sollten helfen, aber nicht alles abnehmen.

👉 Tipp: Eine ruhige Umgebung und feste Lernzeiten helfen enorm.
`;
</script>

<div class="container">
    <a href="/pedagogy_page_id10">← Zurück</a>
    <h1>{title}</h1>
    <p style="white-space: pre-line;">{text}</p>
</div>

<style>
    .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
    }

    a {
        text-decoration: none;
        color: #2b73c1;
        font-size: 14px;
    }

    h1 {
        margin-top: 10px;
        margin-bottom: 15px;
    }
</style>

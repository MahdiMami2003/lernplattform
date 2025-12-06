<script>

    let { data } = $props();

    let { supabase, session } = data;

    let tips = [
        {
            title: "Motivation beim Lernen",
            summary: "Wie Sie Ihr Kind unterstützen können, motiviert zu bleiben.",
            slug: "motivation"
        },
        {
            title: "Hausaufgabenhilfe richtig gestalten",
            summary: "Tipps, wie Eltern bei den Hausaufgaben helfen können, ohne zu überfordern.",
            slug: "homework"
        }
    ];

    let search = $state("");

    let filtered = $derived(
        tips.filter((t) =>
            t.title.toLowerCase().includes(search.toLowerCase())
        )
    );
</script>

<div class="container">
    <h1>Pädagogische Tipps</h1>

    <input
            type="text"
            placeholder="Nach Thema suchen..."
            bind:value={search}
    />

    {#if filtered.length === 0}
        <p>Keine Tipps gefunden.</p>
    {:else}
        <ul>
            {#each filtered as tip}
                <li>
                    <a href={"pedagogy_page_id10/" + tip.slug}>
                        <h2>{tip.title}</h2>
                        <p>{tip.summary}</p>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
    }

    h1 {
        text-align: center;
        margin-bottom: 15px;
    }

    input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        margin-bottom: 20px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        margin-bottom: 15px;
        border: 1px solid #ddd;
        padding: 15px;
        border-radius: 6px;
        transition: 0.2s;
    }

    li:hover {
        background-color: #f9f9f9;
    }

    a {
        text-decoration: none;
        color: black;
    }
</style>

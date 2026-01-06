<!--Lernwelt/src/routes/(all-others)/(account_level)/barrierefreiheit/+page.svelte-->
<script>
    import { _ } from 'svelte-i18n';
</script>

<div class="access-wrapper">
    <h1>{$_('access.title')}</h1>

    <p class="intro">{$_('access.intro')}</p>

    <div class="access-box">
        <section>
            <h2>{$_('access.s1_title')}</h2>
            <p>
                {$_('access.s1_intro_a')}
                <strong>{$_('access.s1_intro_b')}</strong>
                {$_('access.s1_intro_c')}
            </p>
            <ul>
                <li><strong>{$_('access.s1_li1_bold')}</strong> {$_('access.s1_li1_text')}</li>
                <li><strong>{$_('access.s1_li2_bold')}</strong> {$_('access.s1_li2_text')}</li>
                <li><strong>{$_('access.s1_li3_bold')}</strong> {$_('access.s1_li3_text')}</li>
            </ul>
        </section>

        <section>
            <h2>{$_('access.s2_title')}</h2>
            <p>{$_('access.s2_p1')}</p>
            <p class="note">{$_('access.s2_note')}</p>
        </section>

        <section>
            <h2>{$_('access.s3_title')}</h2>
            <p>{$_('access.s3_p1')}</p>
            <ul>
                <li>{$_('access.s3_li1')}</li>
                <li>{$_('access.s3_li2')}</li>
                <li>{$_('access.s3_li3')}</li>
            </ul>
        </section>

        <section>
            <h2>{$_('access.s4_title')}</h2>
            <p>{$_('access.s4_p1')}</p>
        </section>
    </div>
</div>

<style>
    /* ============ DARK MODE SUPPORT ============ */
    .access-wrapper {
        max-width: 900px;
        margin: 2rem auto 4rem auto;
        padding: 1rem;
        font-family: Arial, sans-serif;
        text-align: center;
    }

    h1 {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #236C93;
        transition: color 0.3s ease;
    }

    :root.darkmode h1 {
        color: #4a9fc7;
    }

    .intro {
        max-width: 650px;
        margin: 0 auto 2rem auto;
        color: var(--text-secondary, #555);
        line-height: 1.6;
        transition: color 0.3s ease;
    }

    .access-box {
        background: var(--bg-card, white);
        padding: 2rem 2.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        text-align: left;
        line-height: 1.6;
        border: 1px solid var(--border-color, transparent);
        transition: all 0.3s ease;
    }

    section {
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #333);
        margin-bottom: 0.4rem;
        border-left: 5px solid #f3be6a;
        padding-left: 0.6rem;
        transition: color 0.3s ease;
    }

    ul {
        margin: 0.5rem 0;
        padding-left: 1.2rem;
    }

    li {
        margin-bottom: 0.4rem;
        color: var(--text-secondary, #444);
        transition: color 0.3s ease;
    }

    li strong {
        color: var(--text-primary, #000);
        transition: color 0.3s ease;
    }

    p {
        color: var(--text-secondary, #444);
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    p strong {
        color: var(--text-primary, #000);
        transition: color 0.3s ease;
    }

    .note {
        font-size: 0.9rem;
        color: var(--text-muted, #777);
        transition: color 0.3s ease;
    }

    @media (max-width: 600px) {
        .access-box {
            padding: 1.5rem;
        }

        h1 {
            font-size: 1.8rem;
        }
    }
</style>
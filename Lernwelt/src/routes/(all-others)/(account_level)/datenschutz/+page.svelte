<!--Lernwelt/src/routes/(all-others)/(account_level)/datenschutz/+page.svelte-->
<script>
    import { _ } from '$lib/i18n/config';
</script>
<div class="privacy-wrapper">
    <h1>{$_('privacy.title')}</h1>

    <p class="intro">{$_('privacy.intro')}</p>

    <div class="privacy-box">
        <section>
            <h2>{$_('privacy.section1.title')}</h2>
            <p>
                {$_('privacy.section1.line1')}<br />
                {$_('privacy.section1.line2')}<br />
                {$_('privacy.section1.line3')}<br />
                {$_('privacy.section1.line4')}<br />
                {$_('privacy.section1.line5')}
            </p>
        </section>

        <section>
            <h2>{$_('privacy.section2.title')}</h2>
            <p>{$_('privacy.section2.text')}</p>
            <ul>
                <li>{$_('privacy.section2.list.name')}</li>
                <li>{$_('privacy.section2.list.email')}</li>
                <li>{$_('privacy.section2.list.role')}</li>
                <li>{$_('privacy.section2.list.session')}</li>
            </ul>
        </section>

        <section>
            <h2>{$_('privacy.section3.title')}</h2>
            <p>{$_('privacy.section3.text')}</p>
        </section>

        <section>
            <h2>{$_('privacy.section4.title')}</h2>
            <p>
                {$_('privacy.section4.text1')}
                <strong>{$_('privacy.section4.supabase')}</strong>
                {$_('privacy.section4.text2')}
            </p>
            <p>{$_('privacy.section4.text3')}</p>
        </section>

        <section>
            <h2>{$_('privacy.section5.title')}</h2>
            <p>{$_('privacy.section5.text')}</p>
        </section>

        <section>
            <h2>{$_('privacy.section6.title')}</h2>
            <p>{$_('privacy.section6.text')}</p>
            <ul>
                <li>{$_('privacy.section6.list.access')}</li>
                <li>{$_('privacy.section6.list.correct_delete')}</li>
                <li>{$_('privacy.section6.list.object')}</li>
            </ul>
        </section>

        <section>
            <h2>{$_('privacy.section7.title')}</h2>
            <p>{$_('privacy.section7.text')}</p>
        </section>
    </div>
</div>

<style>
    .privacy-wrapper {
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
    }

    .intro {
        max-width: 650px;
        margin: 0 auto 2rem auto;
        color: #555;
        line-height: 1.6;
    }

    .privacy-box {
        background: white;
        padding: 2rem 2.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        text-align: left;
        line-height: 1.6;
    }

    section {
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.4rem;
        border-left: 5px solid #f3be6a;
        padding-left: 0.6rem;
    }

    ul {
        margin: 0.5rem 0;
        padding-left: 1.2rem;
    }

    li {
        margin-bottom: 0.4rem;
        color: #444;
    }

    p {
        color: #444;
        font-size: 0.95rem;
    }

    @media (max-width: 600px) {
        .privacy-box {
            padding: 1.5rem;
        }
    }
</style>

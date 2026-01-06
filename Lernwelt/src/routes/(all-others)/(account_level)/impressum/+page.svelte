<!--Lernwelt/src/routes/(all-others)/(account_level)/impressum/+page.svelte-->
<script>
    import { _ } from '$lib/i18n/config';
</script>
<div class="impressum-wrapper">

    <h1>{$_('imprint.title')}</h1>

    <p class="description">
        {$_('imprint.subtitle')}
    </p>

    <div class="impressum-box">

        <section>
            <h2>{$_('imprint.responsible_title')}</h2>
            <p>
                Max Mustermann<br />
                Musterstraße 12<br />
                12345 Musterstadt<br />
                Deutschland
            </p>
        </section>

        <section>
            <h2>{$_('imprint.contact_title')}</h2>
            <p>
                E-Mail: beispiel@example.com<br />
                Telefon: 0123 456789
            </p>
        </section>

        <section>
            <h2>{$_('imprint.disclaimer_title')}</h2>
            <p>
                {$_('imprint.disclaimer_text')}
            </p>
        </section>

        <section>
            <h2>{$_('imprint.copyright_title')}</h2>
            <p>
                {$_('imprint.copyright_text')}
            </p>
        </section>

    </div>
</div>



<style>
    .impressum-wrapper {
        max-width: 900px;
        margin: 2rem auto 4rem auto;
        padding: 1rem;
        font-family: Arial, sans-serif;
        text-align: center;
    }

    h1 {
        font-size: 2.4rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #236C93;
        transition: color 0.3s ease;
    }

    .description {
        font-size: 1rem;
        color: var(--text-secondary, #666);
        max-width: 600px;
        margin: 0 auto 2rem auto;
        line-height: 1.6;
    }

    .impressum-box {
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
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--text-primary, #333);
        margin-bottom: 0.4rem;
        border-left: 5px solid #f3be6a;
        padding-left: 0.6rem;
        transition: color 0.3s ease;
    }

    p {
        font-size: 0.95rem;
        color: var(--text-secondary, #444);
        transition: color 0.3s ease;
    }

    @media (max-width: 600px) {
        .impressum-box {
            padding: 1.5rem;
        }
    }
</style>

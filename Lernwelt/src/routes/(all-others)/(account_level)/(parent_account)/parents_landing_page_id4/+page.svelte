<script>
    let { data } = $props();

    let { supabase, session } = data;

    import { _ } from '$lib/i18n/config';


</script>


<div id="placeholder">
    <h1>{$_('parent.title')}</h1>
        <div>{$_('parent.welcome')}</div>
        <div>{$_('parent.instruction')}</div>

    <br>
    <!--link to the other websites -->
    <ul>
        <li class="landing_liste">
            <a href="/appointments_page_id8">
                <h3>{$_('parent.sections.appointments_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.appointments_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/progress_page_id11">
                <h3>{$_('parent.sections.progress_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.progress_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/pedagogy_page_id10">
                <h3>{$_('parent.sections.tips_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.tips_desc')}
            </div>
        </li>

        <li class="landing_liste">
            <a href="/material_page_id14">
                <h3>{$_('parent.sections.materials_title')}</h3>
            </a>
            <div class="link_description">
                {$_('parent.sections.materials_desc')}
            </div>
        </li>

    </ul>
</div>


<style>
    /* Korrektur: Entfernt den Standard-Padding/Margin, der die Liste verschiebt */
    ul {
        padding: 0;
        margin: 0;
    }
    #placeholder {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: #f5f5dc;
        border-radius: 1rem;
    }
    #placeholder ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-top: 2rem;
    }
    .landing_liste {
        background: #fff7e6;
        border-radius: 1.4rem;
        padding: 1.6rem;
        border: 2px solid #f0d9a6;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .landing_liste:hover {
        transform: translateY(-6px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
    }
    a:hover {
        color: #0077cc;
        text-decoration: none;
    }

    .link_description {
        margin-top: 0.6rem;
        font-size: 0.95rem;
        color: #444;
    }
    /*#placeholder {
        height: 100vh;
    }*/

    a{
        margin: 0;
        color: black;
        text-decoration: none;
    }
    /*.landing_liste{
        list-style-type: none;
        /*border: solid lightgray;*/
     /*   border-color: lightgray;
        border-style: groove;
        border-width: thin;
        margin: 1dvh;
        padding-left: 3dvh;
        background-color: #f5f5dc;
        border-radius: 5px;
    } */
    /*li:hover{
        background-color: #dcdcc5;
    }

    a:hover, a:hover:visited{
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description{
        padding-bottom: 2dvh;
        padding-left: 3dvh;
    }*/
</style>
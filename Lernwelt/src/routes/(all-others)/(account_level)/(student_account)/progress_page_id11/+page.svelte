<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let { data } = $props();
    let { supabase } = data;

    // State
    let loading = $state(true);
    let errorMessage = $state('');
    let profile = $state(null);
    let missionsData = $state([]);

    // Rollen & Logik
    let viewerRole = $state(''); // 'teacher', 'parent', 'student'
    let isOwner = $state(false);

    // Für Eltern: Liste der Kinder
    let myChildren = $state([]);
    let showChildSelection = $state(false);

    onMount(async () => {
        // 1. Session holen
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { goto('/login_page_id2'); return; }

        const myUserId = session.user.id;

        // 2. Meine Rolle holen
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', myUserId)
            .single();

        viewerRole = myProfile?.role || 'student';

        // 3. Wen wollen wir sehen? (URL prüfen)
        const urlParams = new URLSearchParams(window.location.search);
        let targetUserId = urlParams.get('userId');

        // --- SZENARIO A: ELTERN ---
        if (viewerRole === 'parent') {
            // Wir holen die Kinder (IDs und Profile)
            const { data: links } = await supabase.from('parent_children').select('child_id').eq('parent_id', myUserId);

            if (links && links.length > 0) {
                const childIds = links.map(l => l.child_id);
                // Profile der Kinder laden für die Auswahl-Anzeige
                const { data: kids } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', childIds);
                myChildren = kids || [];
            }

            // Wenn keine ID in der URL ist -> Auswahl anzeigen
            if (!targetUserId) {
                if (myChildren.length === 1) {
                    // Bei nur einem Kind direkt laden
                    targetUserId = myChildren[0].id;
                } else if (myChildren.length > 1) {
                    showChildSelection = true;
                    loading = false;
                    return; // Stopp, wir warten auf Klick
                } else {
                    errorMessage = "Keine verknüpften Kinder gefunden.";
                    loading = false;
                    return;
                }
            } else {
                // Sicherheitscheck: Ist das wirklich mein Kind?
                const isMyChild = myChildren.some(c => c.id === targetUserId);
                if (!isMyChild && myChildren.length > 0) {
                    errorMessage = "Du hast keinen Zugriff auf dieses Profil.";
                    loading = false;
                    return;
                }
            }
        }

        // --- SZENARIO B: LEHRER ---
        // Lehrer kommen meistens direkt mit ?userId=... aus der Klassenliste.
        // Falls keine ID da ist, ist das ein Fehler.
        if (viewerRole === 'teacher' && !targetUserId) {
            errorMessage = "Kein Schüler ausgewählt. Bitte gehe über die Klassenliste.";
            loading = false;
            return;
        }

        // --- SZENARIO C: SCHÜLER ---
        // Wenn ich Schüler bin, lade ich immer mich selbst
        if (viewerRole === 'student') {
            targetUserId = myUserId;
        }

        // Finales Laden
        let idToLoad = targetUserId || myUserId;
        isOwner = (idToLoad === myUserId);

        console.log(`Lade Profil ${idToLoad} als ${viewerRole}`);
        await loadData(idToLoad);
    });

    async function loadData(targetId) {
        try {
            loading = true;
            showChildSelection = false;
            errorMessage = '';

            // A. Profil laden
            const { data: pData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .maybeSingle();

            if (pError) throw pError;
            if (!pData) throw new Error("Profil nicht gefunden.");

            profile = pData;

            // B. Missionen laden
            const { data: mData, error: mError } = await supabase
                .from('missions_progress')
                .select(`progress, completed, missions (title, description, xp_reward)`)
                .eq('user_id', targetId)
                .order('completed', { ascending: true });

            if (mError) throw mError;
            missionsData = mData || [];

        } catch (err: any) {
            console.error(err);
            errorMessage = err.message;
        } finally {
            loading = false;
        }
    }

    // Für Eltern: Klick auf ein Kind in der Auswahl
    function selectChild(childId) {
        window.location.href = `?userId=${childId}`;
    }

    function getBarColor(p, c) { return c ? '#4caf50' : (p > 0 ? '#f3be6a' : '#ddd'); }
</script>

<div class="page-container">

    {#if loading}
        <div class="msg">🚀 Lade Daten...</div>

    {:else if errorMessage}
        <div class="msg error">
            ⚠️ {errorMessage}
            <br><br>
            <button onclick={() => history.back()}>Zurück</button>
        </div>

    {:else if showChildSelection}
        <div class="selection-screen">
            <h1>Wen möchtest du sehen?</h1>
            <p>Bitte wähle eines deiner Kinder aus:</p>

            <div class="child-grid">
                {#each myChildren as child}
                    <button class="child-card" onclick={() => selectChild(child.id)}>
                        <img
                                src={child.avatar_url}
                                alt={child.full_name}
                                onerror={(e) => e.target.src = `https://ui-avatars.com/api/?name=${child.full_name}&background=random`}
                        />
                        <span>{child.full_name}</span>
                    </button>
                {/each}
            </div>
            <br>
            <a href="/parents_landing_page_id4" style="color:#666;">Zurück zum Dashboard</a>
        </div>

    {:else if profile}

        {#if viewerRole === 'parent'}
            <div class="info-banner parent">
                <div class="banner-text">
                    <span>Du siehst: <strong>{profile.full_name}</strong></span>
                </div>
                <div class="banner-actions">
                    {#if myChildren.length > 1}
                        <button class="switch-btn" onclick={() => showChildSelection = true}>
                            👥 Anderes Kind
                        </button>
                    {/if}
                    <a href="/parents_landing_page_id4" class="back-link">Dashboard</a>
                </div>
            </div>
        {/if}

        {#if viewerRole === 'teacher'}
            <div class="info-banner teacher">
                <span>👨‍🏫 Schüler-Ansicht: <strong>{profile.full_name}</strong></span>
                <button class="back-btn" onclick={() => history.back()}>Zurück zur Liste</button>
            </div>
        {/if}

        <header class="profile-header">
            <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    class="avatar"
                    onerror={(e) => e.target.src = `https://ui-avatars.com/api/?name=${profile.full_name}&background=f3be6a&color=fff`}
            />
            <div class="info">
                <h1>{profile.full_name}</h1>
                <div class="stats">
                    <div class="stat"><span>Level</span> <strong>{profile.level || 1}</strong></div>
                    <div class="stat"><span>XP</span> <strong>{profile.xp || 0}</strong></div>
                    <div class="stat"><span>Herzen</span> <strong>{profile.hearts || 3} ❤️</strong></div>
                </div>
            </div>
        </header>

        <section class="missions">
            <h2>Lernfortschritt</h2>
            {#if missionsData.length === 0}
                <div class="empty">Noch keine Aufgaben gestartet.</div>
            {:else}
                <div class="grid">
                    {#each missionsData as item}
                        {#if item.missions}
                            <div class="card {item.completed ? 'done' : ''}">
                                <div class="head">
                                    <h3>{item.missions.title}</h3>
                                    <span class="xp">+{item.missions.xp_reward} XP</span>
                                </div>
                                <div class="track">
                                    <div class="fill" style="width: {item.progress}%; background: {getBarColor(item.progress, item.completed)}"></div>
                                </div>
                                <small>{item.completed ? 'Fertig!' : `${item.progress}%`}</small>
                            </div>
                        {/if}
                    {/each}
                </div>
            {/if}
        </section>

    {/if}
</div>

<style>
    .page-container { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: sans-serif; }

    /* --- Styles für die Kind-Auswahl --- */
    .selection-screen { text-align: center; margin-top: 2rem; }
    .child-grid { display: flex; justify-content: center; gap: 1.5rem; margin-top: 2rem; flex-wrap: wrap; }
    .child-card {
        background: white; border: 1px solid #ddd; border-radius: 12px;
        padding: 1.5rem; width: 160px; cursor: pointer; transition: transform 0.2s;
        display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }
    .child-card:hover { transform: translateY(-5px); border-color: #236c93; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .child-card img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
    .child-card span { font-weight: bold; color: #333; }

    /* --- Banners --- */
    .info-banner {
        padding: 1rem; border-radius: 8px; margin-bottom: 2rem;
        display: flex; justify-content: space-between; align-items: center; border: 1px solid transparent;
    }

    /* Lehrer Style (Gelb) */
    .info-banner.teacher { background: #fff3cd; color: #856404; border-color: #ffeeba; }
    .back-btn { background: white; border: 1px solid #ddd; padding: 0.3rem 0.8rem; cursor: pointer; border-radius: 4px; }

    /* Eltern Style (Blau) */
    .info-banner.parent { background: #e3f2fd; color: #0d47a1; border-color: #bbdefb; }
    .banner-actions { display: flex; gap: 1rem; align-items: center; }
    .switch-btn { background: white; border: 1px solid #90caf9; padding: 0.3rem 0.8rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; color: #1565c0; }
    .back-link { color: #0d47a1; text-decoration: none; font-size: 0.9rem; font-weight: bold; }

    /* --- Standard Profil Styles --- */
    .profile-header { display: flex; gap: 1.5rem; align-items: center; background: white; padding: 2rem; border-radius: 12px; border: 1px solid #eee; margin-bottom: 2rem; }
    .avatar { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 4px solid #f3be6a; }
    .info h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    .stats { display: flex; gap: 2rem; }
    .stat { display: flex; flex-direction: column; }
    .stat span { font-size: 0.8rem; text-transform: uppercase; color: #888; font-weight: bold; }
    .stat strong { font-size: 1.2rem; color: #236c93; }

    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #eee; }
    .card.done { background: #f1f8e9; border-color: #81c784; }
    .head { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .xp { background: #fff8e1; color: #f57f17; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }
    .track { height: 8px; background: #eee; border-radius: 4px; margin: 10px 0 5px; overflow: hidden; }
    .fill { height: 100%; transition: width 0.5s; }

    .msg { text-align: center; margin-top: 3rem; color: #666; }
    .error { color: red; background: #ffebee; padding: 1rem; border-radius: 8px; }
    .empty { text-align: center; color: #888; font-style: italic; padding: 2rem; background: #f9f9f9; border-radius: 8px; }
</style>
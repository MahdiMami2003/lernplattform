<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';

    let { data } = $props();
    let { supabase } = data; // Session kommt später über getSession

    // State
    let loading = $state(true);
    let errorMessage = $state('');
    let profile = $state(null);
    let missionsData = $state([]);

    // Wer guckt zu?
    let viewerRole = $state(''); // 'teacher', 'parent', 'student'
    let isOwner = $state(false); // Ist es mein eigenes Profil?

    onMount(async () => {
        // 1. Wer bin ich? (Session holen)
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Nicht eingeloggt -> Weg hier
            goto('/login_page_id2');
            return;
        }

        const myUserId = session.user.id;

        // Meine Rolle holen (Lehrer/Eltern/Schüler)
        const { data: myProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', myUserId)
            .single();

        viewerRole = myProfile?.role || 'student';

        // 2. Wen will ich sehen? (URL prüfen)
        const urlParams = new URLSearchParams(window.location.search);
        const targetUserId = urlParams.get('userId');

        // Entscheidung: Welche ID laden wir?
        // Wenn eine ID in der URL steht UND ich Lehrer/Eltern bin -> Lade URL-ID
        // Sonst -> Lade meine eigene ID
        let idToLoad = myUserId;

        if (targetUserId && targetUserId !== myUserId) {
            // Fremdes Profil ansehen
            idToLoad = targetUserId;
            isOwner = false;
        } else {
            // Eigenes Profil ansehen
            isOwner = true;
        }

        console.log(`Lade Profil ${idToLoad} (Betrachter-Rolle: ${viewerRole})`);
        await loadData(idToLoad);
    });

    async function loadData(targetId) {
        try {
            loading = true;
            errorMessage = '';

            // A. Profil Daten
            const { data: pData, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .maybeSingle();

            if (pError) throw pError;
            if (!pData) throw new Error("Profil nicht gefunden (oder keine Berechtigung).");

            profile = pData;

            // B. Missionen / Fortschritt
            const { data: mData, error: mError } = await supabase
                .from('missions_progress')
                .select(`progress, completed, missions (title, description, xp_reward)`)
                .eq('user_id', targetId)
                .order('completed', { ascending: true });

            if (mError) throw mError;
            missionsData = mData || [];

        } catch (err: any) {
            console.error("Fehler:", err);
            errorMessage = err.message;
        } finally {
            loading = false;
        }
    }

    // Farben für Balken
    function getBarColor(p, c) { return c ? '#4caf50' : (p > 0 ? '#f3be6a' : '#ddd'); }
</script>

<div class="page-container">

    {#if loading}
        <div class="msg">🚀 Lade Fortschritt...</div>

    {:else if errorMessage}
        <div class="msg error">
            ⚠️ {errorMessage}
            {#if viewerRole === 'teacher'}
                <br><small>Bist du dieser Klasse zugewiesen?</small>
            {/if}
        </div>

    {:else if profile}

        {#if !isOwner}
            <div class="teacher-banner">
                <span>👀 Du betrachtest den Fortschritt von <strong>{profile.full_name}</strong></span>
                <button onclick={() => history.back()}>Zurück zur Liste</button>
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
            <h2>Missionen & Aufgaben</h2>

            {#if missionsData.length === 0}
                <div class="empty">Noch keine Missionen.</div>
            {:else}
                <div class="grid">
                    {#each missionsData as item}
                        {#if item.missions}
                            <div class="card {item.completed ? 'done' : ''}">
                                <div class="head">
                                    <h3>{item.missions.title}</h3>
                                    <span class="xp">+{item.missions.xp_reward} XP</span>
                                </div>
                                <p>{item.missions.description}</p>

                                <div class="track">
                                    <div class="fill" style="width: {item.progress}%; background: {getBarColor(item.progress, item.completed)}"></div>
                                </div>
                                <small>{item.completed ? 'Erledigt!' : `${item.progress}%`}</small>
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

    /* Lehrer Banner */
    .teacher-banner {
        background: #fff3cd; color: #856404; padding: 1rem; border-radius: 8px; border: 1px solid #ffeeba;
        margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;
    }
    .teacher-banner button { background: white; border: 1px solid #ddd; padding: 0.3rem 0.8rem; cursor: pointer; border-radius: 4px; }

    /* Header */
    .profile-header { display: flex; gap: 1.5rem; align-items: center; background: white; padding: 2rem; border-radius: 12px; border: 1px solid #eee; margin-bottom: 2rem; }
    .avatar { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 4px solid #f3be6a; }
    .info h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    .stats { display: flex; gap: 2rem; }
    .stat { display: flex; flex-direction: column; }
    .stat span { font-size: 0.8rem; text-transform: uppercase; color: #888; font-weight: bold; }
    .stat strong { font-size: 1.2rem; color: #236c93; }

    /* Cards */
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .card { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #eee; }
    .card.done { background: #f1f8e9; border-color: #81c784; }
    .head { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .head h3 { margin: 0; font-size: 1.1rem; }
    .xp { background: #fff8e1; color: #f57f17; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; }

    .track { height: 8px; background: #eee; border-radius: 4px; margin: 10px 0 5px; overflow: hidden; }
    .fill { height: 100%; transition: width 0.5s; }

    .msg { text-align: center; margin-top: 3rem; color: #666; }
    .error { color: red; background: #ffebee; padding: 1rem; border-radius: 8px; }
    .empty { text-align: center; color: #888; font-style: italic; padding: 2rem; background: #f9f9f9; border-radius: 8px; }
</style>
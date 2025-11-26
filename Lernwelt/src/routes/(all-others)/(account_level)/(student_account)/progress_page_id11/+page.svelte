<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient.js';

    let loading = true;
    let errorMessage = '';
    let profile = null;
    let missionsData = [];

    onMount(async () => {
        console.log("🚀 Start: Lade Progress Seite...");

        try {
            // 1. Check Login
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Auth Error:", authError);
                throw new Error('Du bist nicht eingeloggt.');
            }

            console.log("✅ User gefunden:", user.id);
            const targetUserId = user.id;

            // 2. Profil laden
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .maybeSingle();

            if (profileError) {
                console.error("DB Error Profil:", profileError);
                throw new Error('Fehler beim Laden des Profils: ' + profileError.message);
            }

            if (!profileData) {
                console.error("❌ Kein Profil gefunden für ID:", targetUserId);
                throw new Error('Dein Benutzerprofil fehlt in der Datenbank.');
            }

            profile = profileData;

            // 3. Missionen laden
            const { data: progressData, error: progressError } = await supabase
                .from('missions_progress')
                .select(`
                    progress,
                    completed,
                    missions ( title, description, xp_reward )
                `)
                .eq('user_id', targetUserId)
                .order('completed', { ascending: true });

            if (progressError) throw progressError;

            // Debug: Zeige geladene Daten
            console.log("📊 Geladene Missionen:", progressData);

            missionsData = progressData || [];

        } catch (error) {
            console.error("Gesamt-Fehler:", error);
            errorMessage = error.message;
        } finally {
            loading = false;
        }
    });

    // Farbe berechnen
    function getBarColor(progress, isCompleted) {
        if (isCompleted) return '#4caf50'; // Grün
        if (progress >= 75) return '#66bb6a'; // Hell-Grün
        if (progress >= 50) return '#f3be6a'; // Gold/Gelb
        if (progress >= 25) return '#ff9800'; // Orange
        if (progress > 0) return '#42a5f5'; // Blau
        return 'transparent'; // Bei 0% keine Farbe im Füllbalken
    }

    // Text für den Status
    function getProgressLabel(progress, isCompleted) {
        if (isCompleted) return '✓ Abgeschlossen';
        if (!progress || progress === 0) return 'Noch nicht begonnen'; // Wichtig: Auch null/undefined abfangen
        if (progress < 25) return 'Gerade erst gestartet';
        if (progress < 50) return 'Auf dem Weg...';
        if (progress < 75) return 'Über die Hälfte!';
        if (progress < 100) return 'Fast fertig!';
        return 'Fertig!';
    }
</script>

<div class="content-wrapper">
    <div class="header-box">
        <h1>Lernfortschritt</h1>
        <p>Dein aktueller Status, Level und Missionen.</p>
    </div>

    {#if loading}
        <div class="status-msg">
            <span class="spinner">🚀</span> Lade Profil...
        </div>
    {:else if errorMessage}
        <div class="status-msg error">⚠️ {errorMessage}</div>
    {:else if profile}

        <div class="profile-section">
            <div class="profile-card">
                <img
                        src={profile.avatar_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                        alt="Profilbild"
                        class="avatar"
                />

                <div class="profile-details">
                    <h2>{profile.full_name || 'Schüler'}</h2>
                    <span class="role-badge">{profile.role || 'Schüler'}</span>
                </div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <span class="stat-value">{profile.level || 1}</span>
                        <span class="stat-label">Level</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">{profile.xp || 0}</span>
                        <span class="stat-label">XP</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-value">❤️ {profile.hearts || 3}</span>
                        <span class="stat-label">Leben</span>
                    </div>
                </div>
            </div>
        </div>

        <h3 class="section-title">Deine Missionen ({missionsData.length})</h3>

        {#if missionsData.length === 0}
            <div class="empty-state">
                <p>📋 Keine Missionen zugewiesen.</p>
                <p class="hint">Warte auf deine Lehrkraft oder kontaktiere den Support.</p>
            </div>
        {:else}
            <div class="missions-grid">
                {#each missionsData as item}
                    {#if item.missions}
                        <div class="mission-card {item.completed ? 'is-completed' : ''} {item.progress > 0 && !item.completed ? 'in-progress' : ''}">

                            <div class="mission-header">
                                <h4>{item.missions.title}</h4>
                                <span class="xp-badge">+{item.missions.xp_reward} XP</span>
                            </div>

                            <p class="mission-desc">
                                {item.missions.description || 'Keine Beschreibung verfügbar.'}
                            </p>

                            <div class="progress-container">
                                <div class="progress-info">
                                    <span class="progress-status">{getProgressLabel(item.progress, item.completed)}</span>
                                    <span class="progress-percent">{item.progress || 0}%</span>
                                </div>

                                <div class="progress-bar-wrapper">
                                    <div class="progress-bar-bg">
                                        <div
                                                class="progress-bar-fill"
                                                style="width: {item.progress || 0}%; background-color: {getBarColor(item.progress, item.completed)};"
                                        >
                                            {#if item.progress > 10}
                                                <span class="progress-inner-text"></span>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {#if item.completed}
                                <div class="stamp">✓ ERLEDIGT</div>
                            {:else if item.progress > 0}
                                <div class="progress-icon">🔥</div>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        {/if}

    {/if}
</div>


<style>
    .content-wrapper {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-bottom: 2rem;
        box-sizing: border-box;
        overflow-x: hidden;
    }

    /* --- Header --- */
    .header-box {
        background: linear-gradient(135deg, #236C93 0%, #1a5070 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(35, 108, 147, 0.2);
    }
    .header-box h1 {
        margin: 0;
        font-size: 2rem;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .header-box p {
        color: #f3be6a;
        font-weight: 600;
        margin-top: 0.5rem;
    }

    /* --- Profil --- */
    .profile-section {
        display: flex;
        justify-content: center;
    }

    .profile-card {
        background: #fdfdfd;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 2rem;
        width: 100%;
        max-width: 500px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        box-sizing: border-box;
    }

    .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid #f3be6a;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .profile-details h2 { margin: 0; color: #333; }
    .role-badge {
        background-color: #e3f2fd;
        color: #1565c0;
        padding: 0.3rem 0.9rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
        text-transform: uppercase;
        margin-top: 0.5rem;
        display: inline-block;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 1rem;
        width: 100%;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #f0f0f0;
    }

    .stat-box { display: flex; flex-direction: column; gap: 0.2rem; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #236C93; }
    .stat-label { font-size: 0.8rem; text-transform: uppercase; color: #888; font-weight: 600; }

    /* --- Missionen --- */
    .section-title {
        font-size: 1.4rem;
        color: #333;
        margin-bottom: 0.5rem;
        border-left: 5px solid #236C93;
        padding-left: 1rem;
    }

    .missions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
        gap: 1.5rem;
        width: 100%;
    }

    .mission-card {
        background: #fff;
        border: 2px solid #eee;
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        box-sizing: border-box;
        width: 100%;
    }

    .mission-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 20px rgba(35, 108, 147, 0.15);
        border-color: #236C93;
    }

    .mission-card.in-progress {
        border-color: #42a5f5;
        background: linear-gradient(to bottom, #fff 0%, #f0f8ff 100%);
    }

    .mission-card.is-completed {
        background: linear-gradient(to bottom, #f1f8e9 0%, #e8f5e9 100%);
        border-color: #81c784;
    }

    .mission-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.8rem;
        gap: 0.5rem;
    }
    .mission-header h4 {
        margin: 0;
        font-size: 1.15rem;
        color: #333;
        line-height: 1.3;
        flex: 1;
    }

    .xp-badge {
        background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        color: #f57f17;
        font-weight: bold;
        font-size: 0.85rem;
        padding: 0.3rem 0.7rem;
        border-radius: 8px;
        border: 2px solid #ffe082;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(245, 127, 23, 0.1);
    }

    .mission-desc {
        font-size: 0.95rem;
        color: #666;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    /* --- PROGRESS BAR STYLING --- */
    .progress-container {
        margin-top: auto;
    }

    .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .progress-status {
        font-size: 0.85rem;
        color: #555;
        font-weight: 600;
    }

    .progress-percent {
        font-size: 0.9rem;
        font-weight: 700;
        color: #236C93;
    }

    .progress-bar-wrapper {
        position: relative;
    }

    /* Hier ist der "leere" Balken (Die Rinne) */
    .progress-bar-bg {
        width: 100%;
        height: 24px;
        background: #f1f3f5; /* Helles Grau für den Hintergrund */
        border: 1px solid #ced4da; /* Ein feiner Rahmen, damit man die "Leere" sieht */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
    }

    .progress-bar-fill {
        height: 100%;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
    }

    .progress-inner-text {
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    }

    /* Icons */
    .stamp {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.8rem;
        font-weight: 900;
        color: rgba(76, 175, 80, 0.3);
        transform: rotate(-12deg);
        pointer-events: none;
        user-select: none;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }

    .progress-icon {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
    }

    .status-msg {
        text-align: center;
        padding: 2rem;
        color: #555;
        font-size: 1.1rem;
    }

    .error {
        color: #d32f2f;
        background: #ffebee;
        border-radius: 8px;
    }

    .empty-state {
        text-align: center;
        color: #666;
        padding: 3rem;
        background: linear-gradient(135deg, #f9f9f9 0%, #fff 100%);
        border-radius: 12px;
        border: 2px dashed #ddd;
    }

    .empty-state p:first-child {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }

    .hint {
        font-size: 0.9rem;
        color: #999;
        font-style: italic;
    }

    @media (max-width: 600px) {
        .stats-grid {
            gap: 0.5rem;
        }
        .stat-value {
            font-size: 1.2rem;
        }
        .missions-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        .header-box h1 {
            font-size: 1.5rem;
        }
        .header-box {
            padding: 1.5rem 1rem;
        }
        .profile-card {
            padding: 1.5rem;
        }
        .mission-card {
            padding: 1.25rem;
        }
        .section-title {
            font-size: 1.2rem;
        }
    }
</style>
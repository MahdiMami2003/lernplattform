<!--Lernwelt/src/routes/(all-others)/(account_level)/(student_account)/progress_page_id11/+page.svelte-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from '$lib/i18n/config';
	import { getUserBadges } from '$lib/badgeService';
	let { data } = $props();
	let { supabase } = data;

	// State
	let loading = $state(true);
	let errorMessage = $state('');
	let profile = $state(null);
	let missionsData = $state<any[]>([]);
	let myBadges = $state<any[]>([]);

	// Rollen & Logik
	let viewerRole = $state(''); // 'teacher', 'parent', 'student'
	let isOwner = $state(false);

	// Für Eltern: Liste der Kinder
	let myChildren = $state([]);
	let showChildSelection = $state(false);

	onMount(async () => {
		// 1. Session holen
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) {
			goto('/login_page_id2');
			return;
		}

		const myUserId = session.user.id;

		// 2. Meine Rolle holen
		const { data: myProfile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', myUserId)
			.single();

		viewerRole = (myProfile?.role || 'student').toLowerCase();

		// 3. Wen wollen wir sehen? (URL prüfen)
		const urlParams = new URLSearchParams(window.location.search);
		let targetUserId = urlParams.get('userId');

		// --- SZENARIO A: ELTERN ---
		if (viewerRole === 'parent') {
			// Wir holen die Kinder (IDs und Profile)
			const { data: links } = await supabase
				.from('parent_children')
				.select('child_id')
				.eq('parent_id', myUserId);

			if (links && links.length > 0) {
				const childIds = links.map((l) => l.child_id);
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
					errorMessage = 'Keine verknüpften Kinder gefunden.';
					loading = false;
					return;
				}
			} else {
				// Sicherheitscheck: Ist das wirklich mein Kind?
				const isMyChild = myChildren.some((c) => c.id === targetUserId);
				if (!isMyChild && myChildren.length > 0) {
					errorMessage = 'Du hast keinen Zugriff auf dieses Profil.';
					loading = false;
					return;
				}
			}
		}

		// --- SZENARIO B: LEHRER ---
		// Lehrer kommen meistens direkt mit ?userId=... aus der Klassenliste.
		// Falls keine ID da ist, ist das ein Fehler.
		if (viewerRole === 'teacher' && !targetUserId) {
			errorMessage = 'Kein Schüler ausgewählt. Bitte gehe über die Klassenliste.';
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
		isOwner = idToLoad === myUserId;

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
			if (!pData) throw new Error('Profil nicht gefunden.');

			profile = pData;

			// B. Missionen laden
			let { data: mData, error: mError } = await supabase
				.from('missions_progress')
				.select(`progress, completed, missions (title, description, xp_reward, total)`)
				.eq('user_id', targetId)
				.order('completed', { ascending: true });

			if (mError) throw mError;

			// --- AUTO-SYNC MISSIONS ---
			// Ensure user has an entry for EVERY mission.
			if (isOwner) {
				const { count: totalMissions } = await supabase
					.from('missions')
					.select('*', { count: 'exact', head: true });
				const myCount = mData ? mData.length : 0;

				if (totalMissions && myCount < totalMissions) {
					console.log(`Syncing missions... User has ${myCount}, Total is ${totalMissions}`);
					const { data: allMissions } = await supabase.from('missions').select('id');

					if (allMissions) {
						const inserts = allMissions.map((m) => ({
							user_id: targetId,
							mission_id: m.id,
							progress: 0,
							completed: false
						}));

						// Upsert ignores existing rows thanks to 'ignoreDuplicates'
						await supabase
							.from('missions_progress')
							.upsert(inserts, { onConflict: 'user_id, mission_id', ignoreDuplicates: true });

						// Re-fetch
						const { data: mDataRetry } = await supabase
							.from('missions_progress')
							.select(`progress, completed, missions (title, description, xp_reward, total)`)
							.eq('user_id', targetId)
							.order('completed', { ascending: true });

						if (mDataRetry) mData = mDataRetry;
					}
				}
			}
			// ---------------------------

			// Deduplicate missions: keep unique by title
			if (mData) {
				const unique: Record<string, any> = {};
				for (const m of mData) {
					const t = m.missions?.title;
					if (t) {
						if (!unique[t] || m.completed || m.progress > unique[t].progress) {
							unique[t] = m;
						}
					}
				}
				missionsData = Object.values(unique);
			} else {
				missionsData = [];
			}

			// C. Badges laden
			const bData = await getUserBadges(supabase, targetId);
			myBadges = bData || [];
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

	function getBarColor(p, c) {
		return c ? '#4caf50' : p > 0 ? '#f3be6a' : '#ddd';
	}

	function calculateWidth(item) {
		if (item.completed) return 100;
		const val = item.progress || 0;
		// If total is available from DB, use it directly
		if (item.missions && item.missions.total > 0) {
			return (val / item.missions.total) * 100;
		}

		// Fallbacks
		if (val > 10) return Math.min(val, 100);

		// Try to find a goal in title (e.g. "3 ...")
		const txt = (item.missions?.title || '') + ' ' + (item.missions?.description || '');
		const match = txt.match(/(\d+)/);
		const goal = match ? parseInt(match[1], 10) : 0;

		if (goal > 0 && val <= goal) {
			return (val / goal) * 100;
		}
		return val;
	}
</script>

<div class="page-container main_container">
	{#if loading}
		<div class="msg">🚀 {$_('progress.loading')}</div>
	{:else if errorMessage}
		<div class="msg error">
			⚠️ {errorMessage}
			<br /><br />
			<button onclick={() => history.back()}>{$_('common.back')}</button>
		</div>
	{:else if showChildSelection}
		<div class="selection-screen">
			<h1>{$_('progress.select_title')}</h1>
			<p>{$_('progress.select_subtitle')}</p>

			<div class="child-grid">
				{#each myChildren as child}
					<button class="child-card" onclick={() => selectChild(child.id)}>
						<img
							src={child.avatar_url}
							alt={child.full_name}
							onerror={(e) =>
								((e.target as HTMLImageElement).src =
									`https://ui-avatars.com/api/?name=${child.full_name}&background=random`)}
						/>
						<span>{child.full_name}</span>
					</button>
				{/each}
			</div>

			<br />
			<a href="/parents_landing_page_id4" class="back-to-dash">
				{$_('progress.back_to_dashboard')}
			</a>
		</div>
	{:else if profile}
		{#if viewerRole === 'parent'}
			<div class="info-banner parent">
				<div class="banner-text">
					<span>{$_('progress.parent_viewing')} <strong>{profile.full_name}</strong></span>
				</div>
				<div class="banner-actions">
					{#if myChildren.length > 1}
						<button class="switch-btn" onclick={() => (showChildSelection = true)}>
							👥 {$_('progress.other_child')}
						</button>
					{/if}
					<a href="/parents_landing_page_id4" class="back-link">{$_('progress.dashboard')}</a>
				</div>
			</div>
		{/if}

		{#if viewerRole === 'teacher'}
			<div class="info-banner teacher">
				<span>👨‍🏫 {$_('progress.teacher_view')} <strong>{profile.full_name}</strong></span>
				<button class="back-btn" onclick={() => history.back()}
					>{$_('progress.back_to_list')}</button
				>
			</div>
		{/if}

		<header class="profile-header">
			<img
				src={profile.avatar_url}
				alt={$_('progress.avatar_alt')}
				class="avatar"
				onerror={(e) =>
					((e.target as HTMLImageElement).src =
						`https://ui-avatars.com/api/?name=${profile.full_name}&background=f3be6a&color=fff`)}
			/>
			<div class="info">
				<h1>{profile.full_name}</h1>
				<div class="stats">
					<div class="stat">
						<span>{$_('progress.level')}</span> <strong>{profile.level || 1}</strong>
					</div>
					<div class="stat">
						<span>{$_('progress.xp')}</span> <strong>{profile.xp || 0}</strong>
					</div>
				</div>
			</div>
		</header>

		<!-- Added Badges Section -->
		<section class="badges-section">
			<h2>{$_('game.badges_title') || 'Achievements'}</h2>
			<div class="badges-grid">
				{#each myBadges as badge}
					<div class="badge-card">
						<div class="badge-icon">
							{#if badge.badge_id === 'perfect_round'}
								🏅
							{:else if badge.badge_id === 'streak_master'}
								🔥
							{:else if badge.badge_id === 'math_hero'}
								📘
							{:else if badge.badge_id === 'phy_hero'}
								⚛️
							{:else}
								🏆
							{/if}
						</div>
						<div class="badge-name">
							{#if badge.badge_id === 'perfect_round'}
								{$_('game.badge_perfect')}
							{:else if badge.badge_id === 'streak_master'}
								{$_('game.badge_streak')}
							{:else if badge.badge_id === 'math_hero'}
								{$_('game.badge_math_hero')}
							{:else if badge.badge_id === 'phy_hero'}
								{$_('game.badge_phy_hero')}
							{:else}
								{badge.badge_id}
							{/if}
						</div>
						<div class="badge-desc">
							<!-- Optional Description Mapping -->
						</div>
					</div>
				{/each}

				{#if myBadges.length === 0}
					<p style="color: var(--text-secondary); width: 100%; text-align: center;">
						Noch keine Badges freigeschaltet. Spiel weiter!
					</p>
				{/if}
			</div>
		</section>

		<section class="missions">
			<h2>{$_('progress.learning_progress')}</h2>

			{#if missionsData.length === 0}
				<div class="empty">{$_('progress.no_missions')}</div>
			{:else}
				<div class="grid">
					{#each missionsData as item}
						{#if item.missions}
							<div class="card {item.completed ? 'done' : ''}">
								{#if item.completed}
									<div class="status-icon">✔</div>
								{/if}

								<div class="head">
									<h3>{item.missions.title}</h3>
									<p class="desc">{item.missions.description || ''}</p>
								</div>

								<div class="track">
									<div
										class="fill"
										style="width: {calculateWidth(item)}%; background: {getBarColor(
											item.progress,
											item.completed
										)}"
									></div>
								</div>

								<div class="progress-text">
									{#if item.completed}
										<strong style="color: var(--success-color);">{$_('progress.done')}</strong>
									{:else}
										<span>
											{item.progress} / {item.missions?.total || '?'}
										</span>
									{/if}
									<span class="xp-badge">+{item.missions.xp_reward} XP</span>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	/* ============ MAIN CONTAINER ============ */
	.page-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Inter', sans-serif;
		background-color: var(--bg-main);
		color: var(--text-primary);
		min-height: 100vh;
		transition: background-color 0.3s ease;
	}

	/* ============ TYPOGRAPHY ============ */
	h1,
	h2,
	h3 {
		color: var(--text-primary);
		transition: color 0.3s ease;
	}

	h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		border-bottom: 2px solid var(--border-color);
		padding-bottom: 0.5rem;
	}

	/* ============ SELECTION SCREEN ============ */
	.selection-screen {
		text-align: center;
		margin-top: 4rem;
	}

	.child-grid {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 3rem;
		flex-wrap: wrap;
	}

	.child-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 2rem;
		width: 180px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.child-card:hover {
		transform: translateY(-8px);
		border-color: var(--button-bg);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
	}

	.child-card img {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid var(--border-accent);
	}

	.child-card span {
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--text-primary);
	}

	/* ============ INFO BANNER ============ */
	.info-banner {
		padding: 1rem 1.5rem;
		border-radius: 12px;
		margin-bottom: 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
		border-left: 5px solid var(--button-bg);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		flex-wrap: wrap;
		gap: 1rem;
	}

	.banner-text span {
		font-size: 1rem;
		color: var(--text-secondary);
	}

	.banner-text strong {
		color: var(--text-primary);
		font-weight: 700;
	}

	.banner-actions button,
	.banner-actions a {
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
		display: inline-block;
	}

	.switch-btn {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
	}

	.switch-btn:hover {
		background: var(--bg-hover);
		border-color: var(--text-primary);
	}

	.back-link {
		color: var(--button-bg);
	}

	.back-link:hover {
		text-decoration: underline;
	}

	/* ============ PROFILE HEADER ============ */
	.profile-header {
		display: flex;
		gap: 2rem;
		align-items: center;
		background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%);
		padding: 2.5rem;
		border-radius: 20px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		margin-bottom: 3rem;
		position: relative;
		overflow: hidden;
	}

	/* Decorative detail */
	.profile-header::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 150px;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1));
		pointer-events: none;
	}

	.avatar {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid white;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.info {
		flex: 1;
	}

	.info h1 {
		font-size: 2rem;
		margin: 0 0 0.5rem 0;
		font-weight: 800;
	}

	.stats {
		display: flex;
		gap: 3rem;
		margin-top: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat span {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.stat strong {
		font-size: 1.6rem;
		color: var(--text-primary);
		font-weight: 800;
	}

	/* ============ BADGES SECTION (NEW) ============ */
	.badges-section {
		margin-bottom: 3rem;
	}

	.badges-grid {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		padding: 1rem 0.5rem;
		/* Hide Scrollbar but allow scroll */
		scrollbar-width: thin;
	}

	.badge-card {
		min-width: 140px;
		background: var(--bg-card);
		border-radius: 12px;
		padding: 1rem;
		text-align: center;
		border: 1px solid var(--border-color);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
		transition: transform 0.3s;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.badge-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);
	}

	.badge-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}

	.badge-name {
		font-weight: 700;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.badge-desc {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	/* ============ MISSIONS GRID ============ */
	.missions {
		margin-top: 1rem;
	}

	.grid {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	}

	.card {
		background: var(--bg-card);
		padding: 1.5rem;
		border-radius: 16px;
		border: 1px solid var(--border-color);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: relative;
		overflow: hidden;
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background: var(--border-accent);
		opacity: 0.5;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
		border-color: var(--border-accent);
	}

	.card.done {
		border-color: var(--success-color);
	}

	.card.done::before {
		background: var(--success-color);
		opacity: 1;
	}

	.status-icon {
		position: absolute;
		top: 1rem;
		right: 1rem;
		font-size: 1.2rem;
		color: var(--success-color);
		background: rgba(76, 175, 80, 0.1);
		padding: 0.25rem;
		border-radius: 50%;
	}

	.head h3 {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.xp-badge {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 700;
		background: var(--bg-hover);
		color: var(--text-muted);
		padding: 0.25rem 0.6rem;
		border-radius: 99px;
	}

	.track {
		height: 10px;
		background: var(--bg-hover);
		border-radius: 99px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 99px;
		transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.progress-text {
		font-size: 0.85rem;
		color: var(--text-secondary);
		display: flex;
		justify-content: space-between;
	}

	.empty {
		text-align: center;
		padding: 3rem;
		background: var(--bg-card);
		border-radius: 12px;
		border: 2px dashed var(--border-color);
		color: var(--text-muted);
	}

	/* ============ MESSAGES ============ */
	.msg {
		text-align: center;
		margin-top: 5rem;
		font-size: 1.2rem;
		color: var(--text-secondary);
	}

	.error {
		border-color: var(--error-color);
		color: var(--error-color);
	}

	/* ============ RESPONSIVE ============ */
	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.profile-header {
			flex-direction: column;
			text-align: center;
			padding: 2rem 1rem;
			gap: 1rem;
		}

		.stats {
			justify-content: center;
			gap: 2rem;
		}

		.info-banner {
			flex-direction: column;
			text-align: center;
		}

		.badges-grid {
			justify-content: flex-start; /* allow scroll */
		}
	}
</style>

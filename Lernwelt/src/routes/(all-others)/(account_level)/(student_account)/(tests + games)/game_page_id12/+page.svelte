<!--Lernwelt/src/routes/(all-others)/(account_level)/(student_account)/(tests + games)/game_page_id12/+page.svelte-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from '$lib/i18n/config';
	let { data } = $props();
	let { supabase, session } = data;

	/* ============================ TYPES ============================ */
	type UserProfile = {
		id: string;
		full_name?: string;
		xp: number;
		level: number;
		avatar_url: string | null;
	};

	/* ============================ STATE ============================ */
	let profile = $state<UserProfile | null>(null);
	let userName = $state('Schüler');
	let xp = $state(0);
	let level = $state(1);
	let avatar = $state('https://cdn-icons-png.flaticon.com/512/921/921071.png');

	// Modals
	let avatarModal = $state(false);
	let categoryModal = $state(false);
	let levelUpVisible = $state(false);

	// Kategorie Auswahl Logik
	let selectedSubjectName = $state('');
	let selectedTargetRoute = $state('');
	let availableCategories = $state<string[]>([]);
	let loadingCategories = $state(false);

	const avatars: string[] = [
		'https://cdn-icons-png.flaticon.com/512/921/921071.png',
		'https://cdn-icons-png.flaticon.com/512/1998/1998671.png',
		'https://cdn-icons-png.flaticon.com/512/1998/1998749.png',
		'https://cdn-icons-png.flaticon.com/512/1998/1998728.png',
		'https://cdn-icons-png.flaticon.com/512/4331/4331403.png',
		'https://cdn-icons-png.flaticon.com/512/4331/4331396.png',
		'https://cdn-icons-png.flaticon.com/512/194/194938.png',
		'https://cdn-icons-png.flaticon.com/512/194/194935.png',
		'https://cdn-icons-png.flaticon.com/512/147/147144.png',
		'https://cdn-icons-png.flaticon.com/512/147/147131.png',
		'https://cdn-icons-png.flaticon.com/512/847/847969.png',
		'https://cdn-icons-png.flaticon.com/512/847/847970.png'
	];

	// ============================
	// LOGIK: KATEGORIEN LADEN
	// ============================
	async function openSubject(subjectDBName: string, route: string) {
		selectedSubjectName = subjectDBName;
		selectedTargetRoute = route;
		loadingCategories = true;
		categoryModal = true;
		availableCategories = [];

		// Wir holen alle Kategorien, die zu diesem Fach gehören
		const { data, error } = await supabase
			.from('questions')
			.select('category')
			.ilike('subject', `${subjectDBName}%`)
			.not('category', 'is', null);

		if (error) {
			console.error('Fehler beim Laden der Kategorien:', error);
			availableCategories = ['Allgemein'];
		} else {
			// Duplikate entfernen und sortieren
			const uniqueCategories = [...new Set(data.map((d) => d.category))].sort();

			if (uniqueCategories.length > 0) {
				availableCategories = uniqueCategories;
			} else {
				// Falls keine Kategorien in der DB sind, starte direkt
				startGameWithCategory(null);
				return;
			}
		}
		loadingCategories = false;
	}

	// Toggle für Lückentext-Modus
	let isClozeMode = $state(false);

	function startGameWithCategory(category: string | null) {
		let url = selectedTargetRoute;

		if (isClozeMode) {
			// Redirect to generic Cloze Game engine
			// Route: /cloze_game?subject=[Subject]&topic=[Category]
			const topic = category || 'Allgemein';
			url = `/cloze_game?subject=${encodeURIComponent(selectedSubjectName)}&topic=${encodeURIComponent(topic)}`;
		} else {
			// Normal Game (MC enforced)
			url += `?type=mc`;
			if (category) {
				url += `&category=${encodeURIComponent(category)}`;
			}
		}

		categoryModal = false;
		goto(url);
	}

	// ============================
	// AVATAR & PROFIL LOGIK
	// ============================
	async function selectAvatar(a: string) {
		if (!profile) return;
		avatar = a;
		avatarModal = false;

		await supabase.from('profiles').update({ avatar_url: a }).eq('id', profile.id);
	}

	async function loadProfile() {
		const { data: auth } = await supabase.auth.getUser();

		if (!auth?.user) {
			console.warn('⚠ Kein Login – Zugriff verweigert');
			goto('/no_permission_page_id18');
			return;
		}

		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', auth.user.id)
			.single();

		if (error) {
			console.error('Fehler beim Laden von Profil', error);
			return;
		}

		// Lockere Rollenprüfung: Erlaube student ODER admin
		if (data.role !== 'student' && data.role !== 'admin') {
			console.warn('⚠ Zugriff auf Spiele ist nur für Schüler/Admin erlaubt');
			goto('/no_permission_page_id18');
			return;
		}

		profile = data as UserProfile;
		userName = profile.full_name || 'Schüler';
		xp = profile.xp;
		level = profile.level;
		avatar = profile.avatar_url ?? avatar;

		console.log('🟢 Profil gefunden:', profile);
	}

	// XP VERGEBEN
	async function rewardXP(amount = 5) {
		if (!profile) return;
		let newXP = xp + amount;
		let newLevel = level;

		if (newXP >= 100) {
			newXP -= 100;
			newLevel++;
			levelUpVisible = true;
			setTimeout(() => (levelUpVisible = false), 2000);
		}

		xp = newXP;
		level = newLevel;

		await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', profile.id);
	}

	onMount(async () => {
		console.log('🟢 onMount gestartet');
		await loadProfile();
	});
</script>

<section class="hero">
	<div class="back-btn-wrapper">
		<button
			class="back-home-btn"
			onclick={() => goto('/student_landing_page_id5')}
			aria-label="Zurück"
		>
			<span class="back-icon">←</span>
			<span>Zurück</span>
		</button>
	</div>

	<div class="avatar-wrapper">
		<button class="avatar-btn" onclick={() => (avatarModal = true)}>
			<img class="avatar-img" src={avatar} alt="avatar" />
		</button>
	</div>

	{#if avatarModal}
		<div
			class="modal-bg"
			onclick={() => (avatarModal = false)}
			role="button"
			tabindex="0"
			onkeydown={() => {}}
		></div>
		<div class="modal">
			<h2>{$_('student.avatar_choose')}</h2>
			<div class="avatar-list">
				{#each avatars as a}
					<button class="img-btn" onclick={() => selectAvatar(a)}>
						<img src={a} alt="avatar" />
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if categoryModal}
		<div
			class="modal-bg"
			onclick={() => (categoryModal = false)}
			role="button"
			tabindex="0"
			onkeydown={() => {}}
		></div>
		<div class="modal category-modal">
			<h2>{$_('student.choose_topic_for', { values: { subject: selectedSubjectName } })}</h2>

			{#if loadingCategories}
				<p>{$_('student.loading_topics')}</p>
			{:else}
				<div class="category-grid">
					<button class="cat-btn all" onclick={() => startGameWithCategory(null)}>
						{$_('student.shuffle_all')}
					</button>

					{#each availableCategories as cat}
						<button class="cat-btn" onclick={() => startGameWithCategory(cat)}>
							{cat}
						</button>
					{/each}
				</div>
			{/if}

			<button class="close-btn" onclick={() => (categoryModal = false)}
				>{$_('student.cancel')}</button
			>
		</div>
	{/if}

	<h1>{$_('student.welcome_back', { values: { name: userName } })}</h1>
	<p>{$_('student.learning_journey')}</p>

	{#if levelUpVisible}
		<div class="level-up-popup">{$_('student.level_up', { values: { level } })}</div>
	{/if}

	<div class="xp-container">
		<div class="xp-fill" style="width: {xp}%"></div>
	</div>
	<p class="xp-label">{$_('student.level_xp', { values: { level, xp } })}</p>
</section>

<section class="subjects">
	<h2>{$_('student.choose_subject')}</h2>

	<!-- Game Mode Toggle -->
	<div class="mode-toggle">
		<label class="toggle-switch">
			<input type="checkbox" bind:checked={isClozeMode} />
			<span class="slider"></span>
		</label>
		<span class="mode-label">
			{isClozeMode ? 'Lückentext-Modus' : 'Standard-Modus (Minispiele)'}
		</span>
	</div>

	<div class="subject-grid">
		<button onclick={() => openSubject('Mathe', '/mathe_game')}>➕ {$_('subjects.math')}</button>
		<button onclick={() => openSubject('Physik', '/physik_game')}
			>⚛ {$_('subjects.physics')}</button
		>
		<button onclick={() => openSubject('Deutsch', '/deutsch_game')}
			>📘 {$_('subjects.german')}</button
		>
		<button onclick={() => openSubject('English', '/englisch_game')}
			>🌎 {$_('subjects.english')}</button
		>
	</div>
</section>

<style>
	/* ============ DARK MODE SUPPORT ============ */
	:global(body) {
		background: var(--bg-main, #f4f7fb);
		font-family: system-ui, sans-serif;
		margin: 0;
		transition: background-color 0.3s ease;
	}

	.hero {
		position: relative;
		text-align: center;
		margin-bottom: 2rem;
		padding-top: 1rem;
		padding-left: 1.5rem;
		padding-right: 1.5rem;
	}

	.hero h1,
	.hero p {
		color: var(--text-primary, #000);
		transition: color 0.3s ease;
	}

	.back-btn-wrapper {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		margin-bottom: 1rem;
	}

	.back-home-btn {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding: 0.7rem 1.4rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 50px;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
		font-weight: 600;
		font-size: 0.95rem;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		min-height: 44px;
	}

	.back-home-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
		background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
	}

	.back-home-btn:active {
		transform: translateY(0);
	}

	.back-home-btn:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
	}

	.back-home-btn .back-icon {
		font-size: 1.1rem;
		transition: transform 0.2s ease;
	}

	.back-home-btn:hover .back-icon {
		transform: translateX(-3px);
	}

	.avatar-wrapper {
		width: 150px;
		height: 150px;
		margin: 0 auto;
		position: relative;
	}

	.avatar-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.avatar-btn:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
		border-radius: 50%;
	}

	.avatar-img {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		border: 5px solid var(--border-color, white);
		object-fit: cover;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		transition: all 0.3s ease;
	}

	.avatar-img:hover {
		transform: scale(1.05);
	}

	.xp-container {
		width: 80%;
		height: 14px;
		background: var(--bg-hover, #d9e5ef);
		border-radius: 20px;
		margin: 1rem auto 0;
		overflow: hidden;
		transition: background-color 0.3s ease;
	}

	.xp-fill {
		height: 100%;
		background: linear-gradient(90deg, #3ba776, #65d492);
		transition: width 0.3s;
	}

	.xp-label {
		color: var(--button-bg, #236c93);
		font-weight: bold;
		margin-top: 0.4rem;
		transition: color 0.3s ease;
	}

	.subjects {
		text-align: center;
		margin-top: 2rem;
		padding: 0 1rem;
	}

	.subjects h2 {
		color: var(--text-primary, #000);
		transition: color 0.3s ease;
	}

	/* --- SUBJECT GRID --- */
	.subject-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 1rem;
		width: 100%;
		max-width: 1000px;
		margin-left: auto;
		margin-right: auto;
	}

	.subject-grid button {
		padding: 1.5rem 1rem;
		border: none;
		border-radius: 16px;
		font-weight: bold;
		cursor: pointer;
		transition:
			transform 0.2s,
			background 0.2s;
		background: #3ba776;
		color: white;
		font-size: 1.2rem;
		flex: 1;
		min-width: 140px;
		max-width: 220px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		min-height: 44px;
	}

	.subject-grid button:hover {
		transform: translateY(-3px);
		background: #236c93;
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
	}

	.subject-grid button:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
	}

	/* ============ MODAL STYLES ============ */
	.modal-bg {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--bg-card, white);
		color: var(--text-primary, #000);
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
		text-align: center;
		width: 90%;
		max-width: 400px;
		z-index: 101;
		max-height: 80vh;
		overflow-y: auto;
		transition: all 0.3s ease;
	}

	.modal h2 {
		color: var(--text-primary, #000);
		transition: color 0.3s ease;
	}

	.avatar-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.img-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.img-btn:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
		border-radius: 50%;
	}

	.avatar-list img {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		transition: all 0.2s ease;
		border: 2px solid var(--border-color, transparent);
	}

	.avatar-list img:hover {
		transform: scale(1.1);
		border: 3px solid #3ba776;
	}

	/* ============ KATEGORIE MODAL ============ */
	.category-grid {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin: 1.5rem 0;
	}

	.cat-btn {
		padding: 0.8rem;
		border: 2px solid var(--border-color, #e2e8f0);
		border-radius: 10px;
		background: var(--bg-card, white);
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary, #2d3748);
		cursor: pointer;
		transition: all 0.2s;
		min-height: 44px;
	}

	.cat-btn:hover {
		background: var(--bg-hover, #ebf8ff);
		border-color: #3ba776;
		color: #3ba776;
		transform: translateX(5px);
	}

	.cat-btn:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
	}

	.cat-btn.all {
		background: #3ba776;
		color: white;
		border: none;
	}

	.cat-btn.all:hover {
		background: #2f855e;
		color: white;
	}

	.close-btn {
		margin-top: 1rem;
		background: none;
		border: none;
		color: var(--text-secondary, #718096);
		cursor: pointer;
		text-decoration: underline;
		transition: color 0.3s ease;
		min-height: 44px;
		padding: 0.5rem 1rem;
	}

	.close-btn:hover {
		color: var(--text-primary, #2d3748);
	}

	.close-btn:focus-visible {
		outline: 2px solid var(--text-primary, #000);
		outline-offset: 2px;
	}

	/* ============ TOGGLE SWITCH ============ */
	.mode-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		margin: 1.5rem 0;
	}

	.mode-label {
		font-weight: 700;
		color: var(--text-primary, #2d3748);
		font-size: 1.1rem;
		transition: color 0.3s ease;
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 28px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-hover, #cbd5e1);
		transition: 0.4s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 20px;
		width: 20px;
		left: 4px;
		bottom: 4px;
		background-color: var(--bg-card, white);
		transition: 0.4s;
		border-radius: 50%;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	input:checked + .slider {
		background-color: #3ba776;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #3ba776;
	}

	input:checked + .slider:before {
		transform: translateX(22px);
	}

	.level-up-popup {
		position: fixed;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		background: #3ba776;
		color: white;
		padding: 1rem 2rem;
		border-radius: 14px;
		font-size: 1.4rem;
		font-weight: bold;
		z-index: 999;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>

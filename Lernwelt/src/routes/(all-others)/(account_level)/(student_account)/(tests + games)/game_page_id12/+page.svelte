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

	function startGameWithCategory(category: string | null) {
		let url = selectedTargetRoute;
		if (category) {
			url += `?category=${encodeURIComponent(category)}`;
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
			goto('/');
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
	<div class="avatar-wrapper">
		<button class="avatar-btn" on:click={() => (avatarModal = true)}>
			<img class="avatar-img" src={avatar} alt="avatar" />
		</button>
	</div>

	{#if avatarModal}
		<div
			class="modal-bg"
			on:click={() => (avatarModal = false)}
			role="button"
			tabindex="0"
			on:keydown={() => {}}
		></div>
		<div class="modal">
			<h2>{$_('student.avatar_choose')}</h2>
			<div class="avatar-list">
				{#each avatars as a}
					<button class="img-btn" on:click={() => selectAvatar(a)}>
						<img src={a} alt="avatar" />
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if categoryModal}
		<div
			class="modal-bg"
			on:click={() => (categoryModal = false)}
			role="button"
			tabindex="0"
			on:keydown={() => {}}
		></div>
		<div class="modal category-modal">
            <h2> {$_("student.choose_topic_for", { values: { subject: selectedSubjectName } })}</h2>

			{#if loadingCategories}
				<p>{$_('student.loading_topics')}</p>
			{:else}
                <div class="category-grid">
                    <button class="cat-btn all" on:click={() => startGameWithCategory(null)}>
                        {$_('student.shuffle_all')}
                    </button>

					{#each availableCategories as cat}
						<button class="cat-btn" on:click={() => startGameWithCategory(cat)}>
							{cat}
						</button>
					{/each}
				</div>
			{/if}

			<button class="close-btn" on:click={() => (categoryModal = false)}>{$_('student.cancel')}</button>
		</div>
	{/if}

	<h1>{$_('student.welcome_back', { values: { name: userName } })}</h1>
	<p>{$_('student.learning_journey')}</p>

	{#if levelUpVisible}
		<div class="level-up-popup">{$_('student.level_up', { values: {level} })}</div>
	{/if}

	<div class="xp-container">
		<div class="xp-fill" style="width: {xp}%"></div>
	</div>
	<p class="xp-label">{$_('student.level_xp', { values: { level, xp } })}</p>
</section>

<section class="subjects">
	<h2>{$_('student.choose_subject')}</h2>
	<div class="subject-grid">
		<button on:click={() => openSubject('Mathe', '/mathe_game')}>➕ {$_('subjects.math')}</button>
		<button on:click={() => openSubject('Physik', '/physik_game')}>⚛ {$_('subjects.physics')}</button>
		<button on:click={() => openSubject('Deutsch', '/deutsch_game')}>📘 {$_('subjects.german')}</button>
		<button on:click={() => openSubject('English', '/englisch_game')}>🌎 {$_('subjects.english')}</button>
	</div>
</section>

<style>
	:global(body) {
		background: #f4f7fb;
		font-family: system-ui, sans-serif;
		margin: 0;
	}

	.hero {
		text-align: center;
		margin-bottom: 2rem;
		padding-top: 1rem;
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

	.avatar-img {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		border: 5px solid white;
		object-fit: cover;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
		transition: transform 0.2s;
	}

	.avatar-img:hover {
		transform: scale(1.05);
	}

	.xp-container {
		width: 80%;
		height: 14px;
		background: #d9e5ef;
		border-radius: 20px;
		margin: 1rem auto 0;
		overflow: hidden;
	}

	.xp-fill {
		height: 100%;
		background: linear-gradient(90deg, #3ba776, #65d492);
		transition: width 0.3s;
	}

	.xp-label {
		color: #236c93;
		font-weight: bold;
		margin-top: 0.4rem;
	}

	.subjects {
		text-align: center;
		margin-top: 2rem;
		padding: 0 1rem;
	}

	/* --- HIER WURDE GEÄNDERT FÜR NEBENEINANDER --- */
	.subject-grid {
		display: flex;
		flex-wrap: wrap; /* Erlaubt Umbruch auf sehr kleinen Screens */
		justify-content: center; /* Zentriert die Buttons */
		gap: 1.5rem; /* Abstand zwischen den Buttons */
		margin-top: 1rem;
		width: 100%;
		max-width: 1000px; /* Viel Platz, damit 4 Stück nebeneinander passen */
		margin-left: auto;
		margin-right: auto;
	}

	.subject-grid button {
		padding: 1.5rem 1rem; /* Etwas größerer Klickbereich */
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

		/* Damit sie schön gleichmäßig wachsen, aber nicht riesig werden */
		flex: 1;
		min-width: 140px; /* Mindestbreite, damit sie nicht zu gequetscht werden */
		max-width: 220px; /* Maximalbreite */
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
	}

	.subject-grid button:hover {
		transform: translateY(-3px);
		background: #236c93;
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
	}
	/* --------------------------------------------- */

	/* MODAL STYLES */
	.modal-bg {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
		text-align: center;
		width: 90%;
		max-width: 400px;
		z-index: 101;
		max-height: 80vh;
		overflow-y: auto;
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

	.avatar-list img {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		transition: transform 0.2s;
	}

	.avatar-list img:hover {
		transform: scale(1.1);
		border: 3px solid #3ba776;
	}

	/* KATEGORIE MODAL STYLES */
	.category-grid {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin: 1.5rem 0;
	}

	.cat-btn {
		padding: 0.8rem;
		border: 2px solid #e2e8f0;
		border-radius: 10px;
		background: white;
		font-size: 1rem;
		font-weight: 600;
		color: #2d3748;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cat-btn:hover {
		background: #ebf8ff;
		border-color: #3ba776;
		color: #3ba776;
		transform: translateX(5px);
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
		color: #718096;
		cursor: pointer;
		text-decoration: underline;
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
	}
</style>

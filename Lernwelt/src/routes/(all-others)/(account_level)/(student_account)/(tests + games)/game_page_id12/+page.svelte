<script lang="ts">
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";
	import { goto } from "$app/navigation";

	/* ============================ TYPES ============================ */
	type UserProfile = {
		id: string;
		full_name?: string;
		xp: number;
		level: number;
		avatar_url: string | null;
	};

	/* ============================ STATE ============================ */
	let profile: UserProfile | null = null;
	let userName = "Schüler";
	let xp = $state(0);
	let level = $state(1);
	let avatar = $state("https://cdn-icons-png.flaticon.com/512/921/921071.png");


	let avatarModal = $state(false);
	let levelUpVisible = $state(false);


	const avatars: string[] = [
		"https://cdn-icons-png.flaticon.com/512/921/921071.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998671.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998749.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998728.png",
		"https://cdn-icons-png.flaticon.com/512/4331/4331403.png",  // neutral
		"https://cdn-icons-png.flaticon.com/512/4331/4331396.png",  // neutral
		"https://cdn-icons-png.flaticon.com/512/194/194938.png",   // junge männlich
		"https://cdn-icons-png.flaticon.com/512/194/194935.png",   // junges Mädchen
		"https://cdn-icons-png.flaticon.com/512/147/147144.png",   // Frau Cartoon
		"https://cdn-icons-png.flaticon.com/512/147/147131.png",   // Mann Cartoon
		"https://cdn-icons-png.flaticon.com/512/847/847969.png",   // Kind Cartoon
		"https://cdn-icons-png.flaticon.com/512/847/847970.png"    // Kind Cartoon
	];



	// FUNKTION – Avatar speichern
	async function selectAvatar(a: string) {
		if (!profile) return;
		avatar = a;
		avatarModal = false;

		await supabase
			.from("profiles")
			.update({ avatar_url: a })
			.eq("id", profile.id);

		console.log("✔ Avatar gespeichert:", a);
	}


	// ============================
	// PROFIL LADEN (MIT GASTMODUS)
	// ============================
	async function loadProfile() {
		console.log("🔵 loadProfile gestartet");

		const { data: auth } = await supabase.auth.getUser();

		if (!auth?.user) {
			console.warn("⚠ Kein Login → Gastmodus aktiviert!");
			profile = null;
			return; // Nur Gast → keine DB-Abfrage
		}

		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", auth.user.id)
			.single();

		if (error) {
			console.error("Fehler beim Laden von Profil", error);
			return;
		}

		profile = data as UserProfile;
		userName = profile.full_name || "Schüler";
		xp = profile.xp;
		level = profile.level;
		avatar = profile.avatar_url ?? avatar;

		console.log("🟢 Profil gefunden:", profile);
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

		await supabase
			.from("profiles")
			.update({ xp: newXP, level: newLevel })
			.eq("id", profile.id);
	}



	// MOUNT
	onMount(async () => {
		console.log("🟢 onMount gestartet");
		await loadProfile();
	});
</script>


<!-- ================= UI ================= -->
<section class="hero">

	<!-- Avatar ANZEIGEN (fehlt bei dir!) -->
	<div class="avatar-wrapper">
		<img
			class="avatar-img"
			src={avatar}
			alt="avatar"
			on:click={() => (avatarModal = true)}
		/>

	</div>


	{#if avatarModal}
		<div class="modal-bg" on:click={() => (avatarModal = false)}></div>
		<div class="modal">
			<h2>Wähle deinen Avatar</h2>
			<div class="avatar-list">
				{#each avatars as a}
					<img src={a} alt="avatar" on:click={() => selectAvatar(a)} />
				{/each}
			</div>
		</div>
	{/if}

	<h1>Willkommen zurück, {userName} 👋</h1>
	<p>Deine Lernreise geht weiter.</p>

	{#if levelUpVisible}
		<div class="level-up-popup">🎉 Level Up! Level {level}!</div>
	{/if}

	<div class="xp-container">
		<div class="xp-fill" style="width: {xp}%"></div>
	</div>
	<p class="xp-label">Level {level} · {xp}% XP</p>
</section>

<section class="subjects">
	<h2>Wähle ein Fach</h2>
	<div class="subject-grid">
		<button on:click={() => goto('/mathe_game')}>➕ Mathe</button>
		<button on:click={() => goto('/physik_game')}>⚛ Physik</button>
		<button on:click={() => goto('/deutsch_game')}>📘 Deutsch</button>
		<button on:click={() => goto('/englisch_game')}>🌎 Englisch</button>
	</div>
</section>


<style>
    :global(body) {
        background: #f4f7fb;
        font-family: system-ui;
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
        cursor: pointer;
    }

    .ring-container {
        width: 150px;
        height: 150px;
        position: relative;
    }

    .ring {
        position: absolute;
        top: 0;
        left: 0;
    }

    .ring-bg {
        fill: none;
        stroke: #dce7f2;
        stroke-width: 12;
    }

    .ring-progress {
        fill: none;
        stroke: #3ba776;
        stroke-width: 12;
        stroke-linecap: round;
        transform: rotate(-90deg);
        transform-origin: center;
        transition: stroke-dashoffset 0.35s;
    }

    .avatar-img {
        width: 110px;
        height: 110px;
        border-radius: 50%;
        border: 5px solid white;
        object-fit: cover;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .avatar-img:hover {
        transform: translate(-50%, -50%) scale(1.08);
    }

    .title {
        font-size: 2rem;
        color: #1d5e84;
    }

    .subtitle {
        color: #6e8191;
        margin-bottom: 0.5rem;
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
    }

    .subjects h2 {
        color: #1d5e84;
    }

    .subject-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .subject-grid button {
        padding: 1rem;
        border: none;
        border-radius: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: 0.2s;
        background: #3ba776;
        color: white;
    }

    .subject-grid button:hover {
        transform: scale(1.05);
        background: #236c93;
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

    .modal-bg {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.3);
    }

    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        text-align: center;
    }

    .avatar-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .avatar-list img {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .avatar-list img:hover {
        transform: scale(1.1);
        border: 3px solid #3ba776;
    }



</style>

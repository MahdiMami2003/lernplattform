

<script lang="ts">
	import { onMount } from "svelte";
	import { supabase } from "$lib/supabaseClient";

	/* ============================
					TYPES
	============================ */
	type UserProfile = {
		id: string;
		full_name?: string;
		xp: number;
		level: number;
		avatar_url: string | null;
	};

	/* ============================
					STATE
	============================ */
	let profile: UserProfile | null = null;
	let userName = "Schüler";
	let xp = 0;
	let level = 1;
	let targetXP = 0;

	let avatar = "https://cdn-icons-png.flaticon.com/512/921/921071.png";
	let avatarModal = false;

	const avatars = [
		"https://cdn-icons-png.flaticon.com/512/921/921071.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998671.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998749.png",
		"https://cdn-icons-png.flaticon.com/512/1998/1998728.png"
	];

	let levelUpVisible = false;

	/* ============================
					HELPERS
	============================ */
	function triggerLevelUp() {
		levelUpVisible = true;
		setTimeout(() => (levelUpVisible = false), 2000);
	}

	function fireConfetti() {
		if (typeof document === "undefined") return;
		const c = document.createElement("div");
		c.className = "confetti";
		c.style.left = Math.random() * 100 + "%";
		c.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
		document.body.appendChild(c);
		setTimeout(() => c.remove(), 1500);
	}

	async function saveProfile(update: Partial<UserProfile>) {
		if (!profile) return;
		await supabase.from("profiles").update(update).eq("id", profile.id);
	}

	/* ============================
					LOAD PROFILE
	============================ */
	async function loadProfile() {
		const { data: auth } = await supabase.auth.getUser();
		const user = auth?.user;
		if (!user) return;

		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (!error && data) {
			profile = {
				id: data.id,
				full_name: data.full_name,
				xp: data.xp ?? 0,
				level: data.level ?? 1,
				avatar_url: data.avatar_url ?? null
			};

			userName = profile.full_name || "Schüler";
			xp = profile.xp;
			level = profile.level;
			avatar = profile.avatar_url || avatar;
			targetXP = xp;
		}
	}

	/* ============================
					XP SYSTEM
	============================ */
	async function rewardXP(amount = 5) {
		let newXP = xp + amount;
		let newLevel = level;

		if (newXP >= 100) {
			newXP -= 100;
			newLevel++;
			triggerLevelUp();
		}

		xp = newXP;
		level = newLevel;

		await saveProfile({ xp: newXP, level: newLevel });
		fireConfetti();
	}

	/* ============================
					AVATAR
	============================ */
	async function selectAvatar(a: string) {
		avatar = a;
		avatarModal = false;
		await saveProfile({ avatar_url: a });
		fireConfetti();
	}

	async function uploadAvatar(event: Event) {
		if (!profile) return;

		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const path = `${profile.id}/${crypto.randomUUID()}.png`;

		const { error } = await supabase.storage.from("avatars").upload(path, file);
		if (error) return;

		const { data: url } = supabase.storage.from("avatars").getPublicUrl(path);

		avatar = url.publicUrl;
		avatarModal = false;

		await saveProfile({ avatar_url: avatar });
		fireConfetti();
	}

	/* ============================
					LIFECYCLE
	============================ */
	let cleanup: (() => void) | undefined;

	onMount(() => {
		initialize();
		return () => cleanup?.();
	});

	async function initialize() {
		await loadProfile();

		let anim = setInterval(() => {
			if (xp < targetXP) xp++;
			else clearInterval(anim);
		}, 15);

		if (profile) {
			const channel = supabase
				.channel("profile-" + profile.id)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "profiles",
						filter: `id=eq.${profile.id}`
					},
					(payload) => {
						xp = payload.new.xp ?? xp;
						level = payload.new.level ?? level;
						avatar = payload.new.avatar_url ?? avatar;
					}
				)
				.subscribe();

			cleanup = () => supabase.removeChannel(channel);
		}
	}
</script>

<!-- REST DEINES HTML UND CSS GANZ NORMAL -->

<!-- ============================
     UI MARKUP
============================ -->
<section class="hero">
	<div class="avatar-wrapper" on:click={() => (avatarModal = true)}>
		<input type="file" accept="image/*" on:change={uploadAvatar} />

		<div class="ring-container">
			<svg width="150" height="150" class="ring">
				<circle cx="75" cy="75" r="65" class="ring-bg" />
				<circle
					cx="75"
					cy="75"
					r="65"
					class="ring-progress"
					stroke-dasharray="408"
					stroke-dashoffset={408 - (408 * xp) / 100}
				/>
			</svg>

			<img class="avatar-img" src={avatar} alt="avatar" />
		</div>
	</div>

	<h1 class="title">Willkommen zurück, {userName}! 👋</h1>
	<p class="subtitle">Deine Lernreise geht weiter.</p>

	{#if levelUpVisible}
		<div class="level-up-popup">
			🎉 Level Up! Jetzt bist du Level {level}!
		</div>
	{/if}

	<div class="xp-container">
		<div class="xp-fill" style="width: {xp}%"></div>
	</div>
	<p class="xp-label">Level {level} · {xp}% XP</p>
</section>

<section class="grid">
	<div class="card big">
		<h2>🎮 Dein nächstes Spiel</h2>
		<p>Perfekt zum Üben!</p>
		<button on:click={() => (window.location.href = "/example_page_1")}>
			▶ Spiel starten
		</button>
	</div>

	<div class="card">
		<h2>✨ Bonus XP</h2>
		<button class="reward-btn" on:click={() => rewardXP(5)}>
			+5 XP
		</button>
	</div>
</section>

{#if avatarModal}
	<div class="modal">
		<div class="modal-box">
			<h2>Avatar wählen 🎨</h2>

			<div class="avatar-grid">
				{#each avatars as a}
					<img class="choice" src={a} alt="avatar choice" on:click={() => selectAvatar(a)} />
				{/each}
			</div>

			<button class="close" on:click={() => (avatarModal = false)}>
				Schließen
			</button>
		</div>
	</div>
{/if}
=======
<div id="placeholder">
    Game Page
</div>

>>>>>>> ee5cfcaeff57eef5e353918f1a16c2d1fa12bc07

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

    .avatar-wrapper input[type="file"] {
        position: absolute;
        inset: 0;
        opacity: 0;
        z-index: 3;
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

    .grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        padding: 1rem;
    }

    .card {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
    }

    .card.big {
        text-align: center;
    }

    .card.big button {
        background: linear-gradient(90deg, #236c93, #3ba776);
        color: white;
        border: none;
        padding: 0.9rem 1.6rem;
        border-radius: 14px;
        cursor: pointer;
        font-weight: bold;
    }

    .reward-btn {
        background: #3ba776;
        color: white;
        border: none;
        padding: 0.8rem 1.4rem;
        border-radius: 12px;
        cursor: pointer;
        font-weight: bold;
    }

    .modal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal-box {
        background: white;
        padding: 2rem;
        border-radius: 18px;
        width: 360px;
        text-align: center;
    }

    .avatar-grid {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 1rem 0;
    }

    .choice {
        width: 75px;
        height: 75px;
        border: 3px solid #236c93;
        border-radius: 50%;
        cursor: pointer;
    }

    .close {
        background: #236c93;
        color: white;
        border: none;
        padding: 0.7rem 1.3rem;
        border-radius: 10px;
        cursor: pointer;
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

    .confetti {
        position: fixed;
        top: -20px;
        width: 12px;
        height: 20px;
        animation: fall 1.5s linear forwards;
    }

    @keyframes fall {
        to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
        }
    }
</style>

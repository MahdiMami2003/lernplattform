<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

    let { data } = $props();

    let { supabase, session } = data;

	/* ========== TYPES ========== */
	type Question = {
		id?: number;
		question: string;
		answers: (string | null)[];
		correctIndex: number;
		xpReward: number;
	};

	type Profile = {
		id: string;
		xp: number;
		level: number;
		streak: number;
		hearts: number;
		last_boss?: string;
		last_grade?: number;
	};

	type ConfettiPiece = {
		id: number;
		left: number;
		duration: number;
		delay: number;
		color: string;
	};

	/* ========== STATE (MUSS MIT $state()!!!) ========== */
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let profile = $state<Profile | null>(null);

	let xp = $state(0);
	let level = $state(1);
	let streak = $state(0);
	const MAX_HEARTS = 3;
	let hearts = $state(MAX_HEARTS);

	let questions = $state<Question[]>([]);
	let currentIndex = $state(0);
	let selectedIndex = $state<number | null>(null);
	let locked = $state(false);
	let correctCount = $state(0);

	let showSummary = $state(false);
	let outOfHearts = $state(false);
	let levelUpVisible = $state(false);

	let sessionXp = $state(0);
	let confettiPieces = $state<ConfettiPiece[]>([]);

	// Fortschritt & XP als derived
	const progress = $derived(() =>
		questions.length > 0 ? (currentIndex / questions.length) * 100 : 0
	);
	const xpProgress = $derived(() => (xp / 100) * 100);

	/* ========= HELPER ========= */
	function shuffle<T>(array: T[]): T[] {
		return [...array].sort(() => Math.random() - 0.5);
	}

	async function updateProfile(update: Partial<Profile>) {
		if (!profile) return;
		await supabase.from('profiles').update(update).eq('id', profile.id);
	}

	/* ========= LOAD DATA ========= */
	/* ========= LOAD DATA ========= */
	/* ========= LOAD DATA ========= */
	async function loadProfileAndQuestions() {
		try {
			loading = true;
			loadError = null;

			/* 1️⃣ USER OPTIONAL LADEN */
			const { data: authData } = await supabase.auth.getUser();
			const user = authData?.user ?? null;

			if (user) {
				const { data: profileData } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', user.id)
					.single();

				if (profileData) {
					profile = profileData;
					xp = profileData.xp ?? 0;
					level = profileData.level ?? 1;
					streak = profileData.streak ?? 0;
					hearts = profileData.hearts ?? MAX_HEARTS;

					// ⭐ NEU HINZUFÜGEN:
					if (profile.hearts < MAX_HEARTS) {
						hearts = MAX_HEARTS;
						await updateProfile({ hearts: MAX_HEARTS });
						console.log("❤️ Herzen automatisch zurückgesetzt (neues Spiel)");
					}
				}
			} else {
				console.warn("⚠ Kein Login – Gastmodus");
				profile = null;
			}

			/* 2️⃣ DEUTSCH-FRAGEN LADEN – 5 ZUFÄLLIG */
			const { data, error } = await supabase
				.from('questions')
				.select('*')
				.like('subject', 'Deutsch_%') // DEUTSCH EASY / MEDIUM / HARD / BOSS
				.then(res => {
					if (res.error) throw res.error;
					return { data: shuffle(res.data).slice(0, 5) }; // 5 zufälligen auswählen
				});

			if (error) {
				console.error(error);
				loadError = 'Fehler beim Laden der Deutsch-Fragen.';
			} else if (!data || data.length === 0) {
				console.warn('⚠ KEINE DEUTSCH-FRAGEN gefunden – Dummy!');
				questions = [
					{
						question: 'Was ist ein Pronomen?',
						answers: ['Ein Begleiter', 'Ein Fürwort', 'Ein Tunwort', 'Ein Nomen'],
						correctIndex: 1,
						xpReward: 10
					}
				];
			} else {
				questions = data.map(q => ({
					id: q.id,
					question: q.question,
					answers: [q.a1, q.a2, q.a3, q.a4],
					correctIndex: q.correct_index,
					xpReward: q.xp_reward ?? 10
				}));
			}
		} catch (err) {
			console.error(err);
			loadError = 'Unerwarteter Fehler beim Laden.';
		} finally {
			loading = false;
			currentIndex = 0;
			selectedIndex = null;
			locked = false;
			correctCount = 0;
			showSummary = false;
			outOfHearts = false;
		}
	}





	function goNextOrFinish() {
		if (currentIndex < questions.length - 1) {
			currentIndex++;
			selectedIndex = null;
			locked = false;  // 🔓 WICHTIG – wieder freigeben!!!
		} else {
			showSummary = true;
			saveBossResult();
		}
	}
	/* ========= ANSWER CLICK ========== */
	function handleAnswerClick(index: number) {
		if (locked || showSummary || outOfHearts) return;

		selectedIndex = index;
		locked = true;  // ← MUSS sein!

		const current = questions[currentIndex];
		const isCorrect = index === current.correctIndex;

		if (isCorrect) {
			correctCount++;
			rewardXP(current.xpReward);
		} else {
			loseHeart();
		}

		setTimeout(() => {
			if (!outOfHearts) goNextOrFinish();
		}, 1200); // 1,2 Sekunden warten → Animation sichtbar!
	}




	async function rewardXP(amount: number) {
		xp += amount;
		sessionXp += amount;

		// Level Up hier prüfen
		if (xp >= 100) {
			xp -= 100;
			level++;
			levelUpVisible = true;
			setTimeout(() => (levelUpVisible = false), 2000);
		}

		if (profile) {
			await updateProfile({ xp, level }); // ← beide speichern
		}
	}


	async function loseHeart() {
		hearts = Math.max(0, hearts - 1);
		if (hearts === 0) outOfHearts = true;
		await updateProfile({ hearts });
	}

	async function saveBossResult() {
		const grade = Math.ceil(6 - (correctCount / questions.length) * 5);
		await updateProfile({ last_boss: 'Classe10Physik', last_grade: grade });

		if (correctCount > 0) {
			streak++;
			await updateProfile({ streak });
		}
	}

	async function restartLesson() {
		currentIndex = 0;
		selectedIndex = null;
		outOfHearts = false;
		showSummary = false;
		hearts = MAX_HEARTS;
		correctCount = 0;

		// ️ WICHTIG: Datenbank aktualisieren!
		if (profile) {
			await updateProfile({ hearts: MAX_HEARTS });
		}




	onMount(loadProfileAndQuestions);

</script>


{#if loading}
	<div class="loading"><p>Spiel wird geladen…</p></div>

{:else if loadError}
	<div class="error">
		<p>{loadError}</p>
		<button on:click={loadProfileAndQuestions}>Neu laden</button>
	</div>

{:else if questions.length === 0}
	<div class="error">
		<p>Für Mathe sind aktuell keine Fragen vorhanden.</p>
		<button on:click={() => goto('/student_landing_page_id5', { reload: true })}>
			Dashboard
		</button>
	</div>

{:else}
	<!-- GAME UI -->
	<div class="game-root">
		{#if levelUpVisible}
			<div class="levelup-popup">
				🎉 Level {level} erreicht!
			</div>
		{/if}

		{#each confettiPieces as piece (piece.id)}
			<div
				class="confetti"
				style={`left:${piece.left}%;animation-duration:${piece.duration}ms;animation-delay:${piece.delay}ms;background:${piece.color};`}
			></div>
		{/each}

		<header class="hud">
			<button class="back-btn" on:click={() => goto('/student_landing_page_id5')}>←</button>

			<div class="hud-center">
				<div class="progress-top">
					<div class="progress-inner" style={`width: ${progress}%`}></div>
				</div>
				<p class="question-count">Frage {currentIndex + 1} / {questions.length}</p>
			</div>

			<div class="hud-right">
				<div class="hearts">
					{#each Array(MAX_HEARTS) as _, i}
						<span class:lost={i >= hearts}>❤️</span>
					{/each}
				</div>

				<div class="xp-display">
					<span>Lvl {level}</span>
					<div class="xp-bar">
						<div class="xp-inner" style={`width: ${xpProgress}%`}></div>
					</div>
				</div>

				<div class="streak">
					<span>🔥</span>{streak}
				</div>
			</div>
		</header>

		{#if !showSummary && !outOfHearts}
			<main class="card">
				<h2 class="question">{questions[currentIndex].question}</h2>
				<div class="answers">
					{#each questions[currentIndex].answers as ans, i}
						{#if ans}
							<button
								class="answer-btn {selectedIndex === i
		? i === questions[currentIndex].correctIndex
			? 'correct'
			: 'wrong'
		: ''}"
								on:click={() => handleAnswerClick(i)}
								disabled={locked}
							>
								{ans}
							</button>

						{/if}
					{/each}
				</div>
			</main>
		{:else}
			<section class="summary">
				<h1>{outOfHearts ? '😥 Keine Herzen mehr' : '🎉 Super gemacht!'}</h1>

				<div class="xp-chest">
					<div class="chest-glow"></div>
					<div class="chest-lid"></div>
					<div class="chest-box"></div>
				</div>

				<div class="summary-stats">
					<div>
						<span>Richtige Antworten</span>
						<strong>{correctCount} / {questions.length}</strong>
					</div>
					<div>
						<span>Level</span>
						<strong>{level}</strong>
					</div>
				</div>

				{#if sessionXp > 0}
					<p class="xp-earned">+{sessionXp} XP</p>
				{/if}

				<div class="achievements">
					<p>Freigeschaltete Badges:</p>
					<div class="badge-row">
						{#if correctCount === questions.length}
							<span class="badge">Perfekte Runde 🏅</span>
						{/if}
						{#if streak >= 3}
							<span class="badge">Streak-Meister 🔥</span>
						{/if}

					</div>
				</div>

				<div class="summary-actions">
					<button on:click={restartLesson}>Nochmal spielen</button>
					<button on:click={() => goto('/student_landing_page_id5')}>Dashboard</button>
				</div>
			</section>
		{/if}
	</div>
{/if}

<style>
    :global(body) {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #e7f4fa;
    }

    .game-root {
        max-width: 800px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
        position: relative;
    }

    .loading,
    .error {
        text-align: center;
        padding: 4rem 1rem;
    }

    .error button {
        margin-top: 1rem;
        padding: 0.6rem 1.4rem;
        border-radius: 12px;
        border: none;
        background: #236c93;
        color: white;
        cursor: pointer;
    }

    /* HUD */
    .hud {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.2rem;
        gap: 0.6rem;
    }

    .back-btn {
        border: none;
        background: white;
        border-radius: 999px;
        width: 40px;
        height: 40px;
        font-size: 1.4rem;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        color: #236c93;
    }

    .hud-center {
        flex: 1;
        text-align: center;
    }

    .progress-top {
        height: 10px;
        background: #d9e5f0;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 0.2rem;
    }

    .progress-inner {
        height: 100%;
        background: linear-gradient(90deg, #3ba776, #65d492);
        transition: width 0.2s;
    }

    .question-count {
        font-size: 0.85rem;
        color: #4a6175;
        margin: 0;
    }

    .hud-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.3rem;
        font-size: 0.9rem;
    }

    .hearts span {
        font-size: 1.2rem;
        margin-left: 0.1rem;
    }

    .hearts span.lost {
        opacity: 0.25;
    }

    .xp-display {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.15rem;
    }

    .xp-display span {
        font-size: 0.8rem;
        color: #1d5e84;
        font-weight: 600;
    }

    .xp-bar {
        width: 110px;
        height: 6px;
        border-radius: 999px;
        background: #d9e5f0;
        overflow: hidden;
    }

    .xp-inner {
        height: 100%;
        background: linear-gradient(90deg, #f6ad55, #f56565);
        transition: width 0.2s;
    }

    .streak {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        background: white;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .streak span:first-child {
        font-size: 1.1rem;
    }

    /* LEVEL UP POPUP */
    .levelup-popup {
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translateX(-50%);
        background: #3ba776;
        color: white;
        padding: 0.8rem 1.6rem;
        border-radius: 14px;
        font-weight: bold;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
        animation: popup 0.6s ease-out forwards, fadeOut 2s ease forwards;
        z-index: 50;
    }

    @keyframes popup {
        0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        0%,
        60% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }

    /* CARD */
    .card {
        background: white;
        padding: 2rem 1.5rem;
        border-radius: 18px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        animation: slideUp 0.25s ease-out;
    }

    .question {
        font-size: 1.5rem;
        color: #1d5e84;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .answers {
        display: grid;
        gap: 0.9rem;
    }

    .answer-btn {
        width: 100%;
        text-align: left;
        padding: 0.9rem 1rem;
        border-radius: 14px;
        border: 2px solid #d7e4ef;
        background: #f8fbff;
        font-size: 1rem;
        cursor: pointer;
        transition:
                transform 0.12s,
                box-shadow 0.12s,
                border-color 0.12s,
                background 0.12s;
    }

    .answer-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }

    .answer-btn.correct {
        background: #c6f6d5;
        border-color: #3ba776;
    }

    .answer-btn.wrong {
        background: #ffd1d1;
        border-color: #ff6b6b;
    }

    /* SUMMARY */
    .summary {
        background: white;
        padding: 2rem 1.5rem;
        border-radius: 18px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        text-align: center;
        animation: slideUp 0.25s ease-out;
    }

    .summary h1 {
        margin-bottom: 0.5rem;
        color: #1d5e84;
    }

    .summary p {
        margin: 0.2rem 0;
        color: #4a6175;
    }

    .xp-earned {
        font-size: 1.3rem;
        font-weight: bold;
        color: #3ba776;
        margin-top: 0.6rem;
    }

    /* XP Chest */
    .xp-chest {
        position: relative;
        width: 130px;
        height: 100px;
        margin: 1.3rem auto 1rem;
    }

    .chest-box {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        width: 130px;
        height: 70px;
        background: linear-gradient(180deg, #d69e2e, #b7791f);
        border-radius: 10px;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
    }

    .chest-lid {
        position: absolute;
        bottom: 55px;
        left: 10px;
        right: 10px;
        height: 30px;
        background: linear-gradient(180deg, #faf089, #ecc94b);
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .chest-glow {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 90px;
        height: 40px;
        background: radial-gradient(circle, rgba(250, 240, 137, 0.9), transparent);
        opacity: 0.8;
        animation: glow 1.4s ease-in-out infinite;
    }

    @keyframes glow {
        0% {
            transform: translateX(-50%) scale(0.9);
            opacity: 0.7;
        }
        50% {
            transform: translateX(-50%) scale(1.05);
            opacity: 1;
        }
        100% {
            transform: translateX(-50%) scale(0.9);
            opacity: 0.7;
        }
    }

    .summary-stats {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin: 1rem 0;
    }

    .summary-stats span {
        display: block;
        font-size: 0.85rem;
        color: #6e8191;
    }

    .summary-stats strong {
        font-size: 1.2rem;
        color: #1d5e84;
    }

    .achievements {
        margin: 0.8rem 0;
    }

    .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        justify-content: center;
        margin-top: 0.3rem;
    }

    .badge {
        background: #e7f4fa;
        border-radius: 999px;
        padding: 0.3rem 0.8rem;
        border: 1px solid #236c93;
        font-size: 0.85rem;
        color: #236c93;
    }

    .summary-actions {
        margin-top: 1.2rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        justify-content: center;
    }

    .summary-actions button {
        padding: 0.7rem 1.5rem;
        border-radius: 14px;
        border: none;
        background: linear-gradient(90deg, #236c93, #3ba776);
        color: white;
        font-weight: 600;
        cursor: pointer;
    }

    .summary-actions button:nth-child(2) {
        background: #e2e8f0;
        color: #1d5e84;
    }

    /* CONFETTI */
    .confetti {
        position: fixed;
        top: -20px;
        width: 10px;
        height: 16px;
        border-radius: 2px;
        animation-name: confetti-fall;
        animation-timing-function: linear;
        animation-iteration-count: 1;
        z-index: 100;
    }

    @keyframes confetti-fall {
        from {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
        }
        to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(16px);
        }
    }
    .answer-btn.correct {
        background: #c6f6d5;       /* Hellgrün */
        border-color: #3ba776;
    }

    .answer-btn.wrong {
        background: #ffd1d1;       /* Hellrot */
        border-color: #ff6b6b;
    }

</style>

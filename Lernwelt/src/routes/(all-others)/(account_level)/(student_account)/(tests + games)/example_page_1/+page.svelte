<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { supabase } from "$lib/supabaseClient";

	/* ========= TYPES ========= */

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
	};

	/* ========= STATE ========= */

	let loading = true;
	let loadError: string | null = null;

	let profile: Profile | null = null;

	let xp = 0;
	let level = 1;
	let streak = 0;
	const MAX_HEARTS = 3;
	let hearts = MAX_HEARTS;

	let questions: Question[] = [];
	let currentIndex = 0;
	let selectedIndex: number | null = null;
	let locked = false;
	let correctCount = 0;

	let showSummary = false;
	let outOfHearts = false;
	let levelUpVisible = false;

	// Fortschritt in %
	$: progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

	// Clientseitige Abzeichen
	$: achievements = [
		xp >= 50 ? "Bronze-Schüler" : null,
		xp >= 150 ? "Silber-Held" : null,
		xp >= 300 ? "Gold-Champion" : null,
		streak >= 3 ? "🔥 Lern-Streak 3+" : null,
		level >= 5 ? "Level-Profi" : null
	].filter((x): x is string => x !== null);

	/* ========= HELPERS ========= */

	function shuffle<T>(array: T[]): T[] {
		const copy = [...array];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	function triggerLevelUp() {
		levelUpVisible = true;
		setTimeout(() => {
			levelUpVisible = false;
		}, 2000);
	}

	function spawnConfetti() {
		if (typeof document === "undefined") return;

		for (let i = 0; i < 20; i++) {
			const el = document.createElement("div");
			el.className = "confetti";
			el.style.left = Math.random() * 100 + "vw";
			el.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
			el.style.animationDuration = 0.8 + Math.random() * 0.7 + "s";
			document.body.appendChild(el);
			setTimeout(() => el.remove(), 2000);
		}
	}

	async function updateProfile(update: Partial<Profile>) {
		if (!profile) return; // Demo-Modus -> nichts speichern

		const { error } = await supabase
			.from("profiles")
			.update(update)
			.eq("id", profile.id);

		if (error) {
			console.error("Profil-Update fehlgeschlagen:", error);
		}
	}

	async function rewardXP(amount: number) {
		let newXP = xp + amount;
		let newLevel = level;

		if (newXP >= 100) {
			newXP -= 100;
			newLevel += 1;
			triggerLevelUp();
		}

		xp = newXP;
		level = newLevel;

		await updateProfile({ xp: newXP, level: newLevel });
		spawnConfetti();
	}

	async function loseHeart() {
		hearts = Math.max(0, hearts - 1);
		await updateProfile({ hearts });

		if (hearts === 0) {
			outOfHearts = true;
			showSummary = true;
		}
	}

	/* ========= LOAD DATA ========= */

	async function loadProfileAndQuestions() {
		try {
			// --- User & Profil laden ---
			const { data: authData, error: authError } = await supabase.auth.getUser();
			const user = authData?.user ?? null;

			if (authError) {
				console.error("auth error:", authError);
			}

			if (user) {
				const { data: profileData, error: profileError } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", user.id)
					.single();

				if (!profileError && profileData) {
					profile = {
						id: profileData.id,
						xp: profileData.xp ?? 0,
						level: profileData.level ?? 1,
						streak: profileData.streak ?? 0,
						hearts: profileData.hearts ?? MAX_HEARTS
					};

					xp = profile.xp;
					level = profile.level;
					streak = profile.streak;
					hearts = profile.hearts;
				} else {
					console.warn("Profil nicht gefunden – Demo-Profil wird genutzt.");
				}
			} else {
				console.warn("Kein User eingeloggt – Demo-Modus.");
			}

			// --- Fragen laden ---
			const { data: questionRows, error: qError } = await supabase
				.from("questions")
				.select("*")
				.limit(10);

			if (!qError && questionRows && questionRows.length > 0) {
				questions = questionRows.map((q: any) => ({
					id: q.id,
					question: q.question,
					answers: [q.a1, q.a2, q.a3, q.a4],
					correctIndex: q.correct_index,
					xpReward: q.xp_reward ?? 10
				}));
			} else {
				// Fallback-Demo-Fragen
				questions = [
					{
						question: "Was ist 7 × 8?",
						answers: ["48", "54", "56", "64"],
						correctIndex: 2,
						xpReward: 10
					},
					{
						question: "Welche Zahl ist größer?",
						answers: ["19", "21", "18", "20"],
						correctIndex: 1,
						xpReward: 10
					},
					{
						question: "Welche Form ist ein Dreieck?",
						answers: ["◼️", "🔺", "⚫️", "⬛️"],
						correctIndex: 1,
						xpReward: 10
					},
					{
						question: "Was ist 3 + 9?",
						answers: ["10", "11", "12", "13"],
						correctIndex: 2,
						xpReward: 10
					}
				];
			}

			questions = shuffle(questions);

			if (questions.length === 0) {
				loadError = "Es wurden keine Fragen gefunden.";
			}
		} catch (e) {
			console.error(e);
			loadError = "Etwas ist schiefgelaufen beim Laden der Daten.";
		} finally {
			loading = false;
		}
	}

	/* ========= GAME LOGIC ========= */

	function handleAnswerClick(index: number) {
		if (locked || showSummary || outOfHearts) return;

		selectedIndex = index;
		locked = true;

		const current = questions[currentIndex];
		const isCorrect = index === current.correctIndex;

		if (isCorrect) {
			correctCount++;
			rewardXP(current.xpReward);
		} else {
			loseHeart();
		}

		setTimeout(() => {
			if (!outOfHearts) {
				goNextOrFinish();
			}
		}, 800);
	}

	async function goNextOrFinish() {
		if (currentIndex < questions.length - 1 && !outOfHearts) {
			currentIndex++;
			selectedIndex = null;
			locked = false;
		} else {
			showSummary = true;

			// Streak nur erhöhen, wenn nicht outOfHearts und mind. 1 Frage richtig
			if (!outOfHearts && correctCount > 0) {
				streak += 1;
				await updateProfile({ streak });
			}
		}
	}

	function restartLesson() {
		currentIndex = 0;
		selectedIndex = null;
		locked = false;
		correctCount = 0;
		showSummary = false;
		outOfHearts = false;
		hearts = MAX_HEARTS;
		questions = shuffle(questions);
	}

	onMount(() => {
		loadProfileAndQuestions();
	});
</script>

<!-- Dummy-Element, damit .confetti-CSS nicht als unbenutzt markiert wird -->
<div class="confetti" aria-hidden="true" style="display:none"></div>

{#if loading}
	<div class="loading">
		<p>Spiel wird geladen…</p>
	</div>
{:else if loadError}
	<div class="error">
		<p>{loadError}</p>
		<button type="button" on:click={loadProfileAndQuestions}>Nochmal versuchen</button>
	</div>
{:else if questions.length === 0}
	<div class="loading">
		<p>Es sind derzeit keine Fragen vorhanden.</p>
	</div>
{:else}
	<div class="game-root">
		<!-- ===== HUD ===== -->
		<header class="hud">
			<button
				class="back-btn"
				type="button"
				on:click={() => goto("/student_landing_page_id5")}
			>
				←
			</button>

			<div class="hud-center">
				<div class="progress-top">
					<div class="progress-inner" style={`width: ${progress}%`}></div>
				</div>
				<p class="question-count">
					Frage {Math.min(currentIndex + 1, questions.length)} / {questions.length}
				</p>
			</div>

			<div class="hud-right">
				<div class="hearts">
					{#each Array(MAX_HEARTS) as _, i}
						<span class:lost={i >= hearts}>❤️</span>
					{/each}
				</div>
				<div class="streak">
					<span>🔥</span>
					<span>{streak}</span>
				</div>
			</div>
		</header>

		{#if levelUpVisible}
			<div class="levelup-popup">
				🎉 Level Up! Du bist jetzt Level {level}!
			</div>
		{/if}

		<!-- ===== MAIN CONTENT ===== -->
		{#if !showSummary && !outOfHearts}
			<main class="card">
				<h2 class="question">
					{questions[currentIndex].question}
				</h2>

				<div class="answers">
					{#each questions[currentIndex].answers as ans, i}
						{#if ans}
							<button
								type="button"
								class="answer-btn
                  {selectedIndex === i
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
			<!-- ===== SUMMARY ===== -->
			<section class="summary">
				{#if outOfHearts}
					<h1>😥 Keine Herzen mehr</h1>
					<p>Du hast alle Leben verloren. Versuch es später noch einmal!</p>
				{:else}
					<h1>🎉 Super gemacht!</h1>
					<p>Du hast {correctCount} von {questions.length} Fragen richtig beantwortet.</p>
					<p class="xp-earned">+{correctCount * 10} XP (mindestens)</p>
				{/if}

				<div class="xp-chest">
					<div class="chest-lid"></div>
					<div class="chest-box"></div>
					<div class="chest-glow"></div>
				</div>

				<div class="summary-stats">
					<div>
						<span>⭐ XP</span>
						<strong>{xp}</strong>
					</div>
					<div>
						<span>🏆 Level</span>
						<strong>{level}</strong>
					</div>
					<div>
						<span>🔥 Streak</span>
						<strong>{streak}</strong>
					</div>
				</div>

				{#if achievements.length > 0}
					<div class="achievements">
						<h3>Abzeichen</h3>
						<div class="badge-row">
							{#each achievements as a}
								<span class="badge">{a}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="summary-actions">
					<button type="button" on:click={restartLesson}>
						Nochmal spielen
					</button>
					<button type="button" on:click={() => goto("/student_landing_page_id5")}>
						Zurück zum Dashboard
					</button>
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
        gap: 0.2rem;
        font-size: 0.9rem;
    }

    .hearts span {
        font-size: 1.2rem;
        margin-left: 0.1rem;
    }

    .hearts span.lost {
        opacity: 0.25;
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
</style>

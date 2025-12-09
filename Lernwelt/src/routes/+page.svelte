<script lang="ts">
	import { goto } from '$app/navigation';

	function goStudent() {
		goto('/student_landing_page_id5');
	}
	function goTeacher() {
		goto('/teacher_landing_page_id6');
	}
	function goParent() {
		goto('/parents_landing_page_id4');
	}
	function goReg() {
		goto('/register_page_id3');
	}
	function goGuest() {
		goto('/no_login_page_id7');
	}

	// ✅ HINZUFÜGEN (Svelte 5):
	let { data } = $props();

	// Optional: Damit du nicht immer 'data.supabase' schreiben musst:
	let { supabase, session } = data;

	let email = $state('');
	let password = $state('');
	let message = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		try {
			message = 'Melde an...';

			const { data, error } = await supabase.auth.signInWithPassword({
				email: email,
				password: password
			});

			if (error) {
				throw error;
			}

			// Hole die Rolle des Benutzers aus der Datenbank
			const { data: userData, error: userError } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', data.user.id)
				.single();

			if (userError) {
				throw userError;
			}

			message = 'Anmeldung erfolgreich! Leite weiter...';

			// Leite basierend auf der Rolle weiter
			if (userData.role === 'student') {
				await goto('/student_landing_page_id5');
			} else if (userData.role === 'teacher' || userData.role === 'admin') {
				await goto('/teacher_landing_page_id6'); // Passe den Pfad an
			} else if (userData.role === 'parent') {
				await goto('/parents_landing_page_id4'); // Passe den Pfad an
			} else {
				// Falls keine Rolle gefunden wurde
				throw new Error('Keine gültige Rolle gefunden');
			}
		} catch (error: any) {
			message = `Anmeldung fehlgeschlagen: ${error.message}`;
			// Lösche nur das Passwort, behalte die E-Mail
			password = '';
		}
	}
</script>

<div class="landing_grid">
	<main class="main_container">
		<header>
			<h1 class="start-title">Willkommen in der <br /> HSGG-Lernwelt</h1>
			<p class="start-subtitle">Deine digitale Umgebung zum Lernen, Üben und Begleiten.</p>
		</header>

		<div class="center-content-wrapper">
			<h2>Melde dich an und leg los!</h2>
			<div class="auth-section">
				<form onsubmit={handleLogin} class="login-form">
					<div class="input-row">
						<input
							type="email"
							class="login-input"
							placeholder="E-Mail Adresse"
							bind:value={email}
							required
						/>
						<input
							type="password"
							class="login-input"
							name="password"
							placeholder="Passwort"
							bind:value={password}
							required
						/>
					</div>
					<button type="submit" class="full-width-btn primary-btn">Einloggen</button>
					{#if message}
						<p style="color: red; margin-top: 0.5rem; font-size: 0.9rem;">{message}</p>
					{/if}
				</form>

				<button class="full-width-btn secondary-btn" type="button" onclick={goReg}>
					Noch keine Nutzerdaten? Hier gehts zur Registrierung
				</button>
			</div>

			<div class="guest-section">
				<div class="divider"><span>oder</span></div>
				<button class="guest-btn" type="button" onclick={goGuest}>
					Ohne Login fortfahren &rarr;
				</button>
			</div>
		</div>
		<section class="start-roles">
			<h2 class="start-roles-title">Quick-Links für das Sprint-Meeting:</h2>
			<div class="start-roles-grid">
				<button class="role-card" type="button" onclick={goStudent}>
					<span class="role-icon">🧒</span>
					<span class="role-title">Schüler*in</span>
				</button>
				<button class="role-card" type="button" onclick={goTeacher}>
					<span class="role-icon">👩‍🏫</span>
					<span class="role-title">Lehrperson</span>
				</button>
				<button class="role-card" type="button" onclick={goParent}>
					<span class="role-icon">👨‍👩‍👧</span>
					<span class="role-title">Elternteil</span>
				</button>
			</div>
		</section>
	</main>
</div>

<style>
	/* --- Main Container Layout --- */
	.landing_grid {
		display: grid;
		grid-template-rows: auto 1fr auto;
		min-height: 100dvh;
		background-image: url('../lib/assets/images/bg_f.jpeg');
		background-size: cover;
		background-repeat: no-repeat;
	}

	.main_container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: rgba(255, 255, 255);
		padding: clamp(1.5rem, 4vw, 3rem);
		margin: 1.5rem auto;
		width: min(95%, 600px);
		min-height: 80vh;
		height: auto;
		border-radius: 0.75rem;
		font-family: Arial, Helvetica, sans-serif;
		text-align: center;
		box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.2);
	}

	/* --- NEU: Wrapper für die Zentrierung --- */
	.center-content-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center; /* Horizontal zentrieren */
		justify-content: center; /* Vertikal zentrieren */
		flex-grow: 1; /* Nimmt allen freien Platz zwischen Header und Footer */
		width: 100%;
		margin: 1rem 0; /* Etwas Abstand, damit es nicht klebt */
	}

	/* --- Auth & Guest Styles --- */
	.auth-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 500px;
		gap: 0.8rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		width: 100%;
	}

	.input-row {
		display: flex;
		gap: 0.8rem;
		width: 100%;
	}

	.login-input {
		padding: 0.75rem 1.2rem;
		border: 1px solid #ccc;
		border-radius: 999px;
		font-size: 0.95rem;
		outline: none;
		flex: 1;
		text-align: center;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.login-input:focus {
		border-color: #f4d584;
		box-shadow: 0 0 0 3px rgb(240, 190, 113);
	}

	.full-width-btn {
		width: 100%;
		padding: 0.75rem 1.5rem;
		border-radius: 999px;
		font-weight: 700;
		cursor: pointer;
		font-size: 0.95rem;
		text-align: center;
		transition:
			transform 0.1s,
			opacity 0.2s;
		border: 1px solid #f0be71;
	}

	.full-width-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.primary-btn {
		background-color: #f0be71;
		color: #000000;
	}

	.secondary-btn {
		background-color: #f0be71;
		color: #000000;
	}

	.guest-section {
		width: 100%;
		max-width: 500px;
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		width: 100%;
		color: #888;
		font-size: 0.85rem;
		margin: 0.5rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #ddd;
	}

	.divider span {
		padding: 0 10px;
	}

	.guest-btn {
		background: transparent;
		border: 2px solid #ccc;
		color: #666;
		padding: 0.6rem 1.5rem;
		border-radius: 999px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.9rem;
	}

	.guest-btn:hover {
		border-color: #888;
		color: #333;
		background-color: rgba(0, 0, 0, 0.02);
	}

	@media (max-width: 500px) {
		.input-row {
			flex-direction: column;
		}
	}

	/* --- Typography & Footer --- */
	.start-title {
		font-size: clamp(2.2rem, 4vw, 3rem);
		margin-top: -1rem;
		margin-bottom: 0.8rem;
		font-weight: 700;
	}

	.start-subtitle {
		font-size: clamp(1.1rem, 2vw, 1.4rem);
		color: #444;
		margin-bottom: 0; /* Weniger Margin, da der Flex-Grow Wrapper übernimmt */
	}

	.start-roles {
		width: 100%;
		/* margin-top: auto ist hier nicht mehr zwingend nötig, schadet aber auch nicht.
           Der .center-content-wrapper drückt das hier sowieso nach unten. */
		padding-top: 1rem;
	}

	.start-roles-title {
		font-size: clamp(1rem, 2.5vw, 1.2rem);
		margin-bottom: 1rem;
		font-weight: 600;
		color: #555;
	}

	.start-roles-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 800px) {
		.start-roles-grid {
			grid-template-columns: 1fr;
		}
	}

	.role-card {
		border: none;
		border-radius: 0.9rem;
		background: #f3be6a;
		padding: 0.8rem;
		text-align: center;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		box-shadow: 0 4px 10px rgba(15, 41, 64, 0.12);
	}

	.role-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 18px rgba(15, 41, 64, 0.18);
	}

	.role-icon {
		font-size: clamp(1.4rem, 3vw, 1.8rem);
	}

	.role-title {
		font-weight: 700;
		font-size: clamp(0.8rem, 2vw, 1rem);
	}

	html,
	body {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		width: 100%;
	}
</style>

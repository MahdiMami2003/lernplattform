<!--Lernwelt/src/routes/+page.svelte-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { locale, _ } from '$lib/i18n/config';
	function setLang(l: 'de' | 'en') {
		locale.set(l);
		if (browser) localStorage.setItem('lang', l);
	}

	function goReg() {
		goto('/register_page_id3');
	}
	async function goGuest() {
		await supabase.auth.signOut();
		// Force hard reload to ensure session is cleared
		window.location.href = '/no_login_page_id7';
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
			message = $_('login.logging_in');

			// Ensure previous session is cleared entirely
			await supabase.auth.signOut();

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

			message = $_('login.success_redirect');

			// ✅ UPDATE: Separate Weiterleitung für Admins mit Hard Reload (Session Safety)
			if (userData.role === 'student') {
				window.location.href = '/student_landing_page_id5';
			} else if (userData.role === 'admin') {
				window.location.href = '/admin_landing_page';
			} else if (userData.role === 'teacher') {
				window.location.href = '/teacher_landing_page_id6';
			} else if (userData.role === 'parent') {
				window.location.href = '/parents_landing_page_id4';
			} else {
				// Falls keine Rolle gefunden wurde
				throw new Error($_('login.no_valid_role'));
			}
		} catch (error: any) {
			message = `${$_('login.failed')}: ${error?.message ?? error}`;
			// Lösche nur das Passwort, behalte die E-Mail
			password = '';
		}
	}
</script>

<div class="landing_grid">
	<main class="main_container">
		<div class="lang-switch">
			<button type="button" class:selected={$locale === 'de'} onclick={() => setLang('de')}
				>DE</button
			>
			<button type="button" class:selected={$locale === 'en'} onclick={() => setLang('en')}
				>EN</button
			>
		</div>
		<header>
			<h1 class="start-title">{$_('login.title')}</h1>
			<p class="start-subtitle">{$_('login.subtitle')}</p>
		</header>

		<div class="center-content-wrapper">
			<h2>{$_('login.cta')}</h2>
			<div class="auth-section">
				<form onsubmit={handleLogin} class="login-form">
					<div class="input-row">
						<input
							type="email"
							class="login-input"
							placeholder={$_('login.email_placeholder')}
							bind:value={email}
							required
						/>
						<input
							type="password"
							class="login-input"
							name="password"
							placeholder={$_('login.password_placeholder')}
							bind:value={password}
							required
						/>
					</div>
					<button type="submit" class="full-width-btn primary-btn"
						>{$_('login.login_button')}</button
					>
					{#if message}
						<p style="color: red; margin-top: 0.5rem; font-size: 0.9rem;">{message}</p>
					{/if}
				</form>

				<button class="full-width-btn secondary-btn" type="button" onclick={goReg}>
					{$_('login.register_button')}
				</button>
			</div>

			<div class="guest-section">
				<div class="divider"><span>{$_('login.or')}</span></div>
				<button class="guest-btn" type="button" onclick={goGuest}>
					{$_('login.guest_button')}
				</button>
			</div>
		</div>
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
		position: relative;
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
	.lang-switch {
		position: absolute;
		top: 0.8rem;
		right: 0.8rem;
		display: flex;
		gap: 0.4rem;
	}
	.lang-switch button {
		border: 1px solid #ccc;
		background: white;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.lang-switch button.selected {
		font-weight: 700;
		text-decoration: underline;
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

	html,
	body {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		width: 100%;
	}
</style>

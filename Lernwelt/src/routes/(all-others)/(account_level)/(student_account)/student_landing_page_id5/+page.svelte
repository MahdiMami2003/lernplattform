<script lang="ts">
	import { supabase } from "$lib/supabaseClient";
	import { onMount } from "svelte";

	let userName: string = "Schüler";
	let loading = true;

	onMount(async () => {
		loading = true;

		// Aktuell eingeloggten Benutzer holen
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();

		if (authError) {
			console.error("Fehler beim Holen des Users:", authError.message);
			loading = false;
			return;
		}

		if (user) {
			// Profil aus der Datenbank holen
			const { data: profileData, error: profileError } = await supabase
				.from("profiles")
				.select("full_name")
				.eq("id", user.id)
				.single();

			if (profileError) {
				console.error(
					"Fehler beim Holen des Profils:",
					profileError.message
				);
			} else if (profileData) {
				userName = profileData.full_name || "Schüler";
			}
		}

		loading = false;
	});
</script>

<div id="placeholder">
	{#if loading}
		<h1>Lade Profil…</h1>
	{:else}
		<h1>Hallo {userName}!</h1>
		<div>Herzlich willkommen auf der Website der HSGG Lernwelt</div>
		<div>Bitte klicke auf das Thema das dich interessiert.</div>
	{/if}

	<br />

	<ul>
		<!-- GAME PAGE -->
		<li class="landing_liste">
			<a href="/game_page_id12"><h3>Starte das Spiel</h3></a>
			<div class="link_description">
				Aufgaben & Gamification – wie Duolingo!
			</div>
		</li>

		<!-- WEEKLY TEST -->
		<li class="landing_liste">
			<a href="/weekly_test_page_id17"><h3>Wochentests</h3></a>
			<div class="link_description">
				Regelmäßige Kompetenzchecks
			</div>
		</li>

		<!-- PROGRESS -->
		<li class="landing_liste">
			<a href="/progress_page_id11"><h3>Fortschritt</h3></a>
			<div class="link_description">
				Dein Lernfortschritt übersichtlich dargestellt
			</div>
		</li>

		<!-- MATERIAL -->
		<li class="landing_liste">
			<a href="/material_page_id14"><h3>Lernunterlagen</h3></a>
			<div class="link_description">
				Material zum Download & Bearbeiten
			</div>
		</li>
	</ul>
</div>

<style>
    ul {
        padding: 0;
        margin: 0;
    }

    a {
        margin: 0;
        color: black;
        text-decoration: none;
    }

    .landing_liste {
        list-style-type: none;
        border: solid thin lightgray;
        margin: 1dvh;
        padding-left: 3dvh;
        background-color: #f5f5dc;
        border-radius: 5px;
    }

    li:hover {
        background-color: #dcdcc5;
    }

    a:hover {
        color: #0077cc;
        text-decoration: underline;
    }

    .link_description {
        padding-bottom: 2dvh;
        padding-left: 3dvh;
    }
</style>

<script>
	import { _ } from '$lib/i18n/config';
</script>

<div class="main_container">
	<h1>Allgemeine Geschäftsbedingungen (AGB)</h1>

	<section>
		<h2>1. Geltungsbereich</h2>
		<p>
			Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Lernplattform
			"HSGG-Lernwelt". Dies ist ein schulisches Projekt der HSGG. Es werden keine kommerziellen
			Ziele verfolgt. Die Nutzung ist für die berechtigten Personenkreise (Schüler:innen,
			Lehrkräfte, Eltern) kostenfrei.
		</p>
	</section>

	<section>
		<h2>2. Leistungsbeschreibung</h2>
		<p>
			Die HSGG-Lernwelt stellt Funktionen zum Lernen, Üben (z.B. Minispiele, Wochentests) und zur
			Verwaltung von Lernfortschritten bereit. Es besteht kein Anspruch auf ständige Verfügbarkeit
			der Dienste. Wartungsarbeiten oder Fehler können die Erreichbarkeit einschränken.
		</p>
	</section>

	<section>
		<h2>3. Registrierung und Benutzerkonto</h2>
		<p>
			Für die Nutzung bestimmter Bereiche ist eine Registrierung erforderlich. Der Nutzer
			verpflichtet sich, wahrheitsgemäße Angaben zu machen und sein Passwort geheim zu halten. Die
			Weitergabe des Zugangs an Dritte ist nicht gestattet.
		</p>
	</section>

	<section>
		<h2>4. Pflichten der Nutzer</h2>
		<p>
			Nutzer dürfen keine Inhalte einstellen oder verbreiten, die gegen geltendes Recht, die guten
			Sitten oder Rechte Dritter verstoßen. Respektvoller Umgang miteinander (z.B. in Chats oder
			Foren, falls vorhanden) ist Pflicht.
		</p>
	</section>

	<section>
		<h2>5. Datenschutz</h2>
		<p>
			Der Schutz deiner Daten ist uns wichtig. Informationen zur Datenverarbeitung findest du in
			unserer
			<a href="/datenschutz">Datenschutzerklärung</a>.
		</p>
	</section>

	<section>
		<h2>6. Haftung</h2>
		<p>
			Für Inhalte, die von Nutzern erstellt werden, sind diese selbst verantwortlich. Die Betreiber
			der HSGG-Lernwelt haften nicht für die Richtigkeit der bereitgestellten Lerninhalte.
		</p>
	</section>

	<section>
		<h2>7. Schlussbestimmungen</h2>
		<p>
			Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB
			unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
		</p>
	</section>

	<div class="actions">
		<button onclick={() => history.back()}>{$_('common.back')}</button>
	</div>
</div>

<style>
	.main_container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		background-color: var(--bg-card, #ffffff);
		border-radius: 10px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		font-family: Arial, sans-serif;
	}

	section {
		margin-bottom: 2rem;
		border-bottom: 1px solid var(--border-color, #eee);
		padding-bottom: 1rem;
	}

	section:last-of-type {
		border-bottom: none;
	}

	h1 {
		color: var(--text-primary, #333);
		margin-bottom: 2rem;
		text-align: center;
	}

	h2 {
		color: var(--text-primary, #444);
		font-size: 1.2rem;
		margin-bottom: 1rem;
	}

	p {
		color: var(--text-secondary, #666);
		line-height: 1.6;
		margin: 0;
	}

	a {
		color: var(--button-bg, #f0be71);
		text-decoration: underline;
	}

	.actions {
		margin-top: 2rem;
		text-align: center;
	}

	button {
		background-color: var(--button-bg, #f0be71);
		color: #000;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 5px;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.1s;
	}

	button:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}
</style>

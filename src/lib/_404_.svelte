<script>
	export let message = 'Attention ! Composant non trouvé.';
</script>

<div class="attention-panel">
	<div class="icon">⚠️</div>
	<!--  <div class="text">{message}</div> -->
</div>

<style>
	.attention-panel {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		padding: 1.5em;
		border: 2px solid #ffcc00;
		border-radius: 8px;
		background-color: #fffbe6;
		color: #665c00;
		font-size: 1.5em;
		font-weight: bold;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		max-width: 100%;
		max-height: 100%;
		min-width: 100%;
		min-height: 100%;
		margin: auto;
		text-align: center;
	}

	.icon {
		font-size: 2em;
		margin-bottom: 0.5em;
	}

	.text {
		font-size: 1.2em;
	}
</style>

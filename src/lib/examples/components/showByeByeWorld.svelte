<script>
	import { onMount } from 'svelte';
	export let who = 'World';
	onMount(() => {
		console.log('Hello ' + who);
	});
</script>

<main>
	<h1>ByeBye {who}</h1>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
</style>

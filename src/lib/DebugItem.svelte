<script lang="ts">
	//extensions
	import '$extensions/string.extension.js';

	//utils
	import { copyToClipboard } from './utils/clipboard';

	//SMUI
	import Button from '@smui/button';

	export let items: any;
</script>

<Button
	on:click={() => {
		copyToClipboard(JSON.stringify(items, null, 2));
	}}
	>Copier
</Button>

<pre>
	{JSON.stringify(items, null, 2)}        
</pre>

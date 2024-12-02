<script lang="ts">
	//extensions
	import '$extensions/string.extension.js';

	//utils
	import { copyToClipboard } from './utils/clipboard';

	//SMUI
	import Button from '@smui/button';
	export let excludeIds: Array<string> = [];

	export let items: any;
	$: itemsToShow = items.filter((item) => !excludeIds.includes(item.id));
</script>

<Button
	on:click={() => {
		copyToClipboard(JSON.stringify(itemsToShow, null, 2));
	}}
	>Copier
</Button>

<pre>
	{JSON.stringify(itemsToShow, null, 2)}        
</pre>

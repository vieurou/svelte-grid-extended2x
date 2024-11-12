<script lang="ts">
	// conf

	let debugThis: boolean = false;

	// Importer le composant PAGE et autres composants nécessaires
	//import Grid, { type PageItem, Page, GridItem, PageGridItem } from '$lib';
	import { type PageItem, Page } from '$lib';
	import HelloWorld from '$lib/examples/components/showHelloWorld.svelte';

	//SMUI
	//import Card from '@smui/card';
	//import IconButton from '@smui/icon-button';

	//let pageItems : Array<PageItem> = [
	const pageItems = [
		{
			id: 'coucou 1',
			name: 'coucou 1',
			x: 5,
			y: 0,
			w: 1,
			h: 1,
			movable: false,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			data: {
				//text: 'coucou 🤶',
				who: 'AAAAAAARGNH 🦓'
			}
		},
		{
			id: 'coucou 2',
			name: 'coucou 2',
			x: 10,
			y: 7,
			w: 1,
			h: 1,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,
			data: {
				text: 'coucou 🤷'
			}
		},
		{
			id: 'coucou 3',
			name: 'Coucou 3',
			x: 10,
			y: 13,
			w: 1,
			h: 1,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,
			data: {
				text: 're coucou 🤟🏻 '
			}
		},
		{
			id: 'Carte',
			name: 'Carte',
			x: 0,
			y: 0,
			w: 1,
			h: 1,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,
			data: {
				text: 'coucou 🥦🥦🥦🥦 '
			}
		}
	] as PageItem[];

	$: if (debugThis) console.log('pageItems dans +page.svelte= ', pageItems);
</script>

<Page
	{pageItems}
	nomPage="Page d'exemple d'utilisation de PageGrid"
	description="Page de gestion des zones"
	let:item
	{debugThis}
>
	{#if item.id === 'coucou 1'}
		<HelloWorld who={'AAAAAAARGNH 🦓'} />
	{:else if item.data}
		{item.data.text}
	{:else}
		{item.name}
	{/if}
</Page>

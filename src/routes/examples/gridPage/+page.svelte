<!-- src/routes/examples/gridPage/+page.svelte -->

<script lang="ts">
	// conf

	let debugThis: boolean = true;

	// Importer le composant PAGE et autres composants nécessaires
	import { type PageItem, Page } from '$lib';
	//on importe les composants
	import HelloWorld from '$lib/examples/components/showHelloWorld.svelte';
	//on importe la map des composants
	import componentsMap from './componentsMap';

	// Créer un tableau de PageItem
	const pageItems = [
		//item minimal
		{
			id: 'Item minimal'
		},
		//un item standard
		{
			x: 3,
			y: 0,
			w: 3,
			h: 1,
			name: 'Item Standard',
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,
			id: 'standard',
			text: '🥦🥦🥦🥦 <br/> Item Standard <br/> 🥦🥦🥦🥦 '
		},
		//item avec un composant dans pageITem ( probleme avec la sauvegarde et le chargement)
		{
			id: 'HelloWorld pageItem',
			name: 'Item avec un composant dans pageItem',
			x: 7,
			y: 0,
			w: 3,
			h: 3,

			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,

			componentName: 'HelloWorld',
			props: {
				who: 'AAAAAAARGNH 🦓'
			},

			preComponentText: '<h2> Composant HelloWorld dans pageItem </h2>',
			postComponentText: '\n\t\t\t\t<h2 class="text-red"> fin Composant HelloWorld </h2> \n\t\t\t',

			cssStyle: `
				backgroundColor: 'lightblue',
				color: 'black',
				text-align: 'center'`
		},
		//item avec un composant dans le slot
		{
			id: 'HelloWorld slot',
			x: 11,
			y: 0,
			w: 3,
			h: 3,
			name: 'Item avec un composant dans le slot',
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true
		},
		//item pas visible
		{
			x: 0,
			y: 2,
			w: 3,
			h: 1,
			name: 'Item caché',

			visible: false,
			id: 'Caché',
			text: 'item caché 🤷'
		},

		//item bougeable
		{
			id: 'Item bougeable',
			x: 0,
			y: 4,
			w: 3,
			name: 'Item bougeable',
			movable: true,
			text: "text de l'item bougeable 🤷"
		},
		//item reduit
		{
			id: 'réduit',
			name: 'Item réduit',
			x: 5,
			y: 5,
			w: 1,
			h: 1,
			folded: true,
			text: 're coucou 🤟🏻 '
		}
	] as PageItem[];

	$: if (debugThis) console.log('pageItems dans +page.svelte= ', pageItems);
</script>

<Page
	nomPage="Page d'exemple d'utilisation de PageGrid"
	description="Page de gestion des zones"
	let:item
	{pageItems}
	{componentsMap}
	{debugThis}
>
	{#if item.id === 'HelloWorld slot'}
		<HelloWorld who={'OOOOOOOH 🦓'} />
	{/if}
</Page>

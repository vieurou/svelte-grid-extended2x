<!-- src/routes/examples/gridPage/+page.svelte -->

<script lang="ts">
	// conf
	let debugThis: boolean = true;

	// Importer le composant PAGE et autres composants nécessaires
	import { type PageItem, Page } from '$lib';

	//on importe la map des composants
	import componentsMap from './componentsMap';

	//on importe le composants car il sera apeller dans le slot
	import HelloWorld from '$lib/examples/components/showHelloWorld.svelte';

	// Créer un tableau de PageItem
	const pageItems = [
		//item minimal
		{
			id: 'Item minimal'
		},
		//un item standard
		{
			id: 'standard',
			name: 'Item Standard',
			x: 3,
			y: 0,
			w: 3,
			h: 1,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,
			text: '🥦🥦🥦🥦 <br/> Item Standard <br/> 🥦🥦🥦🥦 '
		},
		//item avec un composant byebyeWorld dans pageITem
		{
			id: 'ComposantByeByeWorld',
			name: 'Item avec composant',
			x: 7,
			y: 0,
			w: 3,
			h: 3,

			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			visible: true,

			componentName: 'ByeByeWorld',
			props: {
				who: 'AAAAAAARGNH 🦓'
			},

			preComponentText: '<h2> Composant ByeByeWorld dans pageItem </h2>',
			postComponentText: '\n\t\t\t\t<h2 class="text-red"> fin Composant HelloWorld </h2> \n\t\t\t',

			cssStyle: `
				backgroundColor: 'lightblue',
				color: 'black',
				text-align: 'center'`
		},
		//item avec un composant inexistant
		{
			id: 'COmposantInexistant pageItem',
			name: 'Item avec composant inexistant',
			x: 7,
			y: 5,
			w: 3,
			h: 3,

			componentName: 'composantInexistant',
		},
		//item avec un composant dans le slot
		{
			id: 'HelloWorld slot',
			name: 'Item avec un composant dans le slot',
			x: 11,
			y: 0,
			w: 3,
			h: 3,
		},
		//item pas visible
		{
			id: 'Caché',
			name: 'Item caché',
			x: 0,
			y: 2,
			w: 3,
			h: 1,

			visible: false,
			text: 'item caché 🤷'
		},

		//item bougeable
		{
			id: 'Item bougeable',
			name: 'Item bougeable',
			x: 0,
			y: 4,
			w: 3,
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

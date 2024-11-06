<!-- génére par sequelize.helper.js : generatePageFilen -->
<script lang="ts">
	// conf

	let debugThis = false;

	// Importer le composant PAGE et autres composants nécessaires
	//import Grid, { type PageItem, Page, GridItem, PageGridItem } from '$lib';
	import { /*type PageItem,*/ Page, PageGridItem } from '$lib';

	//SMUI
	//import Card from '@smui/card';
	//import IconButton from '@smui/icon-button';

	//let pageItems : Array<PageItem> = [
	$: pageItems = [
		{
			id: 'coucou 1',
			name: 'coucou 1',
			x: 0,
			y: 7,
			w: 10,
			h: 8,
			movable: false,
			resizable: true,
			folded: false,
			headed: true,
			data: {
				text: 'coucou 🤶'
			}
		},
		{
			id: 'coucou 2',
			name: 'coucou 2',
			x: 10,
			y: 7,
			w: 9,
			h: 5,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			data: {
				text: 'coucou 🤷'
			}
		},
		{
			id: 'coucou 3',
			name: 'Coucou 3',
			x: 10,
			y: 13,
			w: 3,
			h: 2,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			data: {
				text: 're coucou 🤟🏻 '
			}
		},
		{
			id: 'Carte',
			name: 'Carte',
			x: 0,
			y: 0,
			w: 17,
			h: 7,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			data: {
				text: 'coucou 🥦🥦🥦🥦 '
			}
		}
	];

	$: if (debugThis) console.log('pageItems dans +page.svelte= ', pageItems);
</script>

<Page
	bind:pageItems
	nomPage="Page d'exemple d'utilisation de PageGrid"
	description="Page de gestion des zones"
>
	<div class="content-container">
		{#each pageItems as item, i (item.id)}
			<PageGridItem
				bind:x={item.x}
				bind:y={item.y}
				bind:w={item.w}
				bind:h={item.h}
				bind:movable={item.movable}
			>
				<div slot="moveHandle" let:moveStart>
					<div class="move-handle" on:pointerdown={moveStart}>
						{item.name}
					</div>
				</div>
				<div class=" item">
					{item.data ? item.data.text : item.name}
				</div>
			</PageGridItem>
		{/each}
	</div>
</Page>

<!-- src/routes/Grid/+page.svelte-->

<script lang="ts">
	//sveltekit
	import { onMount /*, tick, setContext*/ } from 'svelte';
	//import { writable, get } from 'svelte/store';
	import { page } from '$app/stores';

	//extensions
	import '$extensions/string.extension.js';

	//grid
	import Grid, { GridItem } from '$lib';
	import type PageItem from '$lib';

	//SMUI
	import Snackbar, { Actions, Label } from '@smui/snackbar';
	import Button from '@smui/button';
	import Dialog, { Actions as DActions, Title, Content } from '@smui/dialog';
	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import IconButton from '@smui/icon-button';
	import HelperText from '@smui/textfield/helper-text';
	import List, { Item as LItem, Text } from '@smui/list';
	import Card from '@smui/card';

	//ICI
	//COMPONENTS
	import HelloWorld from '$lib/examples/components/showHelloWorld.svelte';

	//*******Gestion du fenetrage*********//

	////****Gestion des Dispositions****////

	let dispos: Array<object> = [], //tableau des dispositions
		urlPathname = ''; //url de la page sans le slash initial pour créer des nom de dispo en fonstion de la page.

	//au demarage au recupe le nom de la page
	//et on recupere les dispositions enregistrées
	onMount(() => {
		urlPathname = $page.url.pathname.removeFirstChar();
		fillDispos();
		console.log('dispos : ', dispos);
	});

	//fonction qui recupere les dispositions enregistrées
	function fillDispos() {
		// Récupérer toutes les clés dans localStorage
		const keys = Object.keys(localStorage);

		let localStorageItems = [];

		// Parcourir les clés et récupérer les valeurs correspondantes
		localStorageItems = keys.map((key) => {
			return {
				key,
				value: localStorage.getItem(key)
			};
		});
		console.log('localStorageItems : ', localStorageItems);
		//on mets dans dispos toutes les clés de localstoreage qui commencent par la route et on les stocke avec une key qui est la route
		dispos = localStorageItems.filter((item) => item.key.startsWith(urlPathname));
	}

	////// Gestion du chargement
	let loadDialogOpen: boolean = false; //dialog de chargement ouvert

	function openLoadDialog() {
		loadDialogOpen = true;
	}

	/* function closeLoadDialog() {
		loadDialogOpen = false;
	} */

	function loadGrid(name: string) {
		const localItems = localStorage.getItem(name);
		if (localItems) {
			items = JSON.parse(localItems);
		}
	}

	////// Gestion de l'enregistrement
	let saveDialogOpen: boolean = false, //dialog d'enregistrement ouvert
		valueName: string = '', //nom de la disposition donné par le client
		configurationName: string = ''; //nom complet de la disposition : "urlPathname_valueName"

	function openSaveDialog() {
		saveDialogOpen = true;
	}

	/* function closeSaveDialog() {
		saveDialogOpen = false;
	} */

	function saveGrid(name: string) {
		console.log('Sauvegarde de ', name, ' : ', items);
		//on enregistre les donnes en local
		localStorage.setItem(name, JSON.stringify(items));
		fillDispos();
		valueName = '';
	}

	function closeSaveHandler(e: CustomEvent<{ action: string }>) {
		let response = '';
		switch (e.detail.action) {
			case 'Annuler':
				response = 'Enregistrement de la disposition annulée.';
				break;
			case 'Enregistrer':
				configurationName = urlPathname + '_' + valueName;
				saveGrid(configurationName);
				response = 'Disposition enregistrée sous le nom ' + configurationName + '.';

				break;
			default:
				// This means the user clicked the scrim or pressed Esc to close the dialog.
				// The actions will be "close".
				response = 'Enregistrement de la disposition annulée.';
				break;
		}
		snackMessage(response);
	}

	//////Gestion de la suppression
	let snackbarSuppDisposition: Snackbar,
		reason = 'nothing yet',
		action = 'nothing yet',
		rightClikedDispo: string = '';

	function handleRightClick(e: MouseEvent) {
		//on annule le menu contextuel
		e.preventDefault();

		//on recupere le text
		rightClikedDispo = e?.target?.textContent;

		//on ouvre le snackbar de confirmation
		snackbarSuppDisposition.open();
	}

	function handleClosedSnackBarSuppDispo(e: CustomEvent<{ reason: string | undefined }>) {
		reason = e.detail.reason ?? 'Undefined.';
		console.log('Snackbar closed with reason:', reason);
		console.log('Action:', action);
		if (action === 'Supprimer') {
			localStorage.removeItem(urlPathname + '_' + rightClikedDispo);
			fillDispos();
			action = 'nothing';
		}
	}

	////// Gestion des Messages
	let snackBarInfoMessage: string = '',
		//snackbarOpened: Array<Snackbar> = [],
		snackbarInfo: Snackbar;

	function snackMessage(message: string) {
		snackBarInfoMessage = message;
		snackbarInfo.open();
	}

	////// Gestion des items

	////////Gestion du déplacement
	let globalMovable = false;

	////////Gestion du RESET
	function resetGrid() {
		items = structuredClone(itemsBackup);
		globalMovable = false;
	}

	/**
	 * @function swapmovable
	 * @description			swap la propriété movable d'un item
	 * @param {string} id  	id de l'item
	 * @param {boolean|null} force
	 * 				Si null on swap , sinon on force la valeur de force
	 */
	function swapmovable(id: string, force: boolean | null = null) {
		if (force !== null) {
			items = items.map((item) => {
				if (item.id === id) {
					item.movable = force;
				}
				/* if (item.movable) {
					item.h += 2;
				}
				else 
				{
					item.h -= 2;
				} */
				return item;
			});
			return;
		}
		items = items.map((item) => {
			if (item.id === id) {
				item.movable = !item.movable;
				/* if (item.movable) {
					item.h += 2;
				}
				else 
				{
					item.h += 1;
				} */
			}
			return item;
		});
	}

	////////Gestion du pliage
	/**
	 * @function swapFolded
	 * @param id
	 * @param force 			Si null on swap , sinon on force la valeur de force
	 */
	function swapFolded(id: string, force: boolean | null = null) {
		if (force !== null) {
			items = items.map((item) => {
				if (item.id === id) {
					item.folded = force;
				}
				return item;
			});
			return;
		}
		items = items.map((item) => {
			if (item.id === id) {
				item.folded = !item.folded;
			}
			return item;
		});
	}

	//*******FIN Gestion du fenetrage*********//

	//****** *Gestion des Fenetres *********//

	//CODE specifique à ma page de gestion des professions
	export let pageItems: Array<PageItem> = [
		{
			id: 'HelloWorld',
			name: 'HelloWorld',
			x: 0,
			y: 0,
			w: 0,
			h: 0,
			movable: false,
			resizable: true,
			folded: false,
			headed: true
		},
		{
			id: 'TEST',
			name: 'TEST',
			x: 6,
			y: 0,
			w: 0,
			h: 0,
			movable: false,
			resizable: true,
			folded: false,
			headed: false,
			data: { text: '🙁🙁🙁' }
		},
		{
			id: 'Test2',
			name: 'Test 2',
			x: 0,
			y: 15,
			w: 0,
			h: 0,
			movable: false,
			resizable: true,
			data: { text: '🤶' },
			folded: false,
			cssClass: 'item'
		},
		{
			id: 'debug',
			name: 'Debug',
			x: 9,
			y: 0,
			w: 0,
			h: 0,
			movable: false,
			resizable: true,
			folded: false,
			headed: false
		}
	];

	let items = pageItems;
	const itemsBackup = structuredClone(pageItems);
	const itemSize = { width: 100, height: 100 };

	//*******FIN Gestion des Fenetres*********//

	//****Gestion des profession****//
	import type { Profession } from './prototypesProfession';

	let profession: Profession = null;

	$: if (profession != null) {
		console.log('profession : ', profession);
	}

	//****FIN Gestion des profession****//
</script>

<svelte:head>
	<title>Professions</title>
	<meta name="description" content="Page de gestion des professions" />
</svelte:head>

<div>
	<Button on:click={resetGrid}>Reset</Button>
	<Button on:click={openSaveDialog}>Save</Button>
	<Button on:click={openLoadDialog}>Load</Button>
	<Button
		on:click={() => {
			globalMovable = false;
			items.forEach((element) => {
				swapmovable(element.id, globalMovable);
			});
		}}
		disabled={!globalMovable}
	>
		bloq all
	</Button>
	<Button
		on:click={() => {
			globalMovable = true;
			items.forEach((element) => {
				swapmovable(element.id, globalMovable);
			});
		}}
		disabled={globalMovable}
	>
		unbloq all
	</Button>
</div>

<Grid cols={0} rows={0} {itemSize} collision="push">
	<div class="content-container">
		{#each items as item, i (item.id)}
			<GridItem
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
					{#if item.id === 'HelloWorld'}
						<HelloWorld who="Lulu" />
					{:else if item.id === 'debug'}
						<div>
							<Button on:click={() => swapmovable(item.id)}>swap movable</Button>
							<Button on:click={() => swapFolded(item.id)}>swap folded</Button>
							<!--afficher items avec mise en page -->
							<p>items:</p>
							<Card><pre>{JSON.stringify(items, null, 2)}</pre></Card>
						</div>
					{:else if item.data}
						{item.data.text}
					{/if}
				</div>
			</GridItem>
		{/each}
	</div>
</Grid>

<!-- SNACKBARS -->

<Snackbar bind:this={snackbarInfo}>
	<Label>{snackBarInfoMessage}</Label>
</Snackbar>

<Snackbar
	variant="stacked"
	class="demo-warning"
	bind:this={snackbarSuppDisposition}
	on:SMUISnackbar:closed={handleClosedSnackBarSuppDispo}
>
	<Label>
		Voulez vous supprimer la disposition {rightClikedDispo} ?
	</Label>
	<Actions>
		<Button on:click={() => (action = 'Supprimer')}>SUPPRIMER</Button>
		<Button on:click={() => (action = 'Annuler')}>Annuler</Button>
		<IconButton on:click={() => (action = 'Annuler')} class="material-icons" title="Dismiss"
			>close</IconButton
		>
	</Actions>
</Snackbar>
<!-- FIN SNACKBARS -->

<!-- DIALOGS -->

<Dialog
	bind:open={saveDialogOpen}
	aria-labelledby="event-title"
	aria-describedby="event-content"
	on:SMUIDialog:closed={closeSaveHandler}
>
	<Title id="event-title">Enregistrer une disposition</Title>
	<Content id="event-content">
		Donnez un nom à votre disposition
		<Textfield type="text" bind:value={valueName} label="nom" style="min-width: 250px;">
			<svelte:fragment slot="trailingIcon">
				<!-- <Icon class="material-icons" role="button" on:click={clickHandler}>save</Icon> -->
				<Icon class="material-icons" role="button">save</Icon>
			</svelte:fragment>
			<HelperText validationMsg slot="helper">That's not a valid email address.</HelperText>
		</Textfield>
	</Content>
	<DActions>
		<Button action="Annuler" defaultAction>
			<Label>Annuler</Label>
		</Button>
		<Button action="Enregistrer" defaultAction disabled={valueName.length < 1}>
			<Label>Enregistrer</Label>
		</Button>
	</DActions>
</Dialog>

<Dialog
	on:contextmenu={handleRightClick}
	bind:open={loadDialogOpen}
	selection
	aria-labelledby="list-title"
	aria-describedby="list-content"
>
	<Title id="list-title"
		>Selectionnez la disposition <br /><legend style="font-size:50%;color:grey">
			clique droit pour supprimer</legend
		></Title
	>
	<Content id="list-content">
		<List>
			{#each dispos as item}
				<LItem
					on:click={() => {
						loadGrid(item.key);
						loadDialogOpen = false;
					}}
				>
					<Text>{item.key.toString().removeFirstOccurence(urlPathname + '_')}</Text>
				</LItem>
			{/each}
		</List>
	</Content>
</Dialog>

<!-- FIN DIALOGS -->

<style>
	.move-handle,
	.item {
		padding: 8px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.move-handle {
		background-color: #f0f0f0;
		cursor: grab;
		margin-bottom: 4px;
		position: relative; /* Positionne le moveHandle au-dessus des autres éléments */
		z-index: 2; /* Assure que le moveHandle reste au-dessus lors du déplacement */
	}

	.move-handle:active {
		background-color: #e0e0e0;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		cursor: grabbing;
	}

	.item {
		background-color: rgb(230, 212, 212);
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}

	/* Ajoutez des styles pour décaler la carte ou d'autres éléments si nécessaire * /
	.content-container > *:first-child:not(.move-handle) + .move-handle {
		margin-top: 50px; /* Ajustez cette valeur en fonction de l'espace souhaité * /
	}*/

	/* Styles globaux et ajustements */
	:global(*) {
		box-sizing: border-box;
	}
</style>

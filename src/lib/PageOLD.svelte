<!-- src/routes/Grid/+PageOLD.svelte-->

<script lang="ts">
	//config

	let debugThis = true;

	//sveltekit
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	//extensions
	import '$extensions/string.extension.js';

	//grid
	import Grid, { type PageItem /*Page, GridItem, PageGridItem */ } from '$lib';

	//SMUI
	import Snackbar, { Actions, Label } from '@smui/snackbar';
	import Button from '@smui/button';
	import Dialog, { Actions as DActions, Title, Content } from '@smui/dialog';
	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import IconButton from '@smui/icon-button';
	import HelperText from '@smui/textfield/helper-text';
	import List, { Item as LItem, Text } from '@smui/list';
	/*import Card from '@smui/card';
	import Select from '@smui/select';*/

	import { snackbarMessage } from '$stores/snackBar.store';
	let snackbarClipBoard: Snackbar;

	snackbarMessage.subscribe((message) => {
		if (message) {
			snackbarClipBoard.open();
		}
	});

	//*******Gestion du fenetrage*********//

	////****Gestion des Dispositions****////

	let dispos: Array<{ key: string; value: string }> | null = [], //tableau des dispositions
		urlPathname = ''; //url de la page sans le slash initial pour créer des nom de dispo en fonstion de la page.

	//au demarage au recupe le nom de la page
	//et on recupere les dispositions enregistrées
	onMount(() => {
		urlPathname = $page.url.pathname.removeFirstChar();
		dispos = getDispositions();
		if (dispos.length > 0) loadGrid(dispos[0].key);
		if (debugThis) console.log('dispositions enregistrées : ', dispos);
	});

	//fonction qui recupere les dispositions enregistrées
	function getDispositions() {
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
		if (debugThis) console.log('localStorageItems : ', localStorageItems);
		//on mets dans dispos toutes les clés de localstoreage qui commencent par la route et on les stocke avec une key qui est la route
		return localStorageItems.filter((item) => item.key.startsWith(urlPathname));
	}

	////// Gestion du chargement
	let loadDialogOpen: boolean = false; //dialog de chargement ouvert

	function openLoadDialog() {
		loadDialogOpen = true;
	}

	/*function closeLoadDialog() {
		loadDialogOpen = false;
	}*/

	function loadGrid(name: string) {
		const localItems = localStorage.getItem(name);
		if (localItems) {
			items = JSON.parse(localItems);
			if (items) pageItems = items;
		}
	}

	////// Gestion de l'enregistrement
	let saveDialogOpen: boolean = false, //dialog d'enregistrement ouvert
		valueName: string = '', //nom de la disposition donné par le client
		configurationName: string = ''; //nom complet de la disposition : "urlPathname_valueName"

	function openSaveDialog() {
		saveDialogOpen = true;
	}

	/*function closeSaveDialog() {
		saveDialogOpen = false;
	}*/

	function saveGrid(name: string) {
		if (debugThis) console.log('Sauvegarde de ', name, ' : ', items);
		//on enregistre les donnes en local
		localStorage.setItem(name, JSON.stringify(items));
		dispos = getDispositions();
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

	function handleRightClick(e: MouseEvent, itemKey: string) {
		console.log('rightCliked !!! ');
		//on annule le menu contextuel
		e.preventDefault();

		//on recupere le text
		//rightClikedDispo = e?.target?.textContent;
		rightClikedDispo = itemKey.toString().removeFirstOccurence(urlPathname + '_');
		//on ouvre le snackbar de confirmation
		snackbarSuppDisposition.open();
	}

	function handleClosedSnackBarSuppDispo(e: CustomEvent<{ reason: string | undefined }>) {
		reason = e.detail.reason ?? 'Undefined.';
		if (debugThis) console.log('Snackbar closed with reason:', reason);
		if (debugThis) console.log('Action:', action);
		if (action === 'Supprimer') {
			localStorage.removeItem(urlPathname + '_' + rightClikedDispo);
			dispos = getDispositions();
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

	$: console.log('globalMovable dans PageOLD.sveltelte , l215 : ', globalMovable);

	////////Gestion du RESET
	/*function resetGrid() {
		if (itemsBackup) pageItems = structuredClone(itemsBackup);
		globalMovable = false;
	}*/

	/**
	 * @function swapMovable
	 * @description			swap la propriété movable d'un item
	 * @param {string} id  	id de l'item
	 * @param {boolean|null} force
	 * 				Si null on swap , sinon on force la valeur de force
	 */
	function swapMovable(id: string, force: boolean | null = null) {
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
	/*function swapFolded(id: string, force: boolean | null = null) {
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
	}*/

	//*******FIN Gestion du fenetrage*********//

	//******* Gestion des Fenetres *********//

	//CODE specifique à ma page de gestion des professions

	export let nomPage = 'pageTemplate';
	export let description = 'Description de la page';

	export let pageItems: Array<PageItem> = [];
	import { pageItemsStore } from '$stores/pageItems.store';

	let items: Array<PageItem> | null = null; //pageItems;
	let itemsBackup: Array<PageItem> | null = null; // structuredClone(pageItems);
	const itemSize = { width: 100, height: 100 };

	$: {
		console.log('pageItems recupéré dans setInitialItems = ', pageItems);
		pageItemsStore.setInitialItems(pageItems);
	}

	// Utiliser $pageItemsStore pour accéder aux valeurs du store
	$: {
		items = $pageItemsStore.pageItems;
		console.log('pageItems dans PageOLD.svelteltelte = ', items);
	}
	$: {
		itemsBackup = $pageItemsStore.itemsBackup;
		console.log('itemsBackup dans PageOLD.svelte = ', itemsBackup);
	}

	/*
    $:{ 
        pageItems = pageItems;
        if (debugThis) console.log("▢ src/components/page/PageOLD.svelte ▶ \t●318\n\tpageItems = ", pageItems);


        items = pageItems;
        if (debugThis) console.log("▢ src/components/page/PageOLD.svelte ▶ \t●322\n\titems = ", items);

        if (itemsBackup === null && pageItems !== null && pageItems.length != 0)
            itemsBackup = structuredClone(pageItems);
			if (debugThis) console.log("▢ src/components/page/PageOLD.svelte ▶ \t●326\n\titemsBackup = ", itemsBackup);
    }

    $: {
        if (debugThis) console.log("▢ src/components/page/PageOLD.svelte ▶ \t●297\n\titemsBackup = ", itemsBackup);
    } */

	//*******FIN Gestion des Fenetres*********//
	//export let hiddenItems: Array<PageItem> = [];

	function hasDebug() {
		return pageItemsStore.hasItem('debug');
	}

	function toggleDebug() {
		if (!pageItemsStore.hasItem('debug')) {
			pageItemsStore.addItem({
				id: 'debug',
				name: 'Debug',
				x: 0,
				y: 0,
				w: 2,
				h: 3,
				movable: true,
				resizable: true,
				folded: false,
				headed: false,
				data: {
					text: '🐞🐞🐞🐞🐞🐞🐞'
				}
			} as PageItem);
		} else {
			pageItemsStore.removeItem('debug');
		}
	}
</script>

<!-- HEADER -->
<svelte:head>
	<title>{nomPage}</title>
	<meta name={description} />
</svelte:head>
<!-- FIN HEADER -->

<!-- Bloc des boutons -->

<div>
	<Button
		on:click={() => {
			pageItemsStore.resetToBackup();
		}}>Reset</Button
	>
	<Button on:click={openSaveDialog}>Save</Button>
	<Button on:click={openLoadDialog}>Load</Button>
	<Button
		on:click={() => {
			globalMovable = false;
			items?.forEach((element) => {
				swapMovable(element.id, globalMovable);
			});
		}}
		disabled={!globalMovable}
	>
		bloq all
	</Button>
	<Button
		on:click={() => {
			globalMovable = true;
			items?.forEach((element) => {
				//swapmovable(element.id, globalMovable);
				swapMovable(element.id, globalMovable);
			});
		}}
		disabled={globalMovable}
	>
		unbloq all
	</Button>
	<Button on:click={toggleDebug}>
		{#if hasDebug()}
			Hide Debug
		{:else}
			Show Debug
		{/if}
	</Button>
	<!-- <select on:change={(e) => showItem(e.target.value)} label="Ouvrir un élément caché">
		<option value="">Sélectionner un élément caché</option>
		{#each hiddenItems as item}
			<option value={item.id}>{item.name}</option>
		{/each}
	</select>-->
</div>

<!-- FIN Bloc des boutons -->

<!-- Bloc body -->

<Grid cols={0} rows={0} {itemSize} collision="push">
	<slot />
</Grid>

<!-- FIN Bloc body -->

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

<Snackbar bind:this={snackbarClipBoard}>
	<Label>{$snackbarMessage}</Label>
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
					on:contextmenu={(e) => handleRightClick(e, item.key)}
				>
					<Text>{item.key.toString().removeFirstOccurence(urlPathname + '_')}</Text>
				</LItem>
			{/each}
		</List>
	</Content>
</Dialog>

<!-- FIN DIALOGS -->

<style>
	:global(.move-handle),
	:global(.item) {
		padding: 8px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.move-handle) {
		background-color: #f0f0f0;
		cursor: grab;
		margin-bottom: 4px;
		position: relative; /* Positionne le moveHandle au-dessus des autres éléments */
		z-index: 2; /* Assure que le moveHandle reste au-dessus lors du déplacement */
	}

	:global(.move-handle:active) {
		background-color: #e0e0e0;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		cursor: grabbing;
	}

	:global(.item) {
		background-color: rgb(230, 212, 212);
		place-items: flex-start;
		width: 100%;
		height: 100%;
	}

	/* Ajoutez des styles pour décaler la carte ou d'autres éléments si nécessaire 
	.content-container > *:first-child:not(.move-handle) + .move-handle {
		margin-top: 50px; /* Ajustez cette valeur en fonction de l'espace souhaité 
	}*/

	/* Styles globaux et ajustements */
	:global(*) {
		box-sizing: border-box;
	}

	/* Classe qui ajoute une marge supérieure du montant de la hauteur du moveHandle */
	:global(.with-top-margin) {
	}

	:global(.mdc-text-field--disabled .mdc-text-field__input) {
		color: black !important;
	}
</style>

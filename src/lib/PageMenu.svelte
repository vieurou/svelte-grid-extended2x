<!-- src/lib/PageMenu.svelte-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	//extensions
	import '$extensions/string.extension.js';

	//SMUI Components
	import Snackbar, { Actions, Label } from '@smui/snackbar';
	import Button from '@smui/button';
	import Dialog, { Actions as DActions, Title, Content } from '@smui/dialog';
	import Textfield from '@smui/textfield';
	import Icon from '@smui/textfield/icon';
	import IconButton from '@smui/icon-button';
	import HelperText from '@smui/textfield/helper-text';
	import List, { Item as LItem, Text } from '@smui/list';

	import type { PageItem } from '$lib';
	import DebugItem from '$lib/DebugItem.svelte';

	//store
	import { pageItemsStore } from '$stores/pageItems.store';

	// Props
	export let debugThis: boolean = false;
	export let pageStore: any = null; // Nouveau prop pour le store spécifique
	export let pageId: string = ''; // Nouveau prop pour identifier l'onglet

	// Props pour les styles et classes CSS
	let classes: string | undefined = undefined;
	export { classes as class };
	export let style: string = '';

	// Utiliser le store fourni ou celui par défaut
	$: currentStore = pageStore || pageItemsStore;

	// Variables réactives du store
	$: storeData = $currentStore;
	$: collision = storeData?.collision || 'none';
	$: items = storeData?.pageItems || [];
	$: hiddenItems = storeData?.hiddenItems || [];
	$: globalMovable = items ? items.some((item: PageItem) => item.movable) : false;
	$: debugItemExist = currentStore.hasItem && currentStore.hasItem('_debug_items_');

	// Debug logs pour la réactivité
	$: if (debugThis) {
		console.log('🔄 PageMenu - storeData updated:', storeData);
		console.log('🔄 PageMenu - items updated:', items.map(item => ({ id: item.id, movable: item.movable })));
		console.log('🔄 PageMenu - globalMovable updated:', globalMovable);
	}

	// Variables internes pour les dispositions
	let dispos: Array<{ key: string; value: string | null }> | null = [];
	let urlPathname = '';

	// Dialog states
	let loadDialogOpen: boolean = false;
	let saveDialogOpen: boolean = false;
	let valueName: string = '';
	let configurationName: string = '';

	// Snackbar states
	let snackbarSuppDisposition: Snackbar;
	let snackbarInfo: Snackbar;
	let snackBarInfoMessage: string = '';
	let reason = 'nothing yet';
	let action = 'nothing yet';
	let rightClikedDispo: string = '';

	let showConf = false;

	// Fonctions pour récupérer les dispositions
	function getDispositions() {
		const keys = Object.keys(localStorage);
		let localStorageItems = keys.map((key) => ({
			key,
			value: localStorage.getItem(key)
		}));

		if (debugThis) console.log('localStorageItems : ', localStorageItems);
		// Filtrer par urlPathname ET pageId pour avoir des dispositions spécifiques à chaque onglet
		const keyPrefix = pageId ? `${urlPathname}_${pageId}` : urlPathname;
		if (debugThis) console.log('Recherche de dispositions avec prefix:', keyPrefix);
		return localStorageItems.filter((item) => item.key.startsWith(keyPrefix));
	}

	// Fonctions de gestion des dialogs
	function openLoadDialog() {
		console.log('openLoadDialog appelé');
		loadDialogOpen = true;
	}

	function openSaveDialog() {
		saveDialogOpen = true;
	}

	function loadGrid(name: string) {
		if (debugThis) console.log('loadGrid appelé');
		const localItems = localStorage.getItem(name);
		if (localItems) {
			currentStore.setItems(JSON.parse(localItems));
		}
	}

	function saveGrid(name: string) {
		if (debugThis) console.log('Sauvegarde de ', name, ' : ', items);
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
				configurationName = pageId ? `${urlPathname}_${pageId}_${valueName}` : `${urlPathname}_${valueName}`;
				saveGrid(configurationName);
				response = 'Disposition enregistrée sous le nom ' + configurationName + '.';
				break;
			default:
				response = 'Enregistrement de la disposition annulée.';
				break;
		}
		snackMessage(response);
	}

	// Gestion des actions du menu
	function resetGrid() {
		console.log('items dans resetGrid= ', items);
		currentStore.resetToBackup();
	}

	function toggleCollision() {
		if (collision === 'none') {
			currentStore.setCollision('compress');
		} else if (collision === 'compress') {
			currentStore.setCollision('push');
		} else {
			currentStore.setCollision('none');
		}
	}

	const id_debug = '_debug_items_';
	function toggleDebug() {
		if (!currentStore.hasItem || !currentStore.hasItem(id_debug)) {
			currentStore.addItem({
				id: id_debug,
				name: 'Debug',
				x: 16,
				y: 0,
				w: 3,
				h: 19,
				movable: true,
				resizable: true,
				folded: false,
				headed: false,
				visible: true,
				preComponentText: '🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞🐞',
				postComponentText: '☠☠☠☠☠☠☠☠☠☠☠☠',
				text: '😶😶😶😶😶😶😶',
				component: DebugItem,
				componentName: 'DebugItem',
				props: { items: items },
				invalidate: () => {}
			} as PageItem);
		} else {
			currentStore.removeItem(id_debug);
		}
	}

	function setVisibilityItem(id: string, value: boolean | null) {
		if (debugThis) console.log('setVisibilityItem id= ', id, ' value= ', value);
		const currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
		if (currentItem) {
			currentStore.updateItem(id, { ...currentItem, visible: value || false });
		}
		currentStore.removeItemFromHiddenItems(id);
	}

	// Gestion des clics droits pour suppression
	function handleRightClick(e: MouseEvent, itemKey: string) {
		console.log('rightCliked !!! ');
		e.preventDefault();
		rightClikedDispo = itemKey.toString().removeFirstOccurence(urlPathname + '_');
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

	// Gestion des messages
	function snackMessage(message: string) {
		snackBarInfoMessage = message;
		snackbarInfo.open();
	}

	// Mount
	onMount(() => {
		if (debugThis) console.log('PageMenu onMount appelé');
		urlPathname = $page.url?.pathname?.removeFirstChar();
		dispos = getDispositions();
		// Suppression du chargement automatique ici - c'est fait dans Page.svelte
		if (debugThis) console.log('dispositions enregistrées : ', dispos);
	});
</script>

<!-- Menu Principal -->
<div class="page-menu {classes || ''}" {style}>
	<IconButton
		class="material-icons"
		on:click={() => {
			showConf = !showConf;
		}}>settings</IconButton
	>

	{#if showConf}
		<Button on:click={resetGrid}>Réinitialiser</Button>
		<Button on:click={openSaveDialog}>Sauvegarder</Button>
		<Button on:click={openLoadDialog}>Charger</Button>
		<Button
			on:click={() => {
				console.log('Bouton swapAllMovable cliqué');
				console.log('globalMovable actuel:', globalMovable);
				console.log('items actuels:', items.map(item => ({ id: item.id, movable: item.movable })));
				console.log('currentStore:', currentStore);
				console.log('swapAllMovable function exists:', typeof currentStore.swapAllMovable);
				currentStore.swapAllMovable(!globalMovable);
			}}
		>
			{#if globalMovable}
				Bloquer tout
			{:else}
				Débloquer tout
			{/if}
		</Button>

		{#if globalMovable}
			<Button on:click={toggleCollision}>
				{collision}
			</Button>
		{/if}

		{#if debugThis}
			<Button on:click={toggleDebug}>
				{#if debugItemExist}
					Debug OFF
				{:else}
					Debug ON
				{/if}
			</Button>
		{/if}
	{/if}

	{#if hiddenItems && hiddenItems.length > 0}
		<select
			on:change={(e) => {
				// @ts-ignore
				const target = e.target;
				// @ts-ignore
				if (target && target.value) {
					// @ts-ignore
					setVisibilityItem(target.value, true);
					// @ts-ignore
					target.value = '';
				}
			}}
			aria-label="Ouvrir un élément caché"
		>
			<option value="">Ouvrir un élément caché</option>
			{#if hiddenItems && hiddenItems.length > 0}
				{#each hiddenItems as item}
					<option value={item.id}>{item.name}</option>
				{/each}
			{/if}
		</select>
	{/if}
</div>

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
	<Title id="list-title">
		Selectionnez la disposition <br />
		<legend style="font-size:50%;color:grey">clique droit pour supprimer</legend>
	</Title>
	<Content id="list-content">
		<List>
			{#each dispos || [] as item}
				<LItem
					on:click={() => {
						loadGrid(item.key);
						loadDialogOpen = false;
					}}
					on:contextmenu={(e) => {
						e.preventDefault();
						// @ts-ignore
						handleRightClick(e, item.key);
					}}
				>
					<Text>{item.key.toString().removeFirstOccurence(urlPathname + '_')}</Text>
				</LItem>
			{/each}
		</List>
	</Content>
</Dialog>

<style>
	.page-menu {
		padding: 8px 16px;
		border-bottom: 1px solid #e0e0e0;
		background-color: #f5f5f5;
	}
</style>

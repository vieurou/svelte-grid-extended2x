<!-- src/lib/Page.svelte-->

<script lang="ts">
	//config
	export let debugThis: boolean = false;
	$: console.log(
		`%c Page.svelte\n\t\tdebugThis =  ${debugThis}\n\t\tpageId = ${pageId}`,
		'background: #ab2458; color: #fff'
	);

	//sveltekit
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	//extensions
	import '$extensions/string.extension.js';

	//grid
	import { type PageItem } from '$lib';

	//Nouveaux composants
	import PageMenu from '$lib/PageMenu.svelte';
	import PageGrid from '$lib/PageGrid.svelte';

	//SMUI
	import Snackbar, { Label } from '@smui/snackbar';

	import { snackbarMessage } from '$stores/snackBar.store';
	import type { ComponentsMap } from '$lib';

	//chargement du store
	import { pageItemsStore } from '$stores/pageItems.store';
	import { multiPageItemsStore } from '$stores/multiPageItems.store';

	//export des parametres
	export let nomPage = 'pageTemplate';
	export let description = 'Description de la page';
	export let pageItems: Array<PageItem> = [];
	export let componentsMap: ComponentsMap = {};
	export let pageId: string = nomPage; // Nouvel identifiant unique pour chaque instance

	// Props pour les styles et classes CSS
	export let pageClass: string = '';
	export let pageStyle: string = 'background: transparent;';
	export let menuClass: string = '';
	export let menuStyle: string = 'background: transparent;';
	export let gridClass: string = '';
	export let gridStyle: string = 'background: transparent;';

	// Déclaration de la variable currentPageStore
	let currentPageStore;

	// Utilisation du store multi-instances
	$: {
		try {
			currentPageStore = multiPageItemsStore.getStore(pageId);
			console.log(`Store créé pour pageId: ${pageId}`);
		} catch (error) {
			console.error(`Erreur lors de la création du store pour pageId ${pageId}:`, error);
			currentPageStore = pageItemsStore; // Fallback sur le store par défaut
		}
	}

	let snackbarClipBoard: Snackbar;
	let _unsubscribe_snackbarMessage: () => void;

	// garder la fonction d'unsubscribe pour nettoyage dans onDestroy
	_unsubscribe_snackbarMessage = snackbarMessage.subscribe((message) => {
		if (message && snackbarClipBoard) {
			snackbarClipBoard.open();
		}
	});

	onDestroy(() => {
		if (typeof _unsubscribe_snackbarMessage === 'function') {
			_unsubscribe_snackbarMessage();
		}
	});

	// Suppression de l'initialisation ici - elle se fait maintenant dans onMount avant le chargement de disposition

	// Fonctions pour gérer les dispositions (comme dans PageOld)
	function getDispositions(urlPathname: string) {
		const keys = Object.keys(localStorage);
		let localStorageItems = keys.map((key) => ({
			key,
			value: localStorage.getItem(key)
		}));

		if (debugThis) console.log('localStorageItems : ', localStorageItems);
		// Filtrer par urlPathname ET pageId pour avoir des dispositions spécifiques à chaque onglet
		const keyPrefix = `${urlPathname}_${pageId}`;
		if (debugThis) console.log('Recherche de dispositions avec prefix:', keyPrefix);
		return localStorageItems.filter((item) => item.key.startsWith(keyPrefix));
	}

	function loadGrid(name: string) {
		if (debugThis) console.log('loadGrid appelé avec name:', name);
		if (debugThis) console.log('currentPageStore available in loadGrid:', !!currentPageStore);
		const localItems = localStorage.getItem(name);
		if (localItems) {
			if (debugThis) console.log('Items trouvés dans localStorage:', JSON.parse(localItems));
			currentPageStore.setItems(JSON.parse(localItems));
			if (debugThis) console.log('Items chargés dans le store');
		} else {
			if (debugThis) console.log('Aucun item trouvé dans localStorage pour:', name);
		}
	}

	//au démarrage on initialise les items et charge une disposition si disponible
	onMount(() => {
		if (debugThis) console.log('Page onMount appelé');
		if (debugThis) console.log('currentPageStore available:', !!currentPageStore);
		if (debugThis) console.log('pageId:', pageId);

		// 1. Initialiser avec les items par défaut (les hauteurs seront ajustées individuellement par les composants)
		currentPageStore.setInitialItems(pageItems);
		console.log(`Items initialisés pour pageId: ${pageId}, nombre d'items: ${pageItems.length}`);

		// 2. Ensuite essayer de charger une disposition sauvegardée (qui va écraser les items par défaut)
		const urlPathname = $page.url.pathname.removeFirstChar();
		if (debugThis) console.log('urlPathname for dispositions:', urlPathname);
		const dispos = getDispositions(urlPathname);
		if (dispos.length > 0) {
			if (debugThis) console.log('Disposition trouvée pour pageId', pageId, ':', dispos[0].key);
			loadGrid(dispos[0].key);
			if (debugThis) console.log('Disposition chargée automatiquement:', dispos[0].key);
		} else {
			if (debugThis)
				console.log('Aucune disposition trouvée pour:', urlPathname, 'avec pageId:', pageId);
		}
		if (debugThis) console.log('dispositions enregistrées : ', dispos);
	});
</script>

<!-- HEADER -->
<svelte:head>
	<title>{nomPage}</title>
	<meta name={description} />
</svelte:head>
<!-- FIN HEADER -->

<div class="page-wrapper {pageClass}" style={pageStyle}>
	<PageMenu {debugThis} class={menuClass} style={menuStyle} pageStore={currentPageStore} {pageId} />

	<PageGrid
		{componentsMap}
		{debugThis}
		class={gridClass}
		style={gridStyle}
		pageStore={currentPageStore}
		let:item
	>
		<slot {item} />
	</PageGrid>
</div>

<Snackbar bind:this={snackbarClipBoard}>
	<Label>{$snackbarMessage}</Label>
</Snackbar>

<style>
	.page-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		width: 100%;
	}
</style>

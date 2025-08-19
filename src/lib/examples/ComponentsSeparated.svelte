<!-- src/lib/examples/ComponentsSeparated.svelte -->
<!-- Exemple d'utilisation des composants séparés PageMenu et PageGrid -->

<script lang="ts">
	import { PageMenu, PageGrid, type PageItem, type ComponentsMap } from '$lib';
	import { pageItemsStore } from '$stores/pageItems.store';
	
	// Exemple de composants
	import ShowHelloWorld from '$lib/examples/components/showHelloWorld.svelte';
	import ShowByeByeWorld from '$lib/examples/components/showByeByeWorld.svelte';

	// Configuration
	export let debugThis: boolean = false;
	export let nomPage = 'Exemple Composants Séparés';
	export let description = 'Démonstration de PageMenu et PageGrid séparés';

	// Map des composants disponibles
	const componentsMap: ComponentsMap = {
		'ShowHelloWorld': ShowHelloWorld,
		'ShowByeByeWorld': ShowByeByeWorld
	};

	// Items d'exemple
	const pageItems: Array<PageItem> = [
		{
			id: 'item1',
			name: 'Hello World',
			x: 0,
			y: 0,
			w: 4,
			h: 3,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			componentName: 'ShowHelloWorld',
			text: 'Premier élément'
		},
		{
			id: 'item2',
			name: 'Bye Bye World',
			x: 4,
			y: 0,
			w: 4,
			h: 3,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			componentName: 'ShowByeByeWorld',
			text: 'Deuxième élément'
		}
	];

	// Variables réactives
	let items: Array<PageItem> | null = null;
	let itemsBackup: Array<PageItem> | null = null;
	let hiddenItems: Array<PageItem> | null = null;
	let globalMovable = false;
	let debugItemExist = false;
	let collision: 'none' | 'compress' | 'push' = 'compress';

	// Référence au PageMenu
	let pageMenuRef: PageMenu;

	// Réactivité
	$: {
		const seen = new Set();
		items = $pageItemsStore.pageItems.filter((item: PageItem) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		});
		globalMovable = items ? items.some((item) => item.movable) : false;
	}

	$: itemsBackup = $pageItemsStore.itemsBackup;
	$: hiddenItems = $pageItemsStore.hiddenItems;
	$: pageItemsStore.setInitialItems(pageItems);

	// Gestionnaires d'événements
	function handleLoadGrid(event: CustomEvent<{ items: Array<PageItem> }>) {
		const { items: loadedItems } = event.detail;
		pageItemsStore.setItems(loadedItems);
	}

	function handleSaveGrid(event: CustomEvent<{ name: string }>) {
		const { name } = event.detail;
		if (pageMenuRef && items) {
			pageMenuRef.saveGridData(items);
		}
	}

	function handleResetGrid() {
		pageItemsStore.resetToBackup();
		globalMovable = false;
	}

	function handleToggleMovable() {
		globalMovable = !globalMovable;
		pageItemsStore.swapAllMovable(globalMovable);
	}

	function handleToggleCollision() {
		if (collision === 'none') {
			collision = 'compress';
		} else if (collision === 'compress') {
			collision = 'push';
		} else {
			collision = 'none';
		}
	}

	const id_debug = '_debug_items_';
	function handleToggleDebug() {
		if (!pageItemsStore.hasItem(id_debug)) {
			pageItemsStore.addItem({
				id: id_debug,
				name: 'Debug',
				x: 8,
				y: 0,
				w: 3,
				h: 6,
				movable: true,
				resizable: true,
				folded: false,
				headed: true,
				visible: true,
				text: 'Mode Debug activé',
				componentName: 'DebugItem'
			});
			debugItemExist = true;
		} else {
			pageItemsStore.removeItem(id_debug);
			debugItemExist = false;
		}
	}

	function handleSetVisibility(event: CustomEvent<{ id: string; value: boolean }>) {
		const { id, value } = event.detail;
		const currentItem = items?.find(item => item.id === id);
		if (currentItem) {
			pageItemsStore.updateItem({ ...currentItem, visible: value });
		}
		pageItemsStore.removeItemFromHiddenItems(id);
	}
</script>

<svelte:head>
	<title>{nomPage}</title>
	<meta name={description} />
</svelte:head>

<div class="page-container">
	<div class="header">
		<h1>{nomPage}</h1>
		<p>{description}</p>
	</div>

	<!-- Menu séparé -->
	<div class="menu-container">
		<PageMenu
			bind:this={pageMenuRef}
			{debugThis}
			{collision}
			{globalMovable}
			{debugItemExist}
			{hiddenItems}
			on:load-grid={handleLoadGrid}
			on:save-grid={handleSaveGrid}
			on:reset-grid={handleResetGrid}
			on:toggle-movable={handleToggleMovable}
			on:toggle-collision={handleToggleCollision}
			on:toggle-debug={handleToggleDebug}
			on:set-visibility={handleSetVisibility}
		/>
	</div>

	<!-- Grille séparée -->
	<div class="grid-container">
		<PageGrid
			{items}
			{collision}
			{componentsMap}
			{debugThis}
		>
			<div slot="default" let:item class="custom-item">
				<h3>{item.name}</h3>
				<p>Item ID: {item.id}</p>
			</div>
		</PageGrid>
	</div>
</div>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.header {
		padding: 1rem;
		background-color: #f5f5f5;
		border-bottom: 1px solid #ddd;
	}

	.header h1 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.header p {
		margin: 0;
		color: #666;
		font-size: 0.9rem;
	}

	.menu-container {
		padding: 1rem;
		background-color: #fafafa;
		border-bottom: 1px solid #eee;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.grid-container {
		flex: 1;
		overflow: hidden;
	}

	.custom-item {
		padding: 0.5rem;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 4px;
		margin: 0.25rem;
	}

	.custom-item h3 {
		margin: 0 0 0.25rem 0;
		font-size: 0.9rem;
		color: #333;
	}

	.custom-item p {
		margin: 0;
		font-size: 0.8rem;
		color: #666;
	}
</style>

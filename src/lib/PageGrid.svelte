<!-- src/lib/PageGrid.svelte-->

<script lang="ts">
	//grid
	import Grid, { type PageItem, PageGridItem } from '$lib';

	//composant DebugItem
	import DebugItem from '$lib/DebugItem.svelte';
	import _404_ from '$lib/_404_.svelte';
	import type { ComponentsMap } from '$lib';

	//store
	import { pageItemsStore } from '$stores/pageItems.store';

	// Props
	export let componentsMap: ComponentsMap = {};
	export let debugThis: boolean = false;
	export let pageStore: any = null; // Nouveau prop pour le store spécifique
	
	// Props pour les styles et classes CSS
	let classes: string | undefined = undefined;
	export { classes as class };
	export let style: string = '';

	// Utiliser le store fourni ou celui par défaut
	$: currentStore = pageStore || pageItemsStore;

	// Variables réactives du store
	$: collision = $currentStore.collision || 'none';

	const itemSize = { width: 100, height: 100 };
	const id_debug = '_debug_items_';
	const excludeIds = [id_debug];

	// Variables réactives du store
	let items: Array<PageItem> = [];

	// Reactive assignment comme dans Page copy.svelte
	$: {
		// On filtre les doublons d'id pour éviter les erreurs Svelte
		const seen = new Set();
		items = ($currentStore.pageItems || []).filter((item: PageItem) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		});
		
		// Debug log pour voir les changements d'items
		if (debugThis) {
			console.log('🎯 PageGrid - Items updated:', items.map(item => ({ 
				id: item.id, 
				movable: item.movable, 
				x: item.x, 
				y: item.y 
			})));
		}
	}

	// Réassigner les composants après le chargement
	$: {
		if (items && items.length > 0) {
			const idCounts: Record<string, number> = items.reduce((acc, item: PageItem) => {
				acc[item.id] = (acc[item.id] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

			const duplicateIds = Object.entries(idCounts)
				.filter(([id, count]) => (count as number) > 1)
				.map(([id]) => id);

			if (duplicateIds.length > 0) {
				console.error(`Duplicate IDs found: ${duplicateIds.join(', ')}`);
			}
			items.forEach((item) => {
				if (item.componentName) {
					(item as any).component = componentsMap[item.componentName] || _404_;
					if (!componentsMap[item.componentName])
						console.warn(`composant ${item.componentName} non trouvé dans la map de composants.`);
				} else {
					(item as any).component = null;
				}
			});
		}
	}

	// Debug
	$: {
		if (debugThis) {
			console.log('items dans PageGrid mis à jour= ', items);
		}
	}

	// Debug: ajouter des logs pour voir si les changements sont détectés
	let previousItems: any = {};
	$: {
		if (items) {
			items.forEach((item: any) => {
				const key = item.id;
				const current = `${item.x},${item.y},${item.w},${item.h}`;
				if (previousItems[key] && previousItems[key] !== current) {
					if (debugThis) {
						console.log(`PageGrid: Item ${item.id} position/size changed:`, { x: item.x, y: item.y, w: item.w, h: item.h });
					}
					currentStore.updateItem(item.id, item);
				}
				previousItems[key] = current;
			});
		}
	}

	// Fonction pour gérer les changements d'item
	function handleItemChange(event: CustomEvent) {
		const changedItem = event.detail.item;
		if (debugThis) {
			console.log('PageGrid: Item change event received:', changedItem);
		}
		// Mettre à jour le store quand l'item change
		currentStore.updateItem(changedItem.id, changedItem);
	}
</script>

<!-- Bloc body -->
<div class="grid-viewport-wrapper {classes || ''}" data-collision={collision} {style}>
	<Grid cols={0} rows={0} {itemSize} {collision}>
		<div class="content-container">
			{#each items || [] as item, i (item.id)}
				<PageGridItem
					bind:id={item.id}
					bind:name={item.name}
					bind:x={item.x}
					bind:y={item.y}
					bind:w={item.w}
					bind:h={item.h}
					bind:movable={item.movable}
					bind:resizable={item.resizable}
					bind:folded={item.folded}
					bind:headed={item.headed}
					bind:visible={item.visible}
					bind:cssClass={item.cssClass}
					bind:cssStyle={item.cssStyle}
					bind:nfh={item.nfh}
					bind:nfw={item.nfw}
					pageStore={currentStore}
					on:change={handleItemChange}
					{debugThis}
				>
					<div class="item">
						{#if item.preComponentText}
							{@html item.preComponentText}
						{/if}

						<slot {item} />
						{#if item.id === id_debug}
							<DebugItem bind:items {excludeIds} />
						{/if}
						{#if item.componentName}
							<svelte:component this={componentsMap[item.componentName] || _404_} {...item.props || {}} />
						{:else if item.text}
							{@html item.text}
						{/if}

						{#if item.postComponentText}
							{@html item.postComponentText}
						{/if}
					</div>
				</PageGridItem>
			{/each}
		</div>
	</Grid>
</div>

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
		position: relative;
		z-index: 2;
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

	/* Styles globaux et ajustements */
	:global(*) {
		box-sizing: border-box;
	}

	/* Conteneur principal de la grille pour éviter les doubles ascenseurs */
	.grid-viewport-wrapper {
		min-height: calc(100vh - 50px);
		overflow: visible;
		position: relative;
	}

	/* Styles spécifiques selon le type de collision */
	:global(.grid-viewport-wrapper[data-collision='compress']) {
		height: calc(100vh - 50px);
		overflow-y: auto;
		overflow-x: auto;
		min-height: unset;
	}

	:global(.grid-viewport-wrapper[data-collision='push']) {
		height: calc(100vh - 50px);
		overflow-y: auto;
		overflow-x: auto;
		min-height: unset;
	}

	:global(.with-top-margin) {
		margin-top: 40px;
	}

	:global(.mdc-text-field--disabled .mdc-text-field__input) {
		color: black !important;
	}
</style>

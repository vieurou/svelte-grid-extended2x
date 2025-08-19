<!-- src/lib/PageGridItem.svelte -->

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	import {
		coordinate2size,
		calcPosition,
		snapOnMove,
		snapOnResize,
		type SnapGridParams
	} from './utils/item';
	import { hasCollisions, getCollisions, getAvailablePosition } from './utils/grid';
	import {
		getEffectiveHeight,
		getEffectiveItem,
		isItemFolded,
		hasVisibleHeader,
		getOptimalFoldedHeight
	} from './utils/pageItem';

	import type { LayoutItem, LayoutChangeDetail, Size, ItemSize } from './types';
	import { getGridContext } from './Grid.svelte';

	import IconButton from '@smui/icon-button';

	import PageItem from '$lib';

	import { pageItemsStore } from '$stores/pageItems.store';

	const dispatch = createEventDispatcher<{
		change: LayoutChangeDetail;
		previewchange: LayoutChangeDetail;
	}>();

	let gridParams = getGridContext();

	// évite que la chaîne 'undefined' apparaisse dans l'attribut class
	let classes: string = '';

	export { classes as class };

	export let debugThis: boolean = false;

	// Nouveau prop pour le store spécifique
	export let pageStore: any = null;

	// Utiliser le store fourni ou celui par défaut
	$: currentStore = pageStore || pageItemsStore;

	/**
	 * Unique identifier of the item. Used to identify the item in collision checks.
	 * @default uuidv4
	 *
	 * TODO: crypto.randomUUID() is not supported in non ssl environments
	 */

	//modif pour utilisation sur tous navigateur et en http
	//export let id = crypto.randomUUID();

	// Générateur de UUID v4 comme fallback
	function generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (Math.random() * 16) | 0,
				v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	// Exporte `id` en utilisant `crypto.randomUUID` si disponible, sinon utilise `generateUUID` comme fallback
	export let id = crypto.randomUUID ? crypto.randomUUID() : generateUUID();

	export let activeClass: string | undefined = undefined;

	export let previewClass: string | undefined = undefined;

	export let resizerClass: string | undefined = undefined;

	export let x: number;

	export let y: number;

	export let w = 1;

	export let h = 1;

	export let name = 'Item ' + id;

	/**
	 * Minimum size of the item in Grid Units.
	 */
	export let min: Size = { w: 1, h: 1 };

	/**
	 * Maximum size of the item in Grid Units.
	 * If not provided, the item will be able to grow infinitely.
	 */
	export let max: Size | undefined = undefined;

	export let movable = true;

	export let resizable = true;

	export let folded = false;

	export let nfh: number | undefined = w;

	export let nfw: number | undefined = h;

	export let headed = false;

	export let data: unknown = undefined;

	export let cssClass: string | undefined = undefined;

	export let cssStyle: string | undefined = undefined;

	export let visible: boolean;

	$: visible = $currentStore.pageItems.find((item: any) => item.id === id)?.visible;

	$: _currentItem = $currentStore.pageItems.find((item: any) => item.id === id);

	// Synchroniser movable avec le store
	$: movable = _currentItem?.movable ?? movable;

	// Synchroniser h avec le store (important pour les items repliés)
	$: h = _currentItem?.h ?? h;

	let active = false;

	let left: number;

	let top: number;

	let width: number;

	let height: number;

	/**
	 * Objet item utilisé dans `$gridParams.items`.
	 * Lorsque l'élément est monté, il est enregistré dans `$gridParams.items`.
	 * Par défaut, toutes les props sont synchronisées avec l'objet item.
	 * Si la référence de l'élément est utilisée pour modifier sa taille ou sa position, la méthode invalidate doit être appelée.
	 * Cela permet de supporter la liaison bidirectionnelle des props de l'élément.
	 * @see {invalidate}
	 * @example
	 * ```
	 * item.x = 10;
	 * item.invalidate();
	 * ```
	 * @example
	 * ```
	 * item.x = 10;
	 * item.y = 10;
	 * item.w = 2;
	 * item.h = 2;
	 * item.invalidate();
	 * ```
	 */
	/*let item = {
		id,
		x,
		y,
		w,
		h,
		min,
		max,
		movable,
		resizable,
		invalidate
	} as LayoutItem;*/

	let item: any = {
		id,
		x,
		y,
		w,
		h,
		min,
		max,
		movable,
		resizable,
		name: '',
		folded: false,
		nfw,
		nfh,
		headed: false,
		data: {},
		cssClass: '',
		cssStyle: '',
		visible: true,
		invalidate
	};

	$: item.x = x;
	$: item.y = y;
	$: item.w = w;
	$: item.h = h;
	$: item.min = min;
	$: item.max = max;
	$: item.hidden = !visible; // Synchroniser l'état masqué avec la visibilité

	$: item.movable = movable;
	$: item.resizable = resizable;
	$: item.name = name;
	$: item.folded = folded;
	$: item.nfw = nfw;
	$: item.nfh = nfh;
	$: item.headed = headed;
	$: item.data = data;
	$: item.cssClass = cssClass;
	$: item.cssStyle = cssStyle;
	$: item.visible = visible;

	$: (item, invalidate());

	/**
	 * Updates svelte-components props behind that item. Should be called when the item
	 * changes its size or position by manipulation with item object.
	 */
	function invalidate() {
		({ x, y, w, h } = item);
		dispatch('change', { item });
		$gridParams.dispatch('change', { item });
		$gridParams.updateGrid();
	}

	onMount(() => {
		$gridParams.registerItem(item);

		// Corriger la hauteur si l'item est initialement replié avec une hauteur incorrecte
		const currentItem = $currentStore.pageItems.find((storeItem: any) => storeItem.id === id);
		if (currentItem && currentItem.folded) {
			const optimalHeight = getOptimalFoldedHeight(currentItem, $gridParams.itemSize);
			if (Math.abs(currentItem.h - optimalHeight) > 0.1) {
				// L'item replié a une hauteur incorrecte, la corriger
				const correctedItem = {
					...currentItem,
					nfh: currentItem.nfh || currentItem.h, // Sauvegarder la hauteur actuelle comme hauteur originale
					h: optimalHeight
				};
				currentStore.updateItem(id, correctedItem);

				if (debugThis) {
					console.log(
						`[onMount] Item replié ${id} corrigé: hauteur ${currentItem.h} -> ${optimalHeight}, nfh = ${correctedItem.nfh}`
					);
				}
			}
		}

		return () => {
			$gridParams.unregisterItem(item);
		};
	});

	// reposition item on grid change
	$: if (!active && $gridParams.itemSize) {
		const newPosition = calcPosition(item, {
			itemSize: $gridParams.itemSize,
			gap: $gridParams.gap
		});
		left = newPosition.left;
		top = newPosition.top;
		width = newPosition.width;
		height = newPosition.height;
	}

	$: previewItem = { ...item };

	$: if (!active && item) {
		previewItem = item;
	}

	$: (previewItem, dispatch('previewchange', { item: previewItem }));

	function applyPreview() {
		item.x = previewItem.x;
		item.y = previewItem.y;
		item.w = previewItem.w;
		item.h = previewItem.h;
		item.invalidate();
	}

	function scroll(): void {
		// TODO: scroll
	}

	// INTERACTION LOGIC

	let itemRef: HTMLElement;
	let headerRef: HTMLElement; // Référence pour mesurer la hauteur du header
	let iconRef: HTMLElement; // Référence pour mesurer la largeur de l'icon-container

	const initialPointerPosition = { left: 0, top: 0 };

	function initInteraction(event: PointerEvent) {
		active = true;
		initialPointerPosition.left = event.pageX;
		initialPointerPosition.top = event.pageY;
		itemRef.setPointerCapture(event.pointerId);
	}

	function endInteraction(event: PointerEvent) {
		applyPreview();
		active = false;
		initialPointerPosition.left = 0;
		initialPointerPosition.top = 0;
		itemRef.releasePointerCapture(event.pointerId);
		$gridParams.updateGrid();
	}

	// MOVE ITEM LOGIC

	let initialPosition = { left: 0, top: 0 };

	$: _movable = !$gridParams.readOnly && _currentItem?.movable;

	// Debug log pour voir la valeur de _movable
	$: if (debugThis) {
		console.log(`${name || id} : visible = ${visible}`);
		console.log(`${name || id} : _currentItem =`, _currentItem);
		console.log(`${name || id} : _currentItem?.movable =`, _currentItem?.movable);
		console.log(`${name || id} : _movable =`, _movable);
	}

	let pointerShift = { left: 0, top: 0 };

	function moveStart(event: PointerEvent) {
		if (event.button !== 0) return;
		event.stopPropagation();
		initInteraction(event);
		initialPosition = { left, top };
		pointerShift = { left: event.pageX - left, top: event.pageY - top };
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', moveEnd);
	}

	function move(event: PointerEvent) {
		if (!$gridParams.itemSize) {
			throw new Error('Grid is not mounted yet');
		}
		let _left = event.pageX - initialPointerPosition.left + initialPosition.left;
		let _top = event.pageY - initialPointerPosition.top + initialPosition.top;

		if ($gridParams.bounds && $gridParams.boundsTo) {
			const parentRect = $gridParams.boundsTo.getBoundingClientRect();
			if (_left < parentRect.left) {
				_left = parentRect.left;
			}
			if (_top < parentRect.top) {
				_top = parentRect.top;
			}
			if (_left + width > parentRect.right) {
				_left = parentRect.right - width;
			}
			if (_top + height > parentRect.bottom) {
				_top = parentRect.bottom - height;
			}
		}

		left = _left;
		top = _top;

		if ($gridParams.collision === 'none') {
			scroll();
		}

		// TODO: throttle this, hasColisions is expensive
		{
			const { x, y } = snapOnMove(left, top, previewItem, $gridParams as SnapGridParams);

			if ($gridParams.collision !== 'none') {
				movePreviewWithCollisions(x, y);
			} else {
				if (!hasCollisions({ ...previewItem, x, y }, Object.values($gridParams.items))) {
					previewItem = { ...previewItem, x, y };
				}
			}
		}
	}

	function updateCollItemPositionWithPush(collItem: LayoutItem, items: LayoutItem[]) {
		const newPosition = getAvailablePosition(
			collItem,
			items,
			$gridParams.maxCols,
			$gridParams.maxRows
		);
		if (newPosition) {
			const { x, y } = newPosition;
			collItem.x = x;
			collItem.y = y;
			collItem.invalidate();
		}
		$gridParams.updateGrid();
	}

	function handleCollisionsForPreviewItemWithPush(newAttributes: {
		x?: number;
		y?: number;
		w?: number;
		h?: number;
	}) {
		const gridItems = Object.values($gridParams.items);
		const itemsExceptPreview = gridItems.filter((item) => item.id != previewItem.id);
		const collItems = getCollisions({ ...previewItem, ...newAttributes }, itemsExceptPreview);

		collItems.forEach((collItem: LayoutItem) => {
			const itemsExceptCollItem = gridItems.filter((item) => item.id != collItem.id);
			const items = [
				...itemsExceptCollItem.filter((item) => item.id != previewItem.id),
				{ ...previewItem, ...newAttributes }
			];
			updateCollItemPositionWithPush(collItem, items);
		});

		previewItem = { ...previewItem, ...newAttributes };
		$gridParams.updateGrid();
		applyPreview();
	}

	function movePreviewWithCollisionsWithPush(x: number, y: number) {
		handleCollisionsForPreviewItemWithPush({ x, y });
	}

	function movePreviewWithCollisionsWithCompress(x: number, y: number) {
		const gridItems = Object.values($gridParams.items);
		let newY = y;
		const itemsExceptPreview = gridItems.filter((item) => item.id != previewItem.id);
		while (newY >= 0) {
			const collItems = getCollisions({ ...previewItem, x, y: newY }, gridItems);
			if (collItems.length > 0) {
				const sortedItems = collItems.sort((a, b) => b.y - a.y);
				let moved = false;
				sortedItems.forEach((sortItem) => {
					//if you want to fix sensitivity of grid, change this statement
					if (y + previewItem.h / 2 >= sortItem.y + sortItem.h / 2) {
						moved = true;
						newY = sortItem.y + sortItem.h;
						sortedItems.forEach((item) => {
							if (
								!hasCollisions({ ...item, y: item.y - previewItem.h }, itemsExceptPreview) &&
								item.y - previewItem.h >= 0
							) {
								item.y -= previewItem.h;
								item.invalidate();
							}
						});
						return false;
					}
				});
				if (!moved) {
					newY = previewItem.y;
				}
				break;
			}
			newY--;
		}
		if (newY < 0 || y === 0) {
			newY = 0;
		}
		const positionChanged = x != previewItem.x || newY != previewItem.y;
		previewItem = { ...previewItem, x, y: newY };
		if (positionChanged) {
			compressItems();
			applyPreview();
		}
	}

	function movePreviewWithCollisions(x: number, y: number) {
		if ($gridParams.collision === 'compress') {
			movePreviewWithCollisionsWithCompress(x, y);
		} else {
			movePreviewWithCollisionsWithPush(x, y);
		}
	}

	function moveEnd(event: PointerEvent) {
		if (event.button !== 0) return;
		endInteraction(event);
		pointerShift = { left: 0, top: 0 };
		window.removeEventListener('pointermove', move);
		window.removeEventListener('pointerup', moveEnd);
	}

	// RESIZE ITEM LOGIC

	let initialSize = { width: 0, height: 0 };

	let minSize: ItemSize | undefined;

	let maxSize: ItemSize | undefined;

	function updateMinSize() {
		if ($gridParams.itemSize) {
			const baseMinWidth = coordinate2size(min.w, $gridParams.itemSize.width, $gridParams.gap);
			const iconPixels = iconRef ? iconRef.offsetWidth : 0;
			const iconMin = iconPixels + 10; // exigence : icônes + 10px
			minSize = {
				width: Math.max(baseMinWidth, iconMin),
				height: coordinate2size(min.h, $gridParams.itemSize.height, $gridParams.gap)
			};
		}
	}

	// Recalcule automatiquement dès que itemSize ou iconRef change
	$: updateMinSize();

	$: if ($gridParams.itemSize && max) {
		maxSize = {
			width: coordinate2size(max.w, $gridParams.itemSize.width, $gridParams.gap),
			height: coordinate2size(max.h, $gridParams.itemSize.height, $gridParams.gap)
		};
	}

	$: _resizable = !$gridParams.readOnly && item.resizable;

	function resizeStart(event: PointerEvent) {
		if (event.button !== 0) return;
		event.stopPropagation();
		initInteraction(event);
		initialSize = { width, height };
		window.addEventListener('pointermove', resize);
		window.addEventListener('pointerup', resizeEnd);
	}

	function resize(event: PointerEvent) {
		if (!$gridParams.itemSize) {
			throw new Error('Grid is not mounted yet');
		}

		width = event.pageX + initialSize.width - initialPointerPosition.left;
		height = event.pageY + initialSize.height - initialPointerPosition.top;

		if ($gridParams.bounds && $gridParams.boundsTo) {
			const parentRect = $gridParams.boundsTo.getBoundingClientRect();
			if (width + left > parentRect.width) {
				width = parentRect.width - left;
			}
			if (height + top > parentRect.height) {
				height = parentRect.height - top;
			}
		}

		if (minSize) {
			width = Math.max(width, minSize.width);
			height = Math.max(height, minSize.height);
		}
		if (maxSize) {
			width = Math.min(width, maxSize.width);
			height = Math.min(height, maxSize.height);
		}

		if ($gridParams.collision === 'none') {
			scroll;
		}

		// TODO: throttle this, hasColisions is expensive
		{
			const { w, h } = snapOnResize(width, height, previewItem, $gridParams as SnapGridParams);
			if ($gridParams.collision !== 'none') {
				resizePreviewWithCollisions(w, h);
			} else {
				if (!hasCollisions({ ...previewItem, w, h }, Object.values($gridParams.items))) {
					previewItem = { ...previewItem, w, h };
				}
			}
		}
	}

	function resizePreviewWithCollisionsWithPush(w: number, h: number) {
		handleCollisionsForPreviewItemWithPush({ w, h });
	}

	function resizePreviewWithCollisionsWithCompress(w: number, h: number) {
		const sizeChanged = w != previewItem.w || h != previewItem.h;
		if (sizeChanged) {
			const hGap = h - previewItem.h;
			previewItem = { ...previewItem, w, h };
			applyPreview();
			const collItems = getCollisions(
				{ ...previewItem, w, h: 9999 },
				Object.values($gridParams.items)
			);
			collItems.forEach((item) => {
				item.y += hGap;
				item.invalidate();
				$gridParams.updateGrid();
			});
			compressItems();
		}
	}

	function resizePreviewWithCollisions(w: number, h: number) {
		if ($gridParams.collision === 'compress') {
			resizePreviewWithCollisionsWithCompress(w, h);
		} else {
			resizePreviewWithCollisionsWithPush(w, h);
		}
	}

	function resizeEnd(event: PointerEvent) {
		if (event.button !== 0) return;
		endInteraction(event);
		window.removeEventListener('pointermove', resize);
		window.removeEventListener('pointerup', resizeEnd);
	}

	function compressItems() {
		const gridItems = Object.values($gridParams.items);
		const sortedItems = [...gridItems].sort((a, b) => a.y - b.y);
		sortedItems.reduce(
			(accItem, currentItem) => {
				if (currentItem.id === previewItem.id) {
					//if previewItem do nothing
				} else if (previewItem.y < currentItem.y + currentItem.h) {
					//compress items above previewItem
					const maxY =
						currentItem.y >= previewItem.y
							? currentItem.y + previewItem.h + 1
							: previewItem.y + currentItem.h + 1;
					let newY = maxY;
					while (newY >= 0) {
						if (hasCollisions({ ...currentItem, y: newY }, accItem)) {
							break;
						}
						newY--;
					}
					currentItem.y = newY + 1;
					currentItem.invalidate();
					$gridParams.updateGrid();
					accItem.push(currentItem);
				} else {
					//compress items below previewItem
					let newY = currentItem.y;
					while (newY >= 0) {
						if (hasCollisions({ ...currentItem, y: newY }, accItem)) {
							break;
						}
						newY--;
					}
					if (newY < currentItem.y && newY > 0) {
						currentItem.y = newY + 1;
					}
					currentItem.invalidate();
					$gridParams.updateGrid();
					accItem.push(currentItem);
				}
				return accItem;
			},
			[previewItem]
		);
	}

	$: if (debugThis) console.log(`${name} : visible =`, visible);

	function toggleVisibility() {
		const newVisibility = !visible;
		if (debugThis) console.log(`${id} : toggleVisibility visible =`, newVisibility);

		if (!newVisibility) {
			currentStore.addItemToHiddenItems(id);
		} else {
			currentStore.removeItemFromHiddenItems(id);
		}

		const currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
		if (currentItem) {
			currentStore.updateItem(id, { ...currentItem, visible: newVisibility });
		}
	}

	function toggleFolded() {
		const currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
		if (currentItem) {
			const newFoldedState = !currentItem.folded;

			console.group(`[toggleFolded] Item ${id}: ${currentItem.folded ? 'Déplier' : 'Replier'}`);

			let updatedItem;

			if (newFoldedState) {
				// REPLIER : sauvegarder la hauteur actuelle et calculer la hauteur du header
				const headerHeight = getOptimalFoldedHeight(currentItem, $gridParams.itemSize);
				updatedItem = {
					...currentItem,
					folded: true,
					nfh: currentItem.nfh || currentItem.h, // Sauvegarder la hauteur originale si pas déjà fait
					h: headerHeight
				};
				console.log(
					`[toggleFolded] REPLIER - Item ${id}: hauteur ${currentItem.h} -> ${headerHeight}, nfh sauvegardé: ${updatedItem.nfh}`
				);
			} else {
				// DÉPLIER : restaurer la hauteur sauvegardée
				const originalHeight = currentItem.nfh || currentItem.h;
				updatedItem = {
					...currentItem,
					folded: false,
					h: originalHeight
				};
				console.log(
					`[toggleFolded] DÉPLIER - Item ${id}: hauteur ${currentItem.h} -> ${originalHeight}, nfh utilisé: ${currentItem.nfh}`
				);
			}

			// Mettre à jour l'item dans le store
			currentStore.updateItem(id, updatedItem);

			console.log(
				`[toggleFolded] Item ${id} ${newFoldedState ? 'replié' : 'déplié'} avec hauteur ${updatedItem.h}`
			);
			console.groupEnd();

			// Juste forcer la mise à jour de la grille pour gérer les collisions
			// La compression automatique se fera via GridController si nécessaire
			setTimeout(() => $gridParams.updateGrid(), 50);
		}
	}

	function toggleMovable() {
		// Pour l'instant, cette méthode n'existe pas dans le store multi-instances
		// currentStore.swapMovable(id);
		const currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
		if (currentItem) {
			currentStore.updateItem(id, { ...currentItem, movable: !currentItem.movable });
		}
	}

	/**
	 * Synchronise la hauteur CSS du header avec la hauteur réelle
	 */
	function syncHeaderHeight() {
		if (itemRef) {
			const headerHeight = headerRef ? headerRef.offsetHeight : 0;
			itemRef.style.setProperty('--header-height', `${headerHeight}px`);

			if (debugThis) {
				console.log(`[syncHeaderHeight] Item ${id} header height set to: ${headerHeight}px`);
			}
		}
	}

	// Mettre à jour la variable CSS --header-height à chaque changement des refs
	$: if (itemRef) {
		// Appel direct pour maintenir la hauteur à 0 quand header n'est pas rendu
		syncHeaderHeight();
	}

	/**
	 * Recalcule et synchronise la hauteur de l'item quand il est en mode folded
	 */
	function recalculateFoldedHeight() {
		if (_currentItem?.folded && headerRef && $gridParams.itemSize) {
			// Attendre un tick pour que le DOM soit mis à jour
			setTimeout(() => {
				const headerHeight = headerRef.offsetHeight;
				const gridHeight = headerHeight / ($gridParams.itemSize?.height || 100);
				const optimalGridHeight = Math.max(gridHeight, 0.5);

				// Mettre à jour la hauteur de l'item si nécessaire
				const currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
				if (currentItem && Math.abs(currentItem.h - optimalGridHeight) > 0.1) {
					currentStore.updateItem(id, {
						...currentItem,
						h: optimalGridHeight
					});

					if (debugThis) {
						console.log(
							`[recalculateFoldedHeight] Item ${id} height adjusted to: ${optimalGridHeight} (${headerHeight}px)`
						);
					}
				}

				syncHeaderHeight();
			}, 50);
		}
	}

	// Synchroniser la hauteur du header quand le composant est monté ou quand les propriétés changent
	$: if (headerRef && (name || _currentItem?.folded !== undefined)) {
		recalculateFoldedHeight();
	}

	function handlePointerDown(event: PointerEvent) {
		if (_movable && !$$slots.resizeHandle) {
			// Vérifier si le clic ne provient pas de l'IconButton
			if (!(event.target as Element).closest('.icon-button')) {
				moveStart(event);
			}
		}
	}

	// Debug logs combinés plus haut
	//$: console.log('folded : ', folded, ' _movable : ', _movable, ' _resizable : ', _resizable);
</script>

{#if visible}
	<div
		class={`${classes} ${active ? activeClass : ''} ${_currentItem?.folded ? 'folded-item' : ''}`}
		class:item-default={!classes}
		class:active-default={!activeClass && active}
		class:non-active-default={!active}
		style={`position: absolute; 
				left:${left}px; 
				top:${top}px; 
				width: ${width}px; 
				height: ${height}px;
				
				${$$restProps.style ?? ''}`}
		bind:this={itemRef}
	>
		{#if _currentItem?.folded || _movable}
			<div
				class="header"
				bind:this={headerRef}
				on:pointerdown={handlePointerDown}
				style={`${_movable && !$$slots.resizeHandle ? 'cursor: move;' : ''} touch-action: none; user-select: none;`}
			>
				<div class="move-handle" on:pointerdown={moveStart}>
					{name}
				</div>
				<div class="icon-container" bind:this={iconRef}>
					{#if _currentItem.movable}
						<IconButton class="material-icons  icon-button" on:click={toggleMovable}
							>lock</IconButton
						>
					{:else}
						<IconButton class="material-icons  icon-button" on:click={toggleMovable}
							>lock_open</IconButton
						>
					{/if}

					<IconButton class="material-icons  icon-button" on:click={toggleVisibility}>
						close
					</IconButton>
					<IconButton class="material-icons  icon-button" on:click={toggleFolded}>
						{_currentItem?.folded ? 'unfold_more' : 'unfold_less'}
					</IconButton>
				</div>
				<!-- <slot name="moveHandle" {moveStart} />-->
			</div>
		{/if}
		{#if !_currentItem?.folded}
			<div class="content-area">
				<slot {id} {active} {w} {h} />
				{#if _resizable}
					<slot name="resizeHandle" {resizeStart}>
						<div
							class={resizerClass}
							class:resizer-default={!resizerClass}
							on:pointerdown={resizeStart}
						/>
					</slot>
				{/if}
			</div>
		{/if}
	</div>

	{#if active && $gridParams.itemSize}
		{@const preview = calcPosition(previewItem, {
			itemSize: $gridParams.itemSize,
			gap: $gridParams.gap
		})}
		<div
			class={previewClass ?? ''}
			class:item-preview-default={!previewClass}
			style={`position: absolute; left:${preview.left}px; top:${preview.top}px;  
		width: ${preview.width}px; height: ${preview.height}px; z-index: -10;`}
		/>
	{/if}
{/if}

<style>
	.item-default {
		display: flex;
		flex-direction: column;
		transition:
			width 0.2s,
			height 0.2s;
		transition:
			transform 0.2s,
			opacity 0.2s;
		z-index: 1; /* Ajout d'un z-index par défaut */
		background: transparent; /* Laisser le slot gérer le fond si besoin */
		overflow: visible; /* header and icons must not be clipped by parent */
	}
	.active-default {
		opacity: 0.7;
		z-index: 20; /* z-index plus élevé pour l'item actif */
	}
	.item-preview-default {
		background-color: rgb(192, 127, 127);
		transition: all 0.2s;
	}
	.non-active-default {
		transition:
			left 0.2s,
			top 0.2s;
		transition-timing-function: ease-in-out;
	}
	.resizer-default {
		user-select: none;
		touch-action: none;
		position: absolute;
		user-select: none;
		width: 20px;
		height: 20px;
		right: 0;
		bottom: 0;
		cursor: se-resize;
		z-index: 10;
	}
	.resizer-default::after {
		content: '';
		position: absolute;
		right: 3px;
		bottom: 3px;
		width: 5px;
		height: 5px;
		border-right: 2px solid rgba(0, 0, 0, 0.4);
		border-bottom: 2px solid rgba(0, 0, 0, 0.4);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start; /* Alignement en haut pour gérer le multi-ligne */
		min-height: 40px;
		padding: 4px 8px;
		box-sizing: border-box;
		word-wrap: break-word;
		overflow-wrap: break-word;
		gap: 8px; /* Espace entre le titre et les boutons */
	}

	.content-area {
		position: relative;
		flex: 1 1 auto;
		height: auto; /* laisser le flex gérer la hauteur */
		min-height: 0; /* important pour le flexbox afin que le contenu ne force la hauteur */
		margin-top: 0;
		z-index: 0; /* contenu sous header */
		overflow: hidden; /* le contenu peut être masqué si déborde */
	}

	.move-handle {
		flex: 1 1 auto; /* prend l'espace restant mais peut rétrécir */
		min-width: 0; /* permet au move-handle de rétrécir pour laisser la place aux icônes */
		cursor: move;
		line-height: 1.2;
		max-width: calc(100% - 120px); /* Laisser de la place pour les 3 boutons */
		word-wrap: break-word;
		overflow-wrap: break-word;
		z-index: 30; /* header au dessus pour pouvoir se superposer */
		display: block;
	}

	.icon-container {
		display: flex;
		flex-shrink: 0; /* Empêcher la compression des boutons */
		align-items: center; /* Centrer verticalement les icônes */
		gap: 4px;
		z-index: 40; /* icônes au-dessus */
		padding-left: 6px;
	}

	/* Style spécial pour les items repliés */
	:global(.folded-item) {
		/* Hauteur gérée dynamiquement par la logique de calcul */
		/* Ne pas forcer une hauteur fixe pour permettre l'adaptation au contenu du header */
		overflow: hidden !important; /* S'assurer que le contenu ne déborde pas */
	}

	/* Header responsive pour les items repliés */
	.header {
		min-height: 40px; /* Hauteur minimale du header */
		padding: 4px 8px;
		box-sizing: border-box;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.move-handle {
		flex-grow: 1;
		cursor: move;
		line-height: 1.2;
		max-width: calc(100% - 120px); /* Laisser de la place pour les 3 boutons */
	}
</style>

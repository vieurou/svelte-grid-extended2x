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

	let classes: string | undefined = undefined;

	export { classes as class };

	export let debugThis: boolean = false;

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

	$: visible = $pageItemsStore.pageItems.find((item) => item.id === id)?.visible;

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

	let item = {
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
	} as PageItem;

	$: item.x = x;
	$: item.y = y;
	$: item.w = w;
	$: item.h = h;
	$: item.min = min;
	$: item.max = max;
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

	$: item, invalidate();

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

	$: previewItem, dispatch('previewchange', { item: previewItem });

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

	$: _movable = !$gridParams.readOnly && movable;

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

	$: if ($gridParams.itemSize) {
		minSize = {
			width: coordinate2size(min.w, $gridParams.itemSize.width, $gridParams.gap),
			height: coordinate2size(min.h, $gridParams.itemSize.height, $gridParams.gap)
		};
	}

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
			pageItemsStore.addItemToHiddenItems(id);
		} else {
			pageItemsStore.removeItemFromHiddenItems(id);
		}

		pageItemsStore.updateItem({ id, visible: newVisibility });
	}

	function toggleFolded() {
		const itemFolded = {
			id,
			folded: !folded,
			nfw: item.w,
			nfh: item.h,
			//w: folded ? item.nfw : 2,
			h: folded ? item.nfh : 0
		};

		pageItemsStore.updateItem(itemFolded);
		invalidate();

		item.invalidate();
	}
	function handlePointerDown(event: PointerEvent) {
		if (_movable && !$$slots.moveHandle) {
			// Vérifier si le clic ne provient pas de l'IconButton
			if (!(event.target as Element).closest('.icon-button')) {
				moveStart(event);
			}
		}
	}
</script>

{#if visible}
	<div
		class={`${classes} ${active ? activeClass : ''}`}
		class:item-default={!classes}
		class:active-default={!activeClass && active}
		class:non-active-default={!active}
		on:pointerdown={handlePointerDown}
		style={`position: absolute; 
				left:${left}px; 
				top:${top}px; 
				width: ${width}px; 
				height: ${height}px;
				${_movable && !$$slots.moveHandle ? 'cursor: move;' : ''} touch-action: none; user-select: none;
				${$$restProps.style ?? ''}`}
		bind:this={itemRef}
	>
		{#if folded || _movable}
			<div class="header">
				<div class="move-handle" on:pointerdown={moveStart}>
					{name}
				</div>
				<div class="icon-container">
					<IconButton class="material-icons  icon-button" on:click={toggleVisibility}
						>close</IconButton
					>
					<IconButton class="material-icons  icon-button" on:click={toggleFolded}
						>{folded ? 'unfold_more' : 'unfold_less'}</IconButton
					>
				</div>
				<!-- <slot name="moveHandle" {moveStart} />-->
			</div>
		{/if}
		{#if !folded}
			<slot {id} {active} {w} {h} />
		{/if}
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
		transition:
			width 0.2s,
			height 0.2s;
		transition:
			transform 0.2s,
			opacity 0.2s;
	}
	.active-default {
		opacity: 0.7;
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
		align-items: center;
	}

	.move-handle {
		flex-grow: 1;
		cursor: move;
	}

	.icon-container {
		display: flex;
	}
</style>

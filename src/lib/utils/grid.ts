import type { GridDimensions, LayoutItem } from '$lib/types';
import { getEffectiveItem, getHeaderHeight } from './pageItem';

export function isItemColliding(item: LayoutItem, otherItem: LayoutItem, itemSizePixels?: { width: number; height: number }): boolean {
	// Un item masqué ne peut pas entrer en collision.
	if (item.hidden || otherItem.hidden) {
		return false;
	}

	if (item.id === otherItem.id) {
		return false;
	}

	// Logique de collision personnalisée: le header peut superposer le corps d'un autre item.
	// La collision ne se produit que si les corps se chevauchent.

	const headerHeightItem = getHeaderHeight(item, itemSizePixels);
	const bodyItem = {
		x: item.x,
		y: item.y + headerHeightItem,
		w: item.w,
		h: item.h - headerHeightItem
	};

	const headerHeightOther = getHeaderHeight(otherItem, itemSizePixels);
	const bodyOther = {
		x: otherItem.x,
		y: otherItem.y + headerHeightOther,
		w: otherItem.w,
		h: otherItem.h - headerHeightOther
	};

	// Vérification de la collision entre les corps
	return (
		bodyItem.x < bodyOther.x + bodyOther.w &&
		bodyItem.x + bodyItem.w > bodyOther.x &&
		bodyItem.y < bodyOther.y + bodyOther.h &&
		bodyItem.y + bodyItem.h > bodyOther.y
	);
}

export function getCollisions(currentItem: LayoutItem, items: LayoutItem[], itemSizePixels?: { width: number; height: number }): LayoutItem[] {
	return items.filter((item) => isItemColliding(currentItem, item, itemSizePixels));
}

export function hasCollisions(currentItem: LayoutItem, items: LayoutItem[], itemSizePixels?: { width: number; height: number }): boolean {
	return items.some((item) => isItemColliding(currentItem, item, itemSizePixels));
}

export function getGridDimensions(items: LayoutItem[], itemSizePixels?: { width: number; height: number }): GridDimensions {
	let cols = 0;
	let rows = 0;

	// On ne prend en compte que les items visibles pour le calcul des dimensions
	const visibleItems = items.filter(item => !item.hidden);

	visibleItems.forEach((item) => {
		const effectiveItem = getEffectiveItem(item, itemSizePixels);
		cols = Math.max(cols, effectiveItem.x + effectiveItem.w);
		rows = Math.max(rows, effectiveItem.y + effectiveItem.h);
	});

	return { cols, rows };
}

export function getAvailablePosition(
	currentItem: LayoutItem,
	items: LayoutItem[],
	maxCols: number,
	maxRows: number,
	itemSizePixels?: { width: number; height: number }
): { x: number; y: number } | null {
	let { cols, rows } = getGridDimensions(items, itemSizePixels);

	if (maxCols < Infinity) cols = maxCols;
	if (maxRows < Infinity) rows = maxRows;

	const effectiveCurrentItem = getEffectiveItem(currentItem, itemSizePixels);

	for (let y = 0; y <= rows - effectiveCurrentItem.h; y++) {
		for (let x = 0; x <= cols - effectiveCurrentItem.w; x++) {
			const testItem = { ...effectiveCurrentItem, x, y };

			if (!hasCollisions(testItem, items, itemSizePixels)) {
				const newPosition = { x, y };
				return newPosition;
			}
		}
	}

	if (maxRows === Infinity) return { x: 0, y: rows };
	if (maxCols === Infinity) return { x: cols, y: 0 };

	return null;
}

export function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export function updateGridAfterItemShapeChange(
	items: LayoutItem[],
	changedItemId: string,
	itemSizePixels?: { width: number; height: number },
	collisionMode: 'compress' | 'push' | 'none' = 'compress'
): LayoutItem[] {
	console.group(`[updateGridAfterItemShapeChange] Item ${changedItemId} a changé de forme`);

	const updatedItems = [...items];
	const changedItem = updatedItems.find(item => item.id === changedItemId);
	if (!changedItem) {
		console.warn(`[updateGridAfterItemShapeChange] Item ${changedItemId} non trouvé`);
		console.groupEnd();
		return items;
	}

	console.log(`[updateGridAfterItemShapeChange] Item modifié: ${changedItem.id}, nouvelle hauteur: ${changedItem.h}`);

	const otherItems = updatedItems.filter(item => item.id !== changedItemId);
	const collisions = getCollisions(changedItem, otherItems, itemSizePixels);

	if (collisions.length === 0) {
		console.log(`[updateGridAfterItemShapeChange] Aucune collision détectée`);
		console.groupEnd();
		return updatedItems;
	}

	console.log(`[updateGridAfterItemShapeChange] ${collisions.length} collision(s) détectée(s):`, collisions.map(c => c.id));

	let resolvedItems = [...updatedItems];

	switch (collisionMode) {
		case 'compress':
			resolvedItems = resolveCollisionsByCompression(resolvedItems, changedItemId, itemSizePixels);
			break;
		case 'push':
			resolvedItems = resolveCollisionsByPushing(resolvedItems, changedItemId, itemSizePixels);
			break;
		case 'none':
			console.log(`[updateGridAfterItemShapeChange] Mode 'none': collisions non résolues`);
			break;
	}

	console.groupEnd();
	return resolvedItems;
}

function resolveCollisionsByCompression(
	items: LayoutItem[],
	_changedItemId: string,
	itemSizePixels?: { width: number; height: number }
): LayoutItem[] {
	const visibleItems = items.filter(item => !item.hidden);
	const sortedItems = [...visibleItems].sort((a, b) => {
		if (a.y !== b.y) {
			return a.y - b.y;
		}
		return a.x - b.x;
	});

	const resolvedItems: LayoutItem[] = [];

	for (const item of sortedItems) {
		let finalItem = { ...item };
		let newY = finalItem.y;

		while (newY > 0) {
			const testItem = { ...finalItem, y: newY - 1 };
			if (hasCollisions(testItem, resolvedItems, itemSizePixels)) {
				break;
			}
			newY--;
		}

		if (newY !== finalItem.y) {
			console.log(`[resolveCollisionsByCompression] Item ${item.id}: Y ${item.y} -> ${newY}`);
			finalItem.y = newY;
		}

		resolvedItems.push(finalItem);
	}

	const hiddenItems = items.filter(item => item.hidden);
	return [...resolvedItems, ...hiddenItems];
}

function resolveCollisionsByPushing(
	items: LayoutItem[],
	changedItemId: string,
	itemSizePixels?: { width: number; height: number }
): LayoutItem[] {
	const changedItem = items.find(item => item.id === changedItemId);
	if (!changedItem) return items;

	const resolvedItems = [...items];
	const collisions = getCollisions(changedItem, items.filter(i => i.id !== changedItemId), itemSizePixels);

	for (const collidingItem of collisions) {
		const itemIndex = resolvedItems.findIndex(item => item.id === collidingItem.id);
		if (itemIndex !== -1) {
			const effectiveChangedItem = getEffectiveItem(changedItem, itemSizePixels);
			const newY = effectiveChangedItem.y + effectiveChangedItem.h;
			resolvedItems[itemIndex] = { ...resolvedItems[itemIndex], y: newY };
			console.log(`[resolveCollisionsByPushing] Item ${collidingItem.id}: Y ${collidingItem.y} -> ${newY}`);
		}
	}

	return resolvedItems;
}
/// <reference types="svelte" />
import PageItem from '$lib';
export declare const pageItemsStore: {
	subscribe: (
		this: void,
		run: import('svelte/store').Subscriber<{
			pageItems: PageItem[];
			itemsBackup: PageItem[];
		}>,
		invalidate?:
			| import('svelte/store').Invalidator<{
					pageItems: PageItem[];
					itemsBackup: PageItem[];
			  }>
			| undefined
	) => import('svelte/store').Unsubscriber;
	/**
	 * Met à jour la liste des éléments de la page avec la liste d'éléments
	 * fournie en paramètre. Sauvegarde également la liste fournie en
	 * paramètre dans la propriété itemsBackup.
	 * @param {PageItem[]} initialItems - La liste des éléments initiaux
	 *                                    de la page.
	 */
	setInitialItems: (initialItems: PageItem[]) => void;
	/**
	 * Supprime l'élément de la liste dont l'id est itemId.
	 * @param {string} itemId - id de l'élément à cacher
	 */
	removeItem: (itemId: string) => void;
	addItem: (item: PageItem) => void;
	resetToBackup: () => void;
	updateItem: (item: PageItem) => void;
	hasItem: (itemId: string) => boolean;
};

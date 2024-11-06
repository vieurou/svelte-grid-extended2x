import { writable } from 'svelte/store';
import PageItem from '$lib';
const debugThis = false;

function createPageItemsStore() {
	const { subscribe, set, update } = writable<{
		pageItems: PageItem[];
		itemsBackup: PageItem[];
	}>({
		pageItems: [],
		itemsBackup: []
	});

	//debug a chaque fois que pageItems est mis a jour
	subscribe((state) => {
		if (debugThis) console.log('pageItems dans store : ', state.pageItems);
	});

	return {
		subscribe,
		/**
		 * Met à jour la liste des éléments de la page avec la liste d'éléments
		 * fournie en paramètre. Sauvegarde également la liste fournie en
		 * paramètre dans la propriété itemsBackup.
		 * @param {PageItem[]} initialItems - La liste des éléments initiaux
		 *                                    de la page.
		 */
		setInitialItems: (initialItems: PageItem[]) =>
			set({
				pageItems: initialItems,
				itemsBackup: JSON.parse(JSON.stringify(initialItems)) // Deep copy
			}),

		/**
		 * Supprime l'élément de la liste dont l'id est itemId.
		 * @param {string} itemId - id de l'élément à cacher
		 */
		removeItem: (itemId: string) =>
			update((state) => ({
				...state,
				pageItems: state.pageItems.filter((item) => item.id !== itemId)
			})),

		addItem: (item: PageItem) =>
			update((state) => ({
				...state,
				pageItems: [...state.pageItems, item]
			})),

		resetToBackup: () =>
			update((state) => ({
				...state,
				pageItems: JSON.parse(JSON.stringify(state.itemsBackup)) // Deep copy
			})),
		updateItem: (item: PageItem) =>
			update((state) => ({
				...state,
				pageItems: state.pageItems.map((i) => (i.id === item.id ? item : i))
			})),
		hasItem: (itemId: string) => {
			let itemExists = false;
			update((state) => {
				itemExists = state.pageItems.some((item) => item.id === itemId);
				return state;
			});
			return itemExists;
		}
	};
}

export const pageItemsStore = createPageItemsStore();

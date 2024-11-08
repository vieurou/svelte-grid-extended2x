import { writable, derived } from 'svelte/store';
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

	// Créez le store dérivé pour hiddenItems
	const hiddenItems = derived({ subscribe }, ($store) =>
		$store.pageItems.filter((item) => !item.visible)
	);

	//debug a chaque fois que pageItems est mis a jour
	subscribe((state) => {
		if (debugThis) {
			console.log('pageItems dans store : ', state.pageItems);
			console.log('itemsBackup dans store : ', state.itemsBackup);
		}
	});

	return {
		subscribe,
		hiddenItems,
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
				itemsBackup: JSON.parse(JSON.stringify(initialItems)),
				hiddenItems: []
			}),
		setItems: (items: PageItem[]) =>
			update((state) => ({
				...state,
				pageItems: items
			})),

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
		},
		swapMovable: (id: string, force: boolean | null = null) => {
			console.log('swapMovable', id, force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item) => {
						if (item.id === id) {
							item.movable = force;
						}
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item) => {
					if (item.id === id) {
						item.movable = !item.movable;
					}
					return item;
				});
				return state;
			});
		},
		swapAllMovable: (force: boolean | null = null) => {
			console.log('swapAllMovable', force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item) => {
						item.movable = force;
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item) => {
					item.movable = !item.movable;
					return item;
				});
				return state;
			});
		},
		swapFolded: (id: string, force: boolean | null = null) => {
			console.log('swapFolded', id, force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item) => {
						if (item.id === id) {
							item.folded = force;
						}
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item) => {
					if (item.id === id) {
						item.folded = !item.folded;
					}
					return item;
				});
				return state;
			});
		},
		swapAllFolded: (force: boolean | null = null) => {
			console.log('swapAllFolded', force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item) => {
						item.folded = force;
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item) => {
					item.folded = !item.folded;
					return item;
				});
				return state;
			});
		}
	};
}

export const pageItemsStore = createPageItemsStore();

// src/stores/pageItems.store.ts
import { writable, derived } from 'svelte/store';
import { type PageItem, defaultPageItem } from '$lib';
import { persistentStore } from './persistent.store';

export const debugThis = false;

function createPageItemsStore() {
	// Utilisation de persistentStore pour que les items soient sauvegardés dans localStorage
	const baseStore = persistentStore('pageItems', {
		pageItems: [],
		itemsBackup: [],
		hiddenItems: [],
		collision: 'none' as 'none' | 'push' | 'compress'
	});

	const { subscribe, set, update } = baseStore;

	// S'assurer que collision a toujours une valeur par défaut
	update((state) => {
		if (!state.collision) {
			state.collision = 'none';
		}
		return state;
	});

	// Créez le store dérivé pour hiddenItems
	const hiddenItems = derived({ subscribe }, ($store: any) => {
		const hidden = $store.pageItems.filter((item: any) => !item.visible);
		if (debugThis) console.log('hiddenItems updated:', hidden);
		return hidden;
	});

	function addItemToHiddenItems(itemId: string) {
		if (debugThis) console.log('addItemToHiddenItems appelée avec itemId:', itemId);
		update((state) => {
			const item = state.pageItems.find((i: any) => i.id === itemId);
			if (item) {
				state.hiddenItems = [...state.hiddenItems, item];
			}
			return state;
		});
	}

	function removeItemFromHiddenItems(itemId: string) {
		console.log('removeItemFromHiddenItems appelée avec itemId:', itemId);
		update((state) => {
			state.hiddenItems = state.hiddenItems.filter((i: any) => i.id !== itemId);
			return state;
		});
	}

	// Debug chaque fois que pageItems est mis à jour
	subscribe((state) => {
		if (debugThis) {
			console.log('pageItems dans store : ', state.pageItems);
			console.log('itemsBackup dans store : ', state.itemsBackup);
		}
	});

	function initFolded() {
		update((state) => {
			state.pageItems = state.pageItems.map((item: any) => {
				if (item.folded) {
					item.nfh = item.h; // Sauvegarde de la hauteur actuelle
					item.h = 1; // Réinitialisation de la hauteur à 1
				}
				return item;
			});
			return state;
		});
	}

	return {
		subscribe,
		hiddenItems,
		addItemToHiddenItems,
		removeItemFromHiddenItems,
		/**
		 * Met à jour la liste des éléments de la page avec la liste d'éléments
		 * fournie en paramètre. Sauvegarde également la liste fournie en
		 * paramètre dans la propriété itemsBackup.
		 * @param {PageItem[]} initialItems - La liste des éléments initiaux
		 *                                    de la page.
		 */
		setInitialItems: (initialItems: PageItem[]) => {
			const completedInitialItems = initialItems.map((item) => {
				return {
					...defaultPageItem,
					...item
				} as PageItem;
			}) as PageItem[];

			set({
				pageItems: completedInitialItems,
				itemsBackup: completedInitialItems.map((item) => ({
					...defaultPageItem,
					...item
				})),
				hiddenItems: completedInitialItems.filter((item) => !item.visible) as PageItem[]
			});

			initFolded();
		},
		setItems: (items: PageItem[]) =>
			update((state) => ({
				...state,
				pageItems: items
			})),

		removeItem: (itemId: string) =>
			update((state) => ({
				...state,
				pageItems: state.pageItems.filter((item: any) => item.id !== itemId)
			})),

		addItem: (item: PageItem) =>
			update((state) => ({
				...state,
				pageItems: [...state.pageItems, item]
			})),

		resetToBackup: () => {
			update((state) => ({
				...state,
				pageItems: state.itemsBackup.map((item: any) => ({
					...item
				})),
				hiddenItems: state.itemsBackup.filter((item: any) => !item.visible)
			}));
		},

		updateItem: (updatedItem: PageItem) =>
			update((state) => {
				const updatedPageItems = state.pageItems.map((item: any) =>
					item.id === updatedItem.id ? { ...item, ...updatedItem } : item
				);
				if (debugThis) console.log('pageItems updated:', updatedPageItems);
				return {
					...state,
					pageItems: updatedPageItems
				};
			}),

		hasItem: (itemId: string) => {
			let itemExists = false;
			update((state) => {
				itemExists = state.pageItems.some((item: any) => item.id === itemId);
				return state;
			});
			return itemExists;
		},

		swapMovable: (id: string, force: boolean | null = null) => {
			if (debugThis) console.log('swapMovable', id, force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item: any) => {
						if (item.id === id) {
							item.movable = force;
						}
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item: any) => {
					if (item.id === id) {
						item.movable = !item.movable;
					}
					return item;
				});
				return state;
			});
		},

		swapAllMovable: (force: boolean | null = null) => {
			if (debugThis) console.log('swapAllMovable', force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item: any) => {
						item.movable = force;
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item: any) => {
					item.movable = !item.movable;
					return item;
				});
				return state;
			});
		},

		swapFolded: (id: string, force: boolean | null = null) => {
			if (debugThis) console.log('swapFolded', id, force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item: any) => {
						if (item.id === id) {
							if (force) {
								// Plier : sauvegarder la hauteur actuelle et mettre h à 1
								item.nfh = item.h;
								item.h = 1;
								item.folded = true;
							} else {
								// Déplier : restaurer la hauteur sauvegardée ou utiliser une hauteur par défaut
								item.h = item.nfh && item.nfh > 1 ? item.nfh : 3; // Par défaut 3 si pas de hauteur sauvegardée
								item.folded = false;
							}
						}
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item: any) => {
					if (item.id === id) {
						if (!item.folded) {
							// Plier : sauvegarder la hauteur actuelle et mettre h à 1
							item.nfh = item.h;
							item.h = 1;
							item.folded = true;
						} else {
							// Déplier : restaurer la hauteur sauvegardée ou utiliser une hauteur par défaut
							item.h = item.nfh && item.nfh > 1 ? item.nfh : 3; // Par défaut 3 si pas de hauteur sauvegardée
							item.folded = false;
						}
					}
					return item;
				});
				return state;
			});
		},

		swapAllFolded: (force: boolean | null = null) => {
			if (debugThis) console.log('swapAllFolded', force);
			update((state) => {
				if (force !== null) {
					state.pageItems = state.pageItems.map((item: any) => {
						item.folded = force;
						return item;
					});
					return state;
				}
				state.pageItems = state.pageItems.map((item: any) => {
					item.folded = !item.folded;
					return item;
				});
				return state;
			});
		},

		setCollision: (collisionType: 'none' | 'push' | 'compress') => {
			if (debugThis) console.log('setCollision', collisionType);
			update((state) => ({
				...state,
				collision: collisionType
			}));
		}
	};
}

export const pageItemsStore = createPageItemsStore();

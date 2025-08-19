// src/stores/multiPageItems.store.ts
import { writable, derived } from 'svelte/store';
import { defaultPageItem } from '$lib';
import { persistentStore } from './persistent.store';
import type { PageItem } from '$lib/types';

export const debugThis: boolean = false;

interface NamespaceData {
    pageItems: PageItem[];
    itemsBackup: PageItem[];
    hiddenItems: PageItem[];
    collision: string;
}

interface NamespaceStore {
    subscribe: (callback: (data: NamespaceData) => void) => () => void;
    update: (updater: (data: NamespaceData) => NamespaceData) => void;
    set: (data: NamespaceData) => void;
}

interface NamespaceMethods {
    subscribe: (callback: (data: NamespaceData) => void) => () => void;
    hiddenItems: any;
    addItemToHiddenItems: (itemId: string) => void;
    removeItemFromHiddenItems: (itemId: string) => void;
    setInitialItems: (initialItems: PageItem[]) => void;
    setItems: (items: PageItem[]) => void;
    removeItem: (itemId: string) => void;
    addItem: (item: Partial<PageItem>) => void;
    updateItem: (itemId: string, updatedItem: Partial<PageItem>) => void;
    resetItems: () => void;
    clearItems: () => void;
    hasItem: (itemId: string) => boolean;
    setCollision: (collisionType: string) => void;
    resetToBackup: () => void;
    swapAllMovable: (movable: boolean) => void;
}

function createMultiPageItemsStore() {
    // Store global qui contient tous les namespaces
    const baseStore = persistentStore('multiPageItems', {});
    const { subscribe, set, update } = baseStore;

    // Fonction pour créer ou récupérer un store pour un namespace donné
    function getNamespaceStore(namespace: string): NamespaceStore {
        return {
            subscribe: (callback: (data: NamespaceData) => void) => {
                return subscribe((allStores: Record<string, NamespaceData>) => {
                    const namespaceData = allStores[namespace] || {
                        pageItems: [],
                        itemsBackup: [],
                        hiddenItems: [],
                        collision: 'none'
                    };
                    callback(namespaceData);
                });
            },
            update: (updater: (data: NamespaceData) => NamespaceData) => {
                update((allStores: Record<string, NamespaceData>) => {
                    const currentData = allStores[namespace] || {
                        pageItems: [],
                        itemsBackup: [],
                        hiddenItems: [],
                        collision: 'none'
                    };
                    const newData = updater(currentData);
                    return {
                        ...allStores,
                        [namespace]: newData
                    };
                });
            },
            set: (data: NamespaceData) => {
                update((allStores: Record<string, NamespaceData>) => ({
                    ...allStores,
                    [namespace]: data
                }));
            }
        };
    }

    // Fonction pour créer les méthodes spécifiques à un namespace
    function createNamespaceMethods(namespace: string): NamespaceMethods {
        const namespaceStore = getNamespaceStore(namespace);

        // Store dérivé pour les éléments cachés
        const hiddenItems = derived(namespaceStore, ($store: NamespaceData) => {
            const hidden = $store.pageItems.filter((item: PageItem) => !item.visible);
            if (debugThis)
                console.log(`hiddenItems updated for ${namespace}:`, hidden);
            return hidden;
        });

        function addItemToHiddenItems(itemId: string) {
            if (debugThis)
                console.log(`addItemToHiddenItems appelée pour ${namespace} avec itemId:`, itemId);
            namespaceStore.update((state: NamespaceData) => {
                const item = state.pageItems.find((i: PageItem) => i.id === itemId);
                if (item) {
                    state.hiddenItems = [...state.hiddenItems, item];
                }
                return state;
            });
        }

        function removeItemFromHiddenItems(itemId: string) {
            console.log(`removeItemFromHiddenItems appelée pour ${namespace} avec itemId:`, itemId);
            namespaceStore.update((state: NamespaceData) => {
                state.hiddenItems = state.hiddenItems.filter((i: PageItem) => i.id !== itemId);
                return state;
            });
        }

        function initFolded() {
            namespaceStore.update((state: NamespaceData) => {
                state.pageItems = state.pageItems.map((item: PageItem) => {
                    if (item.folded) {
                        item.nfh = item.h;
                        item.h = 1;
                    }
                    return item;
                });
                return state;
            });
        }

        function hasItem(itemId: string): boolean {
            let hasItemResult = false;
            const unsubscribe = namespaceStore.subscribe((state: NamespaceData) => {
                hasItemResult = state.pageItems.some((item: PageItem) => item.id === itemId);
            });
            unsubscribe(); // Importante : désabonner immédiatement
            return hasItemResult;
        }

        function setCollision(collisionType: string) {
            namespaceStore.update((state: NamespaceData) => ({
                ...state,
                collision: collisionType
            }));
        }

        function resetToBackup() {
            namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: [...state.itemsBackup]
            }));
        }

        function swapAllMovable(movable: boolean) {
            console.log(`swapAllMovable appelée avec movable=${movable}`);
            namespaceStore.update((state: NamespaceData) => {
                console.log('État avant modification:', state.pageItems.map(item => ({ id: item.id, movable: item.movable })));
                const newState = {
                    ...state,
                    pageItems: state.pageItems.map((item: PageItem) => ({
                        ...item,
                        movable: movable
                    }))
                };
                console.log('État après modification:', newState.pageItems.map(item => ({ id: item.id, movable: item.movable })));
                return newState;
            });
        }

        return {
            subscribe: namespaceStore.subscribe,
            hiddenItems,
            addItemToHiddenItems,
            removeItemFromHiddenItems,
            hasItem,
            setCollision,
            resetToBackup,
            swapAllMovable,
            setInitialItems: (initialItems: PageItem[]) => {
                const completedInitialItems = initialItems.map((item: PageItem) => {
                    return {
                        ...defaultPageItem,
                        ...item
                    };
                });
                namespaceStore.set({
                    pageItems: completedInitialItems,
                    itemsBackup: completedInitialItems.map((item: PageItem) => ({
                        ...defaultPageItem,
                        ...item
                    })),
                    hiddenItems: completedInitialItems.filter((item: PageItem) => !item.visible),
                    collision: 'none'
                });
                initFolded();
            },
            setItems: (items: PageItem[]) => namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: items
            })),
            removeItem: (itemId: string) => namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: state.pageItems.filter((item: PageItem) => item.id !== itemId)
            })),
            addItem: (item: Partial<PageItem>) => namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: [...state.pageItems, { ...defaultPageItem, ...item }]
            })),
            updateItem: (itemId: string, updatedItem: Partial<PageItem>) => namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: state.pageItems.map((item: PageItem) =>
                    item.id === itemId ? { ...item, ...updatedItem } : item
                )
            })),
            resetItems: () => namespaceStore.update((state: NamespaceData) => ({
                ...state,
                pageItems: [...state.itemsBackup]
            })),
            clearItems: () => namespaceStore.set({
                pageItems: [],
                itemsBackup: [],
                hiddenItems: [],
                collision: 'none'
            })
        };
    }

    return {
        getStore: createNamespaceMethods,
        subscribe,
        // Méthodes globales
        clearAllNamespaces: () => set({}),
        getNamespaces: () => {
            let namespaces: string[] = [];
            subscribe((allStores: Record<string, NamespaceData>) => {
                namespaces = Object.keys(allStores);
            })();
            return namespaces;
        }
    };
}

export const multiPageItemsStore = createMultiPageItemsStore();
export default multiPageItemsStore;

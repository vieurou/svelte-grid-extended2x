//src/lib/index.ts

//IMPORT
//composant principal
import Grid from './Grid.svelte';
//types
import type {
	LayoutItem,
	PageItem,
	LayoutChangeDetail,
	GridController,
	ComponentsMap
} from './types';
//default object
import { defaultPageItem } from './types';
//stores
import { pageItemsStore } from '$stores/pageItems.store';
import { multiPageItemsStore } from '$stores/multiPageItems.store';
import { persistentStore } from '$stores/persistent.store';
import { snackbarMessage } from '$stores/snackBar.store';

//EXPORT
export {
	Grid,
	type LayoutItem,
	type PageItem,
	type LayoutChangeDetail,
	type GridController,
	type ComponentsMap
};
export { defaultPageItem };
export { default as GridItem } from './GridItem.svelte';

// Composants exportés par défaut
export { default as PageOld } from './PageOld.svelte';
export { default as Page } from './Page.svelte';
export { default as PageGridItem } from './PageGridItem.svelte';

// Nouveaux composants exportés directement (sans default)
export { default as PageMenu } from './PageMenu.svelte';
export { default as PageGrid } from './PageGrid.svelte';

export { pageItemsStore, multiPageItemsStore, snackbarMessage, persistentStore };

export default Grid;

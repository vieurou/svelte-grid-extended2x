//src/lib/index.ts

//IMPORT 
//comoposant proncipal
import Grid from './Grid.svelte';
//types
import type { LayoutItem, PageItem, LayoutChangeDetail, GridController, ComponentsMap } from './types';
//default onject
import { defaultPageItem } from './types';
//stores 
import { pageItemsStore } from '$stores/pageItems.store';
import { persistentStore } from '$stores/persistent.store';
import { snackbarMessage} from '$stores/snackBar.store';



//EXPORT 
export { Grid, type LayoutItem, type PageItem, type LayoutChangeDetail, type GridController, type ComponentsMap };
export { defaultPageItem };
export { default as GridItem } from './GridItem.svelte';

export { default as Page } from './Page.svelte';
export { default as PageGridItem } from './PageGridItem.svelte';

export { pageItemsStore, snackbarMessage, persistentStore };

export default Grid;

# Documentation du fichier index.ts

## Vue d'ensemble
Fichier d'export principal qui centralise tous les composants, types et stores du système de grille. Point d'entrée unique pour l'utilisation de la bibliothèque.

## Structure des exports

### Composant principal et types
```typescript
import Grid from './Grid.svelte';
import type {
    LayoutItem,
    PageItem,
    LayoutChangeDetail,
    GridController,
    ComponentsMap
} from './types';
```
**Logique :**
- `Grid` : composant principal par défaut
- Types essentiels pour TypeScript
- Import centralisé pour cohérence

### Export des types
```typescript
export {
    Grid,
    type LayoutItem,
    type PageItem,
    type LayoutChangeDetail,
    type GridController,
    type ComponentsMap
};
```
**Logique :**
- Re-export avec types explicites
- Facilite l'import depuis l'extérieur
- Maintient la compatibilité TypeScript

### Objet par défaut
```typescript
import { defaultPageItem } from './types';
export { defaultPageItem };
```
**Logique :**
- Valeurs par défaut pour créer de nouveaux éléments
- Évite la duplication de configuration
- Standardise les propriétés initiales

### Composants de base
```typescript
export { default as GridItem } from './GridItem.svelte';
```
**Logique :**
- Export avec alias pour clarté
- Composant fondamental de la grille

### Composants de page
```typescript
// Composants exportés par défaut
export { default as PageOld } from './PageOld.svelte';
export { default as Page } from './Page.svelte';
export { default as PageGridItem } from './PageGridItem.svelte';

// Nouveaux composants exportés directement (sans default)
export { default as PageMenu } from './PageMenu.svelte';
export { default as PageGrid } from './PageGrid.svelte';
```
**Logique :**
- **PageOld/Page** : composants de page complète
- **PageGridItem** : élément spécialisé pour pages
- **PageMenu/PageGrid** : composants modulaires séparés
- Architecture modulaire permettant usage individuel ou combiné

### Stores
```typescript
import { pageItemsStore } from '$stores/pageItems.store';
import { multiPageItemsStore } from '$stores/multiPageItems.store';
import { persistentStore } from '$stores/persistent.store';
import { snackbarMessage } from '$stores/snackBar.store';

export { pageItemsStore, multiPageItemsStore, snackbarMessage, persistentStore };
```
**Logique :**
- **pageItemsStore** : store simple pour une page
- **multiPageItemsStore** : gestionnaire multi-instances
- **persistentStore** : sauvegarde locale
- **snackbarMessage** : notifications utilisateur

### Export par défaut
```typescript
export default Grid;
```
**Logique :**
- Facilite l'import simple : `import Grid from 'ma-lib'`
- Grid comme composant principal de la bibliothèque

## Utilisation recommandée

### Import complet
```typescript
import Grid, { 
    type PageItem, 
    type LayoutItem, 
    PageGridItem, 
    pageItemsStore 
} from 'ma-lib';
```

### Import de composants spécifiques
```typescript
import { Page, PageMenu, PageGrid } from 'ma-lib';
```

### Import de stores
```typescript
import { multiPageItemsStore, persistentStore } from 'ma-lib';
```

**Logique d'organisation :**
- Exports organisés par fonctionnalité
- Flexibilité d'import selon les besoins
- Séparation claire entre composants, types et stores
- Point d'entrée unique pour toute la bibliothèque

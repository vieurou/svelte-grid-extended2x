# Documentation du fichier Grid.svelte

## Vue d'ensemble
Composant principal de la grille qui gère la disposition, le redimensionnement automatique, et fournit le contexte pour tous les éléments enfants.

## Contexte Svelte

### `getGridContext()`
```typescript
const GRID_CONTEXT_NAME = Symbol('svelte-grid-extended-context');
export function getGridContext(): Readable<GridParams> {
    let context: Writable<GridParams> | undefined = getContext(GRID_CONTEXT_NAME);
    if (context === undefined) {
        throw new Error('Grid context not found');
    }
    return context;
}
```
**Logique :**
- Utilise un Symbol unique pour éviter les collisions de contexte
- Fournit un accès typé aux paramètres de grille
- Lève une erreur explicite si le contexte n'existe pas

## Props principales

### Configuration de base
```typescript
export let cols: GridSize = 0;
export let rows: GridSize = 0;
export let itemSize: Partial<ItemSize> = {};
export let gap = 10;
```
**Logique :**
- `cols/rows = 0` : taille dynamique basée sur le contenu
- `itemSize` partiel : calcul automatique des dimensions manquantes
- `gap` : espacement uniforme entre éléments

### Comportement
```typescript
export let bounds = false;
export let readOnly = false;
export let debug = false;
export let collision: Collision = 'none';
export let autoCompress = true;
```
**Logique :**
- `bounds` : limite les éléments au conteneur
- `readOnly` : désactive toutes les interactions
- `collision` : stratégie de gestion des chevauchements
- `autoCompress` : compression automatique avec collision 'compress'

## Logique de dimensionnement

### Calcul des colonnes/lignes
```typescript
$: if (typeof cols === 'number') _cols = cols;
$: if (typeof rows === 'number') _rows = rows;
```
**Logique :**
- Variables internes `_cols/_rows` pour les calculs
- Distinction entre valeurs fixes et breakpoints

### Redimensionnement du conteneur
```typescript
$: if ($gridSettings.itemSize && cols === 0) {
    containerWidth = _cols * ($gridSettings.itemSize.width + gap + 1);
}
$: if ($gridSettings.itemSize && rows === 0) {
    containerHeight = _rows * ($gridSettings.itemSize.height + gap + 1);
}
```
**Logique :**
- Calcul automatique uniquement si cols/rows = 0
- Formule : (nombre_cellules × (taille_cellule + gap)) + marge
- Le +1 compense les arrondis et bordures

### Calcul de taille dynamique
```typescript
$: calculatedGridSize = getGridDimensions(Object.values(items));
```
**Logique :**
- Analyse tous les éléments pour déterminer l'espace nécessaire
- Utilisé quand cols/rows = 0 pour un dimensionnement automatique

## Gestion des collisions

### Configuration collision
```typescript
$: if (collision !== 'none') {
    _rows = 0; // Force dynamic height
    shouldExpandRows = true;
}
```
**Logique :**
- Force la hauteur dynamique avec collisions actives
- Permet l'expansion infinie vers le bas
- Évite les contraintes de hauteur fixes

### Observer de redimensionnement
```typescript
const sizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) {
        const { width, height } = entry.contentRect;
        // Recalcul des dimensions de grille
    }
});
```
**Logique :**
- Surveille les changements de taille du conteneur
- Recalcule automatiquement les dimensions de grille
- Gère les breakpoints responsive

## Store et contrôleur

### GridSettings store
```typescript
const gridSettings = writable<GridParams>({
    dispatch,
    // ... autres paramètres
});

$: gridSettings.update((settings) => ({
    ...settings,
    collision,
    // ... mise à jour des paramètres
}));
```
**Logique :**
- Store Svelte pour l'état de la grille
- Mise à jour réactive des paramètres
- Partage de l'état via le contexte

### GridController
```typescript
const _controller = new GridController($gridSettings);
$: _controller.gridParams = $gridSettings;
export const controller = _controller as GridControllerType;
```
**Logique :**
- Instance unique du contrôleur
- Synchronisation automatique avec les paramètres
- Export pour utilisation externe

## Gestion des éléments

### Enregistrement d'éléments
```typescript
function registerItem(item: LayoutItem): void {
    items[item.id] = item;
    // Mise à jour de la grille si nécessaire
}

function unregisterItem(item: LayoutItem): void {
    delete items[item.id];
    // Compression automatique si activée
}
```
**Logique :**
- Dictionnaire des éléments par ID
- Auto-compression lors des suppressions
- Validation des contraintes

### Fonction updateGrid
```typescript
function updateGrid() {
    // Recalcul des dimensions
    // Dispatch des événements de changement
    // Validation des contraintes
}
```
**Logique :**
- Point central pour toutes les mises à jour
- Déclenche les re-rendus nécessaires
- Maintient la cohérence de l'état

## Template et styles

### Conteneur principal
```svelte
<div
    class={`svelte-grid-extended ${classes}`}
    bind:this={gridContainer}
    style={`width: ${containerWidth ? `${containerWidth}px` : '100%'}; 
            height: ${containerHeight ? `${containerHeight}px` : '100%'}; 
            ${$$restProps.style ?? ''}`}
>
    {#if $gridSettings.itemSize}
        <slot />
    {/if}
</div>
```
**Logique :**
- Conteneur avec taille dynamique ou fixe
- Slot conditionnel selon l'état d'initialisation
- Fusion des styles personnalisés

### Styles de collision
```css
:global([data-collision='compress']) .svelte-grid-extended,
:global([data-collision='push']) .svelte-grid-extended {
    /* Styles spécifiques aux modes collision */
}
```
**Logique :**
- Styles contextuels selon le mode de collision
- Application globale pour les éléments enfants
- Adaptation du comportement visuel

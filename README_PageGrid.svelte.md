# Documentation du fichier PageGrid.svelte

## Vue d'ensemble
Composant responsable de l'affichage et de la gestion de la grille d'éléments dans une page. Gère le rendu des composants, la détection de changements et l'intégration avec le système de stores.

## Configuration et props

### Props principales
```typescript
export let componentsMap: ComponentsMap = {};
export let debugThis: boolean = false;
export let pageStore: any = null; // Store spécifique ou défaut
```
**Logique :**
- `componentsMap` : dictionnaire nom → composant Svelte
- `pageStore` : injection de dépendance du store
- `debugThis` : mode debug transmis depuis la page parent

### Props de style
```typescript
let classes: string | undefined = undefined;
export { classes as class };
export let style: string = '';
```
**Logique :**
- Support des classes CSS externes
- Styles inline personnalisables
- Intégration avec frameworks CSS

## Gestion du store

### Sélection du store
```typescript
$: currentStore = pageStore || pageItemsStore;
```
**Logique :**
- Utilise le store fourni ou par défaut
- Permet l'injection de stores spécifiques (multi-instances)
- Fallback automatique sécurisé

### Variables réactives du store
```typescript
$: collision = $currentStore.collision || 'none';
let items: Array<PageItem> = [];
```
**Logique :**
- Mode de collision extrait du store
- Items comme array local pour optimisation

## Gestion des éléments

### Filtrage des doublons
```typescript
$: {
    const seen = new Set();
    items = ($currentStore.pageItems || []).filter((item: PageItem) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}
```
**Logique :**
- Protection contre les doublons d'ID
- Utilise un Set pour performance optimale
- Évite les erreurs Svelte de clés dupliquées

### Association des composants
```typescript
$: {
    if (items && items.length > 0) {
        items.forEach((item) => {
            if (item.componentName) {
                (item as any).component = componentsMap[item.componentName] || _404_;
                if (!componentsMap[item.componentName])
                    console.warn(`composant ${item.componentName} non trouvé`);
            } else {
                (item as any).component = null;
            }
        });
    }
}
```
**Logique :**
- Résolution dynamique des composants
- Fallback sur `_404_` pour composants manquants
- Warning de développement pour debugging
- Gestion des items sans composant

## Détection de changements

### Surveillance des modifications
```typescript
let previousItems: any = {};
$: {
    if (items) {
        items.forEach((item: any) => {
            const key = item.id;
            const current = `${item.x},${item.y},${item.w},${item.h}`;
            if (previousItems[key] && previousItems[key] !== current) {
                if (debugThis) {
                    console.log(`Item ${key} changed: ${previousItems[key]} → ${current}`);
                }
            }
            previousItems[key] = current;
        });
    }
}
```
**Logique :**
- Cache des positions précédentes par ID
- Détection des changements de position/taille
- Logs de debug pour traçabilité
- Optimisation : compare seulement les propriétés critiques

### Gestion des événements de changement
```typescript
function handleItemChange(event: CustomEvent) {
    const changedItem = event.detail.item;
    if (debugThis) {
        console.log('PageGrid: Item change event received:', changedItem);
    }
    currentStore.updateItem(changedItem.id, changedItem);
}
```
**Logique :**
- Écoute les événements de changement des items
- Synchronisation automatique avec le store
- Logs conditionnels pour développement

## Configuration de la grille

### Paramètres de grille
```typescript
const itemSize = { width: 100, height: 100 };
const id_debug = '_debug_items_';
const excludeIds = [id_debug];
```
**Logique :**
- Taille fixe des cellules (100x100px)
- Exclusion de l'item de debug de l'affichage principal
- Configuration centralisée

## Template et rendu

### Structure de la grille
```svelte
<div class="grid-viewport-wrapper {classes || ''}" data-collision={collision} {style}>
    <Grid cols={0} rows={0} {itemSize} {collision}>
        <div class="content-container">
            {#each items || [] as item, i (item.id)}
                <PageGridItem
                    id={item.id}
                    bind:x={item.x}
                    bind:y={item.y}
                    bind:w={item.w}
                    bind:h={item.h}
                    {debugThis}
                    pageStore={currentStore}
                    on:change={handleItemChange}
                >
                    <slot {item} />
                </PageGridItem>
            {/each}
        </div>
    </Grid>
</div>
```
**Logique :**
- Conteneur avec attribut data-collision pour styles CSS
- Grid avec dimensions dynamiques (cols=0, rows=0)
- Boucle avec clé unique (item.id) pour performance
- Binding bidirectionnel des propriétés de position/taille
- Slot pour personnalisation du contenu de chaque item

## Styles CSS

### Styles globaux pour les éléments
```css
:global(.move-handle),
:global(.item) {
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:global(.move-handle) {
    background-color: #f0f0f0;
    cursor: grab;
    margin-bottom: 4px;
}

:global(.move-handle:active) {
    cursor: grabbing;
}
```
**Logique :**
- Styles globaux pour cohérence visuelle
- Handle de déplacement avec feedback curseur
- Styles d'état (hover, active)

### Adaptation selon le mode de collision
```css
:global(.grid-viewport-wrapper[data-collision='compress']) {
    height: calc(100vh - 50px);
    overflow-y: auto;
    overflow-x: auto;
    min-height: unset;
}

:global(.grid-viewport-wrapper[data-collision='push']) {
    height: calc(100vh - 50px);
    overflow-y: auto;
    overflow-x: auto;
    min-height: unset;
}
```
**Logique :**
- Comportement différent selon le mode de collision
- Gestion du débordement adaptée
- Hauteur calculée selon l'espace disponible

### Conteneur responsive
```css
.grid-viewport-wrapper {
    min-height: calc(100vh - 50px);
    overflow: visible;
    position: relative;
}
```
**Logique :**
- Hauteur minimale pour éviter la compression
- Débordement visible par défaut (mode 'none')
- Position relative pour contexte de positionnement

## Intégration avec PageGridItem

### Transmission des propriétés
- **Store** : passage du store spécifique
- **Debug** : transmission du flag de debug
- **Events** : écoute des changements pour synchronisation
- **Bindings** : liaison bidirectionnelle des propriétés de grille

### Slot system
```svelte
<slot {item} />
```
**Logique :**
- Expose l'item complet au composant parent
- Permet personnalisation totale du contenu
- Maintient l'accès aux données de l'item

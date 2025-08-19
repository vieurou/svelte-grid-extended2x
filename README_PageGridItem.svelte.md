# Documentation du fichier PageGridItem.svelte

## Vue d'ensemble
Composant spécialisé représentant un élément individuel dans une grille de page. Extension de GridItem avec fonctionnalités spécifiques aux pages : gestion de repliement, visibilité, en-têtes et intégration avec les stores de page.

## Props étendues

### Props héritées de GridItem
```typescript
export let id = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
export let x: number;
export let y: number;
export let w = 1;
export let h = 1;
export let min: Size = { w: 1, h: 1 };
export let max: Size | undefined = undefined;
export let movable = true;
export let resizable = true;
```
**Logique :** Mêmes propriétés de base que GridItem pour compatibilité.

### Props spécifiques aux pages
```typescript
export let name = 'Item ' + id;
export let folded = false;
export let nfh: number | undefined = w; // Normal Fold Height
export let nfw: number | undefined = h; // Normal Fold Width  
export let headed = false;
export let data: unknown = undefined;
export let cssClass: string | undefined = undefined;
export let cssStyle: string | undefined = undefined;
export let visible: boolean;
```
**Logique :**
- `name` : nom d'affichage de l'élément
- `folded` : état replié/déplié
- `nfh/nfw` : dimensions avant repliement
- `headed` : présence d'un en-tête
- `data` : données personnalisées
- `cssClass/cssStyle` : styles spécifiques
- `visible` : contrôle de visibilité

### Props de store et debug
```typescript
export let debugThis: boolean = false;
export let pageStore: any = null;
$: currentStore = pageStore || pageItemsStore;
```
**Logique :**
- Injection du store spécifique à la page
- Fallback sur store global
- Debug transmis depuis la page parent

## Synchronisation avec le store

### Synchronisation de la visibilité
```typescript
$: visible = $currentStore.pageItems.find((item: any) => item.id === id)?.visible;
$: _currentItem = $currentStore.pageItems.find((item: any) => item.id === id);
```
**Logique :**
- Récupération réactive de l'état depuis le store
- Cache de l'item complet pour optimisation
- Mise à jour automatique lors des changements

### Synchronisation des propriétés critiques
```typescript
$: movable = _currentItem?.movable ?? movable;
$: h = _currentItem?.h ?? h;
```
**Logique :**
- `movable` : contrôlé par le store (important pour lock/unlock)
- `h` : synchronisé pour gestion du repliement
- Fallback sur valeurs locales si store indisponible

## Gestion du repliement

### Logique de repliement
Le repliement fonctionne en modifiant la hauteur de l'élément :
- **État normal** : `h = nfh` (hauteur normale)
- **État replié** : `h = 1` (hauteur minimale, souvent juste l'en-tête)

### Stockage des dimensions
```typescript
export let nfh: number | undefined = w; // Stocke la hauteur non-repliée
export let nfw: number | undefined = h; // Stocke la largeur non-repliée (futur usage)
```
**Logique :**
- Conservation des dimensions originales
- Permet la restauration après dépliement
- Initialisé avec les dimensions actuelles

## Objet LayoutItem étendu

### Extension des propriétés
```typescript
let item: any = {
    // ... propriétés GridItem de base
    invalidate,
    // Props spécifiques PageItem
    name,
    folded,
    nfw,
    nfh,
    headed,
    data,
    cssClass,
    cssStyle,
    visible
};
```
**Logique :**
- Combine toutes les propriétés en un objet unifié
- Accessible aux fonctions de calcul
- Source de vérité pour l'état de l'élément

## Contrôles d'interaction

### Contrôle de déplacement
```typescript
$: _movable = !$gridParams.readOnly && _currentItem?.movable;

// Debug log pour voir la valeur de _movable
$: if (debugThis) {
    console.log(`Item ${id} - movable:`, _currentItem?.movable, '_movable:', _movable);
}
```
**Logique :**
- Respect du mode lecture seule de la grille
- Contrôle individuel par item via le store
- Logs de debug pour diagnostic

### Contrôle de redimensionnement
```typescript
$: _resizable = !$gridParams.readOnly && item.resizable;
```
**Logique :**
- Même logique que le déplacement
- Propriété locale (pas contrôlée par store)

## Actions spécialisées

### Gestion des actions d'en-tête
Le composant peut afficher des boutons d'action dans l'en-tête :
- **Repliement/dépliement**
- **Suppression**
- **Verrouillage/déverrouillage**
- **Basculement de visibilité**

### Boutons d'action typiques
```svelte
{#if headed}
    <div class="item-header">
        <span class="item-title">{name}</span>
        <div class="item-actions">
            <IconButton on:click={toggleFold}>
                {folded ? 'unfold_more' : 'unfold_less'}
            </IconButton>
            <IconButton on:click={toggleMovable}>
                {movable ? 'lock_open' : 'lock'}
            </IconButton>
            <IconButton on:click={removeItem}>delete</IconButton>
        </div>
    </div>
{/if}
```

## Logique de suppression

### Fonction de suppression
```typescript
function removeItem() {
    currentStore.removeItem(id);
}
```
**Logique :**
- Délégation au store pour suppression
- Mise à jour automatique de l'affichage
- Gestion des références et nettoyage

## Template conditionnel

### Affichage conditionnel par visibilité
```svelte
{#if visible}
    <div class="page-grid-item {cssClass || ''}" style={cssStyle || ''}>
        <!-- Contenu de l'élément -->
    </div>
{/if}
```
**Logique :**
- Rendu uniquement si `visible = true`
- Application des styles personnalisés
- Économie de ressources pour éléments cachés

## Héritage et extensibilité

### Extension de GridItem
PageGridItem hérite de toute la logique de GridItem :
- Système de déplacement
- Système de redimensionnement
- Gestion des collisions
- Preview et feedback visuel

### Ajouts spécifiques
- Intégration avec stores de page
- Gestion de la visibilité
- Support du repliement
- Actions d'en-tête
- Styles personnalisés par item

## Utilisation dans PageGrid

### Instanciation dans la boucle
```svelte
{#each items as item (item.id)}
    <PageGridItem
        {id}
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
```
**Logique :**
- Binding bidirectionnel des propriétés de grille
- Transmission du store et debug
- Écoute des changements pour synchronisation
- Slot pour contenu personnalisé

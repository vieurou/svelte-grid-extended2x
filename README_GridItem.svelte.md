# Documentation du fichier GridItem.svelte

## Vue d'ensemble
Composant représentant un élément individuel dans la grille, gérant les interactions de déplacement, redimensionnement et les collisions.

## Génération d'ID unique

### Fallback UUID
```typescript
export let id = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
```
**Logique :**
- Utilise `crypto.randomUUID()` si disponible (navigateurs modernes/HTTPS)
- Fallback personnalisé pour compatibilité (HTTP/navigateurs anciens)
- Garantit l'unicité des identifiants

## Props et configuration

### Props principales
```typescript
export let x: number;
export let y: number;
export let w = 1;
export let h = 1;
export let min: Size = { w: 1, h: 1 };
export let max: Size | undefined = undefined;
export let movable = true;
export let resizable = true;
```
**Logique :**
- Position et taille en unités de grille
- Contraintes min/max pour redimensionnement
- Contrôles d'interaction individuels

### Classes CSS personnalisables
```typescript
export let classes: string | undefined = undefined;
export let activeClass: string | undefined = undefined;
export let previewClass: string | undefined = undefined;
export let resizerClass: string | undefined = undefined;
```
**Logique :**
- Système de classes modulaire
- Personnalisation visuelle par état
- Intégration avec frameworks CSS

## Logique d'état

### Objet LayoutItem
```typescript
let item = {
    invalidate
} as LayoutItem;

$: item.x = x;
$: item.y = y;
// ... autres propriétés
$: item, invalidate();
```
**Logique :**
- Synchronisation réactive des props avec l'objet interne
- `invalidate()` déclenche le recalcul de position/taille
- Item comme source de vérité pour les calculs

### Fonction invalidate
```typescript
function invalidate() {
    // Recalcul position/taille en pixels
    // Enregistrement dans la grille
    // Mise à jour de l'affichage
}
```
**Logique :**
- Point central pour tous les recalculs
- Conversion unités grille → pixels
- Synchronisation avec le contexte grille

## Système de déplacement

### Initialisation du déplacement
```typescript
function moveStart(event: PointerEvent) {
    if (!_movable) return;
    
    active = true;
    // Capture position initiale
    initialPosition = { left, top };
    initialPointerPosition = { left: event.clientX, top: event.clientY };
    
    // Setup event listeners
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', moveEnd);
}
```
**Logique :**
- Vérification des permissions de déplacement
- Capture des positions de référence
- Setup des écouteurs globaux pour suivre la souris

### Logique de déplacement
```typescript
function move(event: PointerEvent) {
    // Calcul du décalage
    const deltaX = event.clientX - initialPointerPosition.left;
    const deltaY = event.clientY - initialPointerPosition.top;
    
    // Application du décalage
    const newLeft = initialPosition.left + deltaX;
    const newTop = initialPosition.top + deltaY;
    
    // Conversion en coordonnées grille
    const newX = Math.round(newLeft / ($gridParams.itemSize.width + $gridParams.gap));
    const newY = Math.round(newTop / ($gridParams.itemSize.height + $gridParams.gap));
    
    // Gestion des collisions selon le mode
    movePreviewWithCollisions(newX, newY);
}
```
**Logique :**
- Calcul des deltas de mouvement
- Conversion pixels → unités grille avec snapping
- Délégation à la gestion de collision appropriée

## Gestion des collisions

### Mode 'push'
```typescript
function movePreviewWithCollisionsWithPush(x: number, y: number) {
    // Test placement à la nouvelle position
    const testItem = { ...previewItem, x, y };
    const collisions = getCollisions(testItem, Object.values($gridParams.items));
    
    if (collisions.length > 0) {
        // Pousser chaque élément en collision
        collisions.forEach(collItem => {
            updateCollItemPositionWithPush(collItem, Object.values($gridParams.items));
        });
    }
    
    // Appliquer la nouvelle position
    previewItem.x = x;
    previewItem.y = y;
}
```
**Logique :**
- Détection des collisions à la position cible
- Déplacement récursif des éléments en collision
- Application de la position après résolution

### Mode 'compress'
```typescript
function movePreviewWithCollisionsWithCompress(x: number, y: number) {
    // Placement temporaire
    previewItem.x = x;
    previewItem.y = y;
    
    // Compression automatique si collision
    const hasCollision = hasCollisions(previewItem, Object.values($gridParams.items));
    if (hasCollision) {
        $gridParams.controller._internalCompress();
    }
}
```
**Logique :**
- Placement direct puis compression
- Utilise le contrôleur pour réorganiser
- Optimise l'espace automatiquement

### Finalisation du déplacement
```typescript
function moveEnd(event: PointerEvent) {
    active = false;
    
    // Application des changements
    applyPreview();
    
    // Nettoyage des événements
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', moveEnd);
    
    // Compression finale si nécessaire
    if ($gridParams.collision === 'compress' && $gridParams.autoCompress) {
        compressItems();
    }
}
```
**Logique :**
- Désactivation du mode actif
- Application finale des changements
- Nettoyage des écouteurs d'événements
- Compression post-déplacement

## Système de redimensionnement

### Logique similaire au déplacement
```typescript
function resizeStart(event: PointerEvent) {
    // Capture taille initiale
    // Setup des contraintes min/max
    // Activation du mode resize
}

function resize(event: PointerEvent) {
    // Calcul des nouvelles dimensions
    // Application des contraintes
    // Gestion des collisions de redimensionnement
}
```
**Logique :**
- Mêmes principes que le déplacement
- Respect des contraintes de taille
- Gestion spécialisée des collisions de redimensionnement

## Preview et feedback visuel

### Élément de prévisualisation
```svelte
{#if active && $gridParams.itemSize}
    {@const preview = calcPosition(previewItem, { gap: $gridParams.gap })}
    <div
        class="item-preview-default {previewClass}"
        style="position: absolute; left: {preview.left}px; top: {preview.top}px; 
               width: {preview.width}px; height: {preview.height}px; z-index: -10;"
    />
{/if}
```
**Logique :**
- Affichage conditionnel pendant l'interaction
- Position calculée en temps réel
- Z-index négatif pour passer sous l'élément principal
- Feedback visuel de la position finale

## Slots et personnalisation

### Handle de déplacement personnalisé
```svelte
{#if _movable}
    <slot name="moveHandle" {moveStart} />
{/if}
```
**Logique :**
- Permet de personnaliser la zone de déplacement
- Expose la fonction `moveStart` au slot
- Déplacement sur tout l'élément si pas de handle personnalisé

### Contenu principal
```svelte
<slot {id} {active} {w} {h} />
```
**Logique :**
- Expose l'état de l'élément au contenu
- Permet l'adaptation du contenu selon l'état
- Facilite les interactions conditionnelles

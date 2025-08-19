# Logique de Déplacement et Taille des Items

## Vue d'ensemble
Cette documentation explique en détail la logique de déplacement des éléments dans la grille et la gestion de leur taille, avec ou sans en-têtes.

## Système de Coordonnées

### Unités de Grille vs Pixels
```typescript
// Unités de grille (logiques)
type Position = { x: number; y: number };  // Position en cellules
type Size = { w: number; h: number };      // Taille en cellules

// Unités pixels (rendu)
type ItemPosition = { left: number; top: number };  // Position absolue
type ItemSize = { width: number; height: number };  // Taille réelle
```

### Conversion Grille → Pixels
```typescript
function calcPosition(item: LayoutItem, { itemSize, gap }): ItemPosition & ItemSize {
    return {
        left: item.x * (itemSize.width + gap),
        top: item.y * (itemSize.height + gap),
        width: item.w * itemSize.width + (item.w - 1) * gap,
        height: item.h * itemSize.height + (item.h - 1) * gap
    };
}
```
**Logique :**
- Position : `cellule × (taille_cellule + gap)`
- Taille : `nb_cellules × taille_cellule + (nb_cellules - 1) × gap`
- Le gap n'est pas compté pour la dernière cellule

## Déplacement des Éléments

### Phase 1 : Initialisation du Déplacement

#### Capture des Positions de Référence
```typescript
function moveStart(event: PointerEvent) {
    if (!_movable) return;
    
    active = true;
    
    // Position initiale de l'élément (en pixels)
    initialPosition = { left, top };
    
    // Position initiale du pointeur
    initialPointerPosition = { 
        left: event.clientX, 
        top: event.clientY 
    };
    
    // Activation des écouteurs globaux
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', moveEnd);
}
```
**Logique :**
1. **Vérification permissions** : `_movable` combine readonly de la grille et movable de l'item
2. **État actif** : `active = true` déclenche l'affichage de preview
3. **Positions de référence** : nécessaires pour calculer les deltas
4. **Écouteurs globaux** : permettent de suivre la souris même hors de l'élément

### Phase 2 : Déplacement en Cours

#### Calcul des Deltas et Snapping
```typescript
function move(event: PointerEvent) {
    // Calcul du déplacement en pixels
    const deltaX = event.clientX - initialPointerPosition.left;
    const deltaY = event.clientY - initialPointerPosition.top;
    
    // Application du déplacement
    const newLeft = initialPosition.left + deltaX;
    const newTop = initialPosition.top + deltaY;
    
    // Conversion en coordonnées grille avec snapping
    const snapParams: SnapGridParams = {
        itemSize: $gridParams.itemSize,
        gap: $gridParams.gap
    };
    
    const snapped = snapOnMove({ left: newLeft, top: newTop }, snapParams);
    const newX = snapped.x;
    const newY = snapped.y;
    
    // Application selon le mode de collision
    movePreviewWithCollisions(newX, newY);
}
```
**Logique :**
1. **Delta calculation** : différence entre position actuelle et initiale du pointeur
2. **Position absolue** : position initiale + delta
3. **Snapping** : conversion pixels → grille avec magnétisme aux cellules
4. **Gestion collision** : délégation selon le mode configuré

#### Fonction de Snapping
```typescript
function snapOnMove(position: ItemPosition, params: SnapGridParams): Position {
    const { itemSize, gap } = params;
    const cellWidth = itemSize.width + gap;
    const cellHeight = itemSize.height + gap;
    
    return {
        x: Math.round(position.left / cellWidth),
        y: Math.round(position.top / cellHeight)
    };
}
```
**Logique :**
- Division par la taille totale d'une cellule (taille + gap)
- `Math.round()` pour snapping au plus proche
- Résultat en coordonnées de grille entières

### Phase 3 : Gestion des Collisions

#### Mode 'none' - Pas de Gestion
```typescript
function movePreviewWithCollisions(x: number, y: number) {
    if ($gridParams.collision === 'none') {
        previewItem.x = x;
        previewItem.y = y;
        return;
    }
    // ... autres modes
}
```
**Logique :** Application directe sans vérification de collision.

#### Mode 'push' - Poussée des Éléments
```typescript
function movePreviewWithCollisionsWithPush(x: number, y: number) {
    const testItem = { ...previewItem, x, y };
    const collisions = getCollisions(testItem, Object.values($gridParams.items));
    
    if (collisions.length > 0) {
        collisions.forEach(collItem => {
            updateCollItemPositionWithPush(collItem, Object.values($gridParams.items));
        });
    }
    
    previewItem.x = x;
    previewItem.y = y;
}

function updateCollItemPositionWithPush(collItem: LayoutItem, items: LayoutItem[]) {
    // Calcul de la direction de poussée
    const direction = calculatePushDirection(previewItem, collItem);
    
    // Nouvelle position de l'élément poussé
    let newX = collItem.x;
    let newY = collItem.y;
    
    switch (direction) {
        case 'down':
            newY = previewItem.y + previewItem.h;
            break;
        case 'up':
            newY = previewItem.y - collItem.h;
            break;
        case 'right':
            newX = previewItem.x + previewItem.w;
            break;
        case 'left':
            newX = previewItem.x - collItem.w;
            break;
    }
    
    // Vérification des limites et application
    if (isWithinBounds(newX, newY, collItem) && !hasCollisions({...collItem, x: newX, y: newY}, items)) {
        collItem.x = newX;
        collItem.y = newY;
        collItem.invalidate();
    }
}
```
**Logique :**
1. **Détection collision** : test de la nouvelle position
2. **Calcul direction** : vers où pousser l'élément en collision
3. **Déplacement récursif** : chaque élément poussé peut en pousser d'autres
4. **Validation** : respect des limites et évitement des collisions en chaîne

#### Mode 'compress' - Compression Automatique
```typescript
function movePreviewWithCollisionsWithCompress(x: number, y: number) {
    previewItem.x = x;
    previewItem.y = y;
    
    // Vérification de collision après placement
    const hasCollision = hasCollisions(previewItem, Object.values($gridParams.items));
    if (hasCollision) {
        // Compression de tous les éléments
        $gridParams.controller._internalCompress();
    }
}
```
**Logique :**
1. **Placement direct** : pas de vérification préalable
2. **Compression post-placement** : réorganisation si collision détectée
3. **Optimisation globale** : tous les éléments sont repositionnés pour minimiser l'espace

### Phase 4 : Finalisation du Déplacement

```typescript
function moveEnd(event: PointerEvent) {
    active = false;
    
    // Application définitive des changements
    applyPreview();
    
    // Nettoyage des écouteurs
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', moveEnd);
    
    // Compression finale si nécessaire
    if ($gridParams.collision === 'compress' && $gridParams.autoCompress) {
        compressItems();
    }
    
    // Notification des changements
    dispatch('change', { item });
}

function applyPreview() {
    x = previewItem.x;
    y = previewItem.y;
    w = previewItem.w;
    h = previewItem.h;
    invalidate();
}
```
**Logique :**
1. **Désactivation preview** : `active = false`
2. **Application finale** : transfert preview → item réel
3. **Nettoyage** : suppression des écouteurs
4. **Post-traitement** : compression finale si activée
5. **Événements** : notification du changement pour synchronisation

## Redimensionnement des Éléments

### Contraintes de Taille

#### Tailles Minimales et Maximales
```typescript
export let min: Size = { w: 1, h: 1 };
export let max: Size | undefined = undefined;

// Conversion en pixels pour les contraintes de redimensionnement
$: if ($gridParams.itemSize) {
    minSize = {
        width: min.w * $gridParams.itemSize.width + (min.w - 1) * $gridParams.gap,
        height: min.h * $gridParams.itemSize.height + (min.h - 1) * $gridParams.gap
    };
}

$: if ($gridParams.itemSize && max) {
    maxSize = {
        width: max.w * $gridParams.itemSize.width + (max.w - 1) * $gridParams.gap,
        height: max.h * $gridParams.itemSize.height + (max.h - 1) * $gridParams.gap
    };
}
```
**Logique :**
- Contraintes définies en unités de grille
- Conversion automatique en pixels pour l'interface
- Minimum par défaut : 1×1 cellule

### Logique de Redimensionnement

#### Initialisation
```typescript
function resizeStart(event: PointerEvent) {
    if (!_resizable) return;
    
    active = true;
    initialSize = { width, height };
    initialPointerPosition = { left: event.clientX, top: event.clientY };
    
    document.addEventListener('pointermove', resize);
    document.addEventListener('pointerup', resizeEnd);
}
```

#### Calcul des Nouvelles Dimensions
```typescript
function resize(event: PointerEvent) {
    const deltaX = event.clientX - initialPointerPosition.left;
    const deltaY = event.clientY - initialPointerPosition.top;
    
    let newWidth = initialSize.width + deltaX;
    let newHeight = initialSize.height + deltaY;
    
    // Application des contraintes
    if (minSize) {
        newWidth = Math.max(newWidth, minSize.width);
        newHeight = Math.max(newHeight, minSize.height);
    }
    
    if (maxSize) {
        newWidth = Math.min(newWidth, maxSize.width);
        newHeight = Math.min(newHeight, maxSize.height);
    }
    
    // Conversion en unités de grille
    const snapParams: SnapGridParams = { itemSize: $gridParams.itemSize, gap: $gridParams.gap };
    const snapped = snapOnResize({ width: newWidth, height: newHeight }, snapParams);
    
    resizePreviewWithCollisions(snapped.w, snapped.h);
}
```
**Logique :**
1. **Delta calculation** : évolution de la taille
2. **Application contraintes** : respect min/max
3. **Snapping** : conversion en unités de grille entières
4. **Gestion collision** : adaptation selon le mode

## Gestion des En-têtes

### Impact sur la Taille Effective

#### Sans En-tête
```typescript
// Tout l'espace disponible pour le contenu
contentHeight = totalHeight;
```

#### Avec En-tête
```typescript
// Espace réduit pour le contenu
const headerHeight = 32; // pixels, hauteur fixe
contentHeight = totalHeight - headerHeight;
```

### Logique de Repliement

#### État Normal
```typescript
// L'élément occupe sa taille complète
h = nfh; // Normal Fold Height
visible = true;
headed = true;
```

#### État Replié
```typescript
// L'élément n'affiche que l'en-tête
h = 1; // Taille minimale (généralement l'en-tête seul)
nfh = previousHeight; // Sauvegarde de la hauteur normale
folded = true;
```

#### Basculement Replié/Déplié
```typescript
function toggleFold() {
    if (folded) {
        // Dépliement : restauration de la taille
        h = nfh || 2; // Fallback si nfh non défini
        folded = false;
    } else {
        // Repliement : sauvegarde et réduction
        nfh = h;
        h = 1;
        folded = true;
    }
    
    invalidate(); // Mise à jour du rendu
    
    // Compression après repliement/dépliement si mode compress actif
    if ($gridParams.collision === 'compress' && $gridParams.autoCompress) {
        $gridParams.controller.compress();
    }
}
```

### Calcul de la Zone de Contenu

#### Avec En-tête et Repliement
```typescript
function calculateContentArea(item: PageItem): { width: number; height: number } {
    const totalArea = calcPosition(item, { itemSize: $gridParams.itemSize, gap: $gridParams.gap });
    
    let contentHeight = totalArea.height;
    
    // Soustraction de l'en-tête si présent
    if (item.headed) {
        const headerHeight = 32;
        contentHeight -= headerHeight;
    }
    
    // Si replié, pas de contenu visible
    if (item.folded) {
        contentHeight = 0;
    }
    
    return {
        width: totalArea.width,
        height: Math.max(0, contentHeight)
    };
}
```
**Logique :**
1. **Calcul taille totale** : selon position dans la grille
2. **Soustraction en-tête** : si `headed = true`
3. **Gestion repliement** : contenu masqué si `folded = true`
4. **Validation** : hauteur minimale de 0

## Optimisations et Performance

### Throttling des Événements
```typescript
let moveThrottleId: number | null = null;

function move(event: PointerEvent) {
    if (moveThrottleId !== null) {
        cancelAnimationFrame(moveThrottleId);
    }
    
    moveThrottleId = requestAnimationFrame(() => {
        // Logique de déplacement
        moveThrottleId = null;
    });
}
```
**Logique :** Limitation des recalculs à 60fps pour fluidité.

### Mise en Cache des Calculs
```typescript
let cachedPosition: ItemPosition | null = null;
let lastItemState: string = '';

function invalidate() {
    const currentState = `${x},${y},${w},${h}`;
    if (currentState !== lastItemState) {
        cachedPosition = null;
        lastItemState = currentState;
        // Recalcul nécessaire
    }
}
```
**Logique :** Éviter les recalculs inutiles si l'état n'a pas changé.

### Compression Différée
```typescript
function compressItems() {
    if (compressionTimeout) {
        clearTimeout(compressionTimeout);
    }
    
    compressionTimeout = setTimeout(() => {
        $gridParams.controller.compress();
        compressionTimeout = null;
    }, 100); // Délai de 100ms
}
```
**Logique :** Grouper les compressions multiples en une seule opération.

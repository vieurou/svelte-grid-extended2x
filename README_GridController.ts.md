# Documentation du fichier GridController.ts

## Vue d'ensemble
Classe contrôleur qui gère la logique avancée de la grille, notamment la compression automatique et la recherche de positions disponibles.

## Structure de la classe

### Constructeur et propriétés
```typescript
export class GridController implements GridControllerType {
    gridParams: GridParams;
    
    constructor(gridParams: GridParams) {
        this.gridParams = gridParams;
    }
}
```
**Logique :**
- Implémente l'interface `GridControllerType`
- Stocke une référence aux paramètres de grille
- Permet la mise à jour dynamique des paramètres

## Méthodes principales

### `getFirstAvailablePosition(w: number, h: number)`
```typescript
getFirstAvailablePosition(w: number, h: number) {
    const { items, maxCols, maxRows } = this.gridParams;
    return getAvailablePosition(
        {
            id: '',
            x: 0,
            y: 0,
            w, h,
            movable: true,
            resizable: true,
            invalidate: () => {/* .. */}
        },
        Object.values(items),
        maxCols, maxRows
    );
}
```
**Logique :**
- Trouve la première position libre pour un élément de taille donnée
- Crée un élément temporaire pour tester les positions
- Utilise les utilitaires de grille pour calculer la position
- Respecte les limites `maxCols` et `maxRows`

### `compress()` et `_internalCompress()`
```typescript
compress(): void {
    this._compress(this.gridParams.items);
}

_internalCompress(): void {
    this._compress(this.gridParams.items, true);
}
```
**Logique :**
- `compress()` : compression publique avec mise à jour UI
- `_internalCompress()` : compression interne sans mise à jour UI
- Délègue à la méthode privée `_compress()`

### `_compress(items, skipUpdate)` - Algorithme de compression
```typescript
private _compress(items: Record<string, LayoutItem>, skipUpdate = false): void {
    const gridItems = Object.values(items);
    const sortedItems = [...gridItems].sort((a, b) => a.y - b.y);

    sortedItems.reduce((accItem, currentItem) => {
        let newY = currentItem.y;
        while (newY >= 0) {
            if (hasCollisions({ ...currentItem, y: newY }, accItem)) {
                break;
            }
            newY--;
        }
        if (newY !== currentItem.y - 1) {
            currentItem.y = newY + 1;
            currentItem.invalidate();
        }
        accItem.push(currentItem);
        return accItem;
    }, [] as LayoutItem[]);

    if (!skipUpdate) {
        this.gridParams.updateGrid();
    }
}
```

**Logique détaillée de l'algorithme :**

1. **Tri des éléments :**
   - Trie par position Y (de haut en bas)
   - Assure un traitement ordonné pour éviter les conflits

2. **Traitement séquentiel :**
   - Utilise `reduce()` avec accumulateur des éléments déjà traités
   - Chaque élément est testé contre ceux déjà placés

3. **Recherche de position optimale :**
   - Part de la position actuelle (`currentItem.y`)
   - Descend ligne par ligne (`newY--`) jusqu'à trouver une collision
   - S'arrête dès qu'une collision est détectée

4. **Placement final :**
   - Place l'élément à `newY + 1` (dernière position sans collision)
   - Appelle `invalidate()` pour déclencher le re-rendu
   - Ajoute l'élément à l'accumulateur pour les tests suivants

5. **Mise à jour conditionnelle :**
   - Si `skipUpdate = false` : déclenche `updateGrid()` pour mettre à jour l'UI
   - Si `skipUpdate = true` : compression silencieuse (optimisation)

## Utilisation dans le système

**Dans Grid.svelte :**
```javascript
const _controller = new GridController($gridSettings);
export const controller = _controller as GridControllerType;
```

**Auto-compression :**
- Activée quand `collision === 'compress'` et `autoCompress === true`
- Appelée automatiquement lors des changements d'éléments

**Logique de performance :**
- `_internalCompress()` utilisée durant les opérations multiples
- `compress()` utilisée pour les actions utilisateur uniques
- Évite les re-rendus inutiles pendant les calculs complexes

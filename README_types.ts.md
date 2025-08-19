# Documentation du fichier types.ts

## Vue d'ensemble
Ce fichier centralise toutes les définitions de types TypeScript utilisées dans le système de grille. Il définit les structures de données fondamentales pour la gestion des éléments de grille, leurs positions, tailles et comportements.

## Types de base

### `Size`
```typescript
export type Size = { w: number; h: number };
```
**Logique :** Représente les dimensions d'un élément en unités de grille (largeur/hauteur en nombre de cellules).

### `Position`
```typescript
export type Position = { x: number; y: number };
```
**Logique :** Définit la position d'un élément dans la grille en coordonnées (colonne x, ligne y).

### `ItemPosition` et `ItemSize`
```typescript
export type ItemPosition = { left: number; top: number };
export type ItemSize = { width: number; height: number };
```
**Logique :** Conversion des unités de grille en pixels pour le rendu DOM. ItemPosition pour la position absolue, ItemSize pour les dimensions réelles.

## Types de grille

### `LayoutItem`
```typescript
export type LayoutItem = Size & Position & {
    id: string;
    min?: Size;
    max?: Size;
    movable: boolean;
    resizable: boolean;
    invalidate: () => void;
};
```
**Logique :**
- Combine position et taille
- `id` : identifiant unique obligatoire
- `min/max` : contraintes de taille optionnelles
- `movable/resizable` : contrôlent les interactions utilisateur
- `invalidate()` : fonction de mise à jour du rendu

### `GridParams`
**Logique :** Configuration complète de la grille incluant :
- Dimensions (`cols`, `rows`)
- Taille des cellules (`itemSize`)
- Espacement (`gap`)
- Limites (`bounds`, `maxCols`, `maxRows`)
- État (`readOnly`, `debug`)
- Gestion des collisions (`collision`)
- Registre des éléments (`items`)
- Fonctions de gestion (`registerItem`, `unregisterItem`, `updateGrid`)
- Système d'événements (`dispatch`)

## Types spécialisés

### `SvelteComposant`
```typescript
export type SvelteComposant = {
    componentName?: string;
    props?: object | null;
};
```
**Logique :** Permet d'associer un composant Svelte à un élément de grille avec ses propriétés.

### `TextOnItem`
```typescript
export type TextOnItem = {
    text?: string | null;
    preComponentText?: string | null;
    postComponentText?: string | null;
};
```
**Logique :** Gestion du texte autour des composants (avant, dans, après).

### `Fold`
```typescript
export type Fold = {
    folded: boolean;
    nfw?: number | undefined;
    nfh?: number | undefined;
};
```
**Logique :** 
- `folded` : état replié/déplié
- `nfw/nfh` : dimensions non-repliées (normal fold width/height)

### `PageItem`
```typescript
export type PageItem = LayoutItem & Fold & SvelteComposant & TextOnItem & {
    name: string;
    headed?: boolean;
    visible?: boolean;
    cssClass?: string;
    cssStyle?: string;
};
```
**Logique :** Type composite qui hérite de tous les autres types pour créer un élément de page complet avec :
- Toutes les propriétés de grille (`LayoutItem`)
- Capacité de repliement (`Fold`)
- Composant Svelte associé (`SvelteComposant`)
- Gestion de texte (`TextOnItem`)
- Métadonnées supplémentaires (nom, en-tête, visibilité, styles)

## Types utilitaires

### `Collision`
```typescript
export type Collision = 'none' | 'push' | 'compress';
```
**Logique :** Stratégies de gestion des collisions entre éléments :
- `'none'` : pas de gestion automatique
- `'push'` : pousse les éléments en collision
- `'compress'` : compacte automatiquement la grille

### `Breakpoints`
```typescript
export type Breakpoints = Record<BreakpointKey, number>;
```
**Logique :** Configuration responsive avec points de rupture pour différentes tailles d'écran.

### `ComponentsMap`
```typescript
export type ComponentsMap = Record<string, any>;
```
**Logique :** Dictionnaire associant les noms de composants aux classes de composants Svelte.

## Objet par défaut

### `defaultPageItem`
**Logique :** Valeurs par défaut pour créer un nouveau PageItem :
- Position (0,0)
- Taille 1x1
- Non déplaçable par défaut (sécurité)
- Redimensionnable
- Visible et non replié

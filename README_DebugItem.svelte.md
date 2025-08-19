# Documentation du fichier DebugItem.svelte

## Vue d'ensemble
Composant utilitaire pour l'affichage et la copie des données d'éléments à des fins de débogage.

## Structure du composant

### Imports et extensions
```javascript
import '$extensions/string.extension.js';
import { copyToClipboard } from './utils/clipboard';
import Button from '@smui/button';
```
**Logique :**
- Extension de chaînes personnalisée
- Utilitaire de copie dans le presse-papiers
- Composant bouton de SMUI

### Props d'entrée
```javascript
export let excludeIds: Array<string> = [];
export let items: any;
```
**Logique :**
- `excludeIds` : tableau d'identifiants à exclure de l'affichage
- `items` : données à afficher (généralement array d'éléments)

### Logique de filtrage
```javascript
$: itemsToShow = items.filter((item: any) => !excludeIds.includes(item.id));
```
**Logique réactive :**
- Filtre automatiquement les éléments selon `excludeIds`
- Met à jour l'affichage quand `items` ou `excludeIds` changent
- Utilisé typiquement pour exclure l'élément de debug lui-même

### Template et fonctionnalité
```svelte
<Button on:click={() => {
    copyToClipboard(JSON.stringify(itemsToShow, null, 2));
}}>Copier</Button>

<pre>
    {JSON.stringify(itemsToShow, null, 2)}        
</pre>
```
**Logique d'interface :**
- Bouton "Copier" qui place les données JSON dans le presse-papiers
- Affichage formaté des données en JSON avec indentation
- `<pre>` preserve la mise en forme JSON

## Utilisation dans le système
Ce composant est utilisé dans `PageGrid.svelte` et `PageMenu.svelte` pour :
- Afficher l'état actuel des éléments de la grille
- Permettre la copie facile des données pour débogage
- Exclure l'élément de debug lui-même de l'affichage

**Cas d'usage typique :**
```javascript
const id_debug = '_debug_items_';
const excludeIds = [id_debug];
```

**Logique de débogage :**
- Facilite l'inspection des données en temps réel
- Permet le partage facile des états pour support technique
- Aide au développement et à la résolution de problèmes

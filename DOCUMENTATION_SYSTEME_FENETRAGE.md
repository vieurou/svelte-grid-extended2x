# Documentation du Système de Fenêtrage Multi-Onglets

## Vue d'ensemble du Système

Ce projet implémente un **système de fenêtrage dynamique et persistant** basé sur Svelte, permettant de créer des interfaces utilisateur avec des éléments repositionnables et redimensionnables, organisés en grille. Le système supporte les **onglets multiples** avec des espaces de noms isolés pour chaque page.

## Architecture Globale

### Composants Principaux

1. **Grid.svelte** : Conteneur principal de la grille
2. **GridItem.svelte** : Élément de base de la grille
3. **Page.svelte** : Wrapper d'une page complète avec menu + grille
4. **PageGrid.svelte** : Spécialisation de Grid pour les pages
5. **PageGridItem.svelte** : Spécialisation de GridItem pour les pages
6. **PageMenu.svelte** : Menu de contrôle d'une page

### Stores de Données

1. **multiPageItems.store.ts** : Store multi-instances avec namespaces
2. **pageItems.store.ts** : Store simple pour une seule page
3. **persistent.store.ts** : Système de persistance localStorage
4. **snackBar.store.ts** : Notifications utilisateur

## Système de Stores Multi-Instances

### Logique du multiPageItems.store.ts

```typescript
// Structure des données par namespace
interface NamespaceData {
    pageItems: PageItem[];      // Items actuels
    itemsBackup: PageItem[];    // Sauvegarde pour reset
    hiddenItems: PageItem[];    // Items cachés
    collision: string;          // Type de collision ('none', 'push', 'compress')
}
```

**Fonctionnement :**
- Un store global contient tous les namespaces : `Record<string, NamespaceData>`
- Chaque page/onglet a son propre namespace (ex: "basique", "avance")
- `getNamespaceStore(namespace)` retourne un store isolé pour ce namespace
- `createNamespaceMethods(namespace)` fournit toutes les méthodes CRUD

**Avantages :**
- Isolation complète des données entre onglets
- Persistance automatique via localStorage
- API unifiée pour toutes les instances

### Comparaison avec pageItems.store.ts

**pageItems.store.ts** : Store simple, une seule instance globale
**multiPageItems.store.ts** : Store multi-instances avec namespaces

```typescript
// Utilisation pageItems (ancienne version)
pageItemsStore.setItems(items);

// Utilisation multiPageItems (nouvelle version)
const storeInstance = multiPageItemsStore.getStore("monOnglet");
storeInstance.setItems(items);
```

## Architecture des Composants

### Grid.svelte - Le Cœur du Système

**Responsabilités :**
- Calcul des dimensions de la grille (cols, rows)
- Gestion des breakpoints responsifs
- Contexte global pour tous les GridItem
- Détection automatique de la taille des containers

**Props essentielles :**
```typescript
cols: GridSize = 0;           // 0 = taille automatique
rows: GridSize = 0;           // 0 = expansion automatique  
itemSize: { width: 100, height: 100 }
gap = 10;                     // Espacement entre items
collision: 'none' | 'push' | 'compress'
```

**Contexte fourni :**
```typescript
const gridParams = {
    cols, rows, itemSize, gap, collision,
    items: Record<string, LayoutItem>,
    updateGrid: () => void
}
```

### GridController.ts - Logique de Positionnement

**Rôle :** Algorithmes de placement et de compression des items

**Méthodes clés :**
- `getFirstAvailablePosition(w, h)` : Trouve la première position libre
- `compress()` : Compacte tous les items vers le haut
- `_internalCompress()` : Compression sans mise à jour (optimisation)

**Algorithme de compression :**
1. Trier les items par position (y puis x)
2. Pour chaque item, chercher la position la plus haute possible
3. Déplacer l'item si une meilleure position existe
4. Mettre à jour la grille

### GridItem.svelte vs PageGridItem.svelte

**GridItem.svelte :** Composant de base
- Gestion des interactions (drag, resize)
- Calcul des collisions
- Positionnement CSS

**PageGridItem.svelte :** Spécialisation pour les pages
- Support des composants Svelte dynamiques
- Gestion du mode "replié/déplié" 
- Headers avec titres
- Intégration avec les stores de pages

## Système de Pages

### Page.svelte - Orchestrateur Principal

**Rôle :** Coordonne le menu et la grille d'une page

**Props importantes :**
```typescript
pageId: string;               // Identifiant unique (namespace)
pageItems: Array<PageItem>;   // Items initiaux
componentsMap: ComponentsMap; // Mapping des composants
```

**Logique d'initialisation :**
```typescript
// Sélection du store selon le contexte
$: {
    if (pageId && pageId !== 'pageTemplate') {
        // Utiliser le store multi-instances
        currentPageStore = multiPageItemsStore.getStore(pageId);
    } else {
        // Fallback sur le store simple
        currentPageStore = pageItemsStore;
    }
}
```

### PageGrid.svelte - Grille Spécialisée

**Rôle :** Affichage de la grille avec les PageGridItem

**Fonctionnalités :**
- Filtrage des doublons d'ID
- Assignation automatique des composants
- Gestion des items debug
- Styles adaptatifs selon le type de collision

### PageMenu.svelte - Interface de Contrôle

**Fonctionnalités :**
- Sauvegarde/chargement des dispositions
- Gestion des items cachés
- Contrôles de collision
- Debug et monitoring

## Types de Données

### PageItem - Structure d'un Élément

```typescript
interface PageItem {
    // Identification
    id: string;
    name?: string;
    
    // Position et taille
    x: number; y: number;
    w: number; h: number;
    
    // Contraintes
    min?: Size;
    max?: Size;
    
    // Comportements
    movable: boolean;
    resizable: boolean;
    visible: boolean;
    
    // Mode replié
    folded: boolean;
    nfh?: number;    // Hauteur normale (quand déplié)
    nfw?: number;    // Largeur normale (quand déplié)
    
    // Contenu
    text?: string;
    componentName?: string;
    props?: Record<string, any>;
    preComponentText?: string;
    postComponentText?: string;
    
    // Styles
    cssClass?: string;
    cssStyle?: string;
    
    // UI
    headed: boolean;  // Afficher le header
}
```

## Système de Collision

### Types de Collision

1. **'none'** : Pas de détection de collision, les items peuvent se superposer
2. **'push'** : Les items poussent les autres quand ils se déplacent
3. **'compress'** : Compression automatique pour éviter les espaces vides

### Algorithmes de Collision

**Détection :**
```typescript
function hasCollisions(item: LayoutItem, items: LayoutItem[]): boolean {
    return items.some(otherItem => 
        item.id !== otherItem.id &&
        item.x < otherItem.x + otherItem.w &&
        item.x + item.w > otherItem.x &&
        item.y < otherItem.y + otherItem.h &&
        item.y + item.h > otherItem.y
    );
}
```

## Persistance des Données

### persistent.store.ts - Mécanisme de Base

```typescript
export function persistentStore(key: string, initialValue: any) {
    // Lecture initiale depuis localStorage
    const storedValue = browser ? localStorage.getItem(key) : null;
    const data = storedValue ? JSON.parse(storedValue) : initialValue;
    
    const store = writable(data);
    
    // Sauvegarde automatique à chaque changement
    if (browser) {
        store.subscribe((value) => {
            const serializedValue = JSON.stringify(value, (key, value) => {
                if (key === 'component') {
                    return undefined; // Exclure les composants non sérialisables
                }
                return value;
            });
            localStorage.setItem(key, serializedValue);
        });
    }
    
    return store;
}
```

### Stratégie de Persistance

- **Clé unique par store :** 'multiPageItems', 'pageItems'
- **Sérialisation JSON** avec exclusion des propriétés non sérialisables
- **Chargement automatique** au démarrage de l'application
- **Sauvegarde en temps réel** à chaque modification

## Gestion des Composants Dynamiques

### ComponentsMap - Mapping des Composants

```typescript
type ComponentsMap = Record<string, any>;

// Exemple d'utilisation
const componentsMap = {
    'HelloWorld': HelloWorld,
    'ByeByeWorld': ByeByeWorld
};
```

### Rendu Dynamique dans PageGridItem

```typescript
// Recherche du composant
$: if (componentName && componentsMap[componentName]) {
    component = componentsMap[componentName];
} else if (componentName) {
    console.warn(`Composant ${componentName} non trouvé`);
    component = null;
}

// Rendu conditionnel
{#if component}
    <svelte:component this={component} {...(props || {})} />
{:else if componentName}
    <_404_ message="Composant {componentName} introuvable" />
{/if}
```

## Exemple Concret : Système d'Onglets

### Structure de l'Exemple gridPageTabBar

```typescript
// Configuration des onglets
let keyedTabs = [
    { k: 0, icon: 'dashboard', label: 'Onglet Basique' },
    { k: 1, icon: 'widgets', label: 'Onglet Avancé' }
];

// Items spécifiques à chaque onglet
const pageItemsBasique = [/* items simples */];
const pageItemsAvance = [/* items complexes */];
```

### Rendu Conditionnel des Onglets

```svelte
<!-- ONGLET BASIQUE -->
<div style="display: {keyedTabsActive.k === 0 ? 'block' : 'none'}">
    <Page
        pageId="basique"
        pageItems={pageItemsBasique}
        {componentsMap}
    />
</div>

<!-- ONGLET AVANCÉ -->
<div style="display: {keyedTabsActive.k === 1 ? 'block' : 'none'}">
    <Page
        pageId="avance"
        pageItems={pageItemsAvance}
        {componentsMap}
    />
</div>
```

## Points Clés du Système

### Avantages de l'Architecture

1. **Isolation des données** : Chaque onglet a son propre espace de noms
2. **Persistance automatique** : Toutes les modifications sont sauvegardées
3. **Composants réutilisables** : Grid/GridItem peuvent être utilisés ailleurs
4. **Flexibilité** : Support de composants Svelte dynamiques
5. **Responsive** : Adaptation automatique aux différentes tailles d'écran

### Défis Techniques Résolus

1. **Gestion mémoire** : Désabonnement automatique des stores
2. **Collisions complexes** : Algorithmes optimisés de détection et résolution
3. **Sérialisation** : Exclusion des propriétés non sérialisables (composants)
4. **Réactivité** : Synchronisation entre stores et composants UI

### Patterns Utilisés

1. **Store Factory Pattern** : `multiPageItemsStore.getStore(namespace)`
2. **Context API** : `getGridContext()` pour partager les paramètres
3. **Composition Pattern** : PageGrid compose Grid + PageGridItem
4. **Observer Pattern** : Réactivité Svelte avec les stores

## Évolution et Extensibilité

### Ajout d'un Nouvel Onglet

1. Créer les `pageItems` spécifiques
2. Ajouter l'onglet à `keyedTabs`
3. Créer le bloc conditionnel de rendu
4. Utiliser un `pageId` unique

### Ajout d'un Nouveau Type de Composant

1. Importer le composant
2. L'ajouter à `componentsMap`
3. Utiliser `componentName` dans les PageItems

### Extension du Store

Pour ajouter de nouvelles méthodes au store multi-instances :
1. Étendre l'interface `NamespaceMethods`
2. Implémenter la méthode dans `createNamespaceMethods`
3. Tester avec différents namespaces

## Conclusion

Ce système de fenêtrage représente une solution complète et robuste pour créer des interfaces utilisateur dynamiques avec :
- **Gestion d'état sophistiquée** via les stores Svelte
- **Persistance transparente** des données utilisateur
- **Architecture modulaire** et extensible
- **Support multi-onglets** avec isolation des données
- **Interactions riches** (drag & drop, resize, collision)

Le système est particulièrement adapté pour des applications de type dashboard, IDE, ou tout environnement nécessitant une interface utilisateur configurable et persistante.

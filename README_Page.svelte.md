# Documentation du fichier Page.svelte

## Vue d'ensemble
Composant de page complète qui combine un menu de gestion et une grille d'éléments avec support multi-instances et sauvegarde automatique.

## Configuration et props

### Props de base
```typescript
export let nomPage = 'pageTemplate';
export let description = 'Description de la page';
export let pageItems: Array<PageItem> = [];
export let componentsMap: ComponentsMap = {};
export let pageId: string = nomPage; // Identifiant unique pour multi-instances
```
**Logique :**
- `pageId` : clé unique pour différencier les instances de page
- `componentsMap` : association nom → composant Svelte
- `pageItems` : éléments initiaux de la page

### Props de style
```typescript
export let pageClass: string = '';
export let pageStyle: string = 'background: transparent;';
export let menuClass: string = '';
export let menuStyle: string = 'background: transparent;';
export let gridClass: string = '';
export let gridStyle: string = 'background: transparent;';
```
**Logique :**
- Séparation des styles par zone (page, menu, grille)
- Transparence par défaut pour intégration flexible
- Classes et styles inline supportés

## Gestion multi-instances

### Store spécifique par page
```typescript
let currentPageStore;

$: {
    try {
        currentPageStore = multiPageItemsStore.getStore(pageId);
        console.log(`Store créé pour pageId: ${pageId}`);
    } catch (error) {
        console.error(`Erreur lors de la création du store pour pageId ${pageId}:`, error);
        currentPageStore = pageItemsStore; // Fallback sur le store par défaut
    }
}
```
**Logique :**
- Chaque instance de page a son propre store
- Isolation complète des données entre pages
- Fallback sur store global en cas d'erreur
- Support d'onglets multiples avec mêmes composants

## Gestion des dispositions

### Récupération des dispositions sauvegardées
```typescript
function getDispositions(urlPathname: string) {
    const keys = Object.keys(localStorage);
    let localStorageItems = keys.map((key) => ({
        key,
        value: localStorage.getItem(key)
    }));

    // Filtrer par urlPathname ET pageId pour avoir des dispositions spécifiques à chaque onglet
    const keyPrefix = `${urlPathname}_${pageId}`;
    return localStorageItems.filter((item) => item.key.startsWith(keyPrefix));
}
```
**Logique :**
- Combinaison URL + pageId pour clés uniques
- Permet sauvegarde différenciée par page ET instance
- Filtrage automatique des dispositions pertinentes

### Chargement de disposition
```typescript
function loadGrid(name: string) {
    const localItems = localStorage.getItem(name);
    if (localItems) {
        currentPageStore.setItems(JSON.parse(localItems));
    } else {
        console.log('Aucune disposition trouvée');
    }
}
```
**Logique :**
- Chargement depuis localStorage
- Parsing JSON automatique
- Application directe au store de la page

## Cycle de vie et initialisation

### Initialisation onMount
```typescript
onMount(() => {
    // 1. D'abord initialiser avec les items par défaut
    currentPageStore.setInitialItems(pageItems);
    
    // 2. Ensuite essayer de charger une disposition sauvegardée
    const urlPathname = $page.url.pathname.removeFirstChar();
    const dispos = getDispositions(urlPathname);
    if (dispos.length > 0) {
        loadGrid(dispos[0].key);
    }
});
```
**Logique :**
1. **Initialisation** : charge les items par défaut
2. **Auto-restauration** : tente de charger disposition sauvegardée
3. **Priorisation** : disposition sauvegardée écrase les valeurs par défaut

## Notifications

### Système de snackbar
```typescript
import { snackbarMessage } from '$stores/snackBar.store';

let snackbarClipBoard: Snackbar;

snackbarMessage.subscribe((message) => {
    if (message) {
        snackbarClipBoard.open();
    }
});
```
**Logique :**
- Store global pour notifications
- Auto-ouverture sur nouveau message
- Utilisé pour feedback copie, sauvegarde, etc.

## Template et composition

### Structure principale
```svelte
<div class="page-wrapper {pageClass}" style={pageStyle}>
    <PageMenu {debugThis} class={menuClass} style={menuStyle} pageStore={currentPageStore} {pageId} />
    
    <PageGrid
        {componentsMap}
        {debugThis}
        class={gridClass}
        style={gridStyle}
        pageStore={currentPageStore}
        let:item
    >
        <slot {item} />
    </PageGrid>
</div>
```
**Logique :**
- Composition verticale : Menu + Grille
- Passage du store spécifique aux composants enfants
- Slot avec exposition de l'item pour personnalisation
- Styles modulaires par section

### En-têtes de page
```svelte
<svelte:head>
    <title>{nomPage}</title>
    <meta name={description} />
</svelte:head>
```
**Logique :**
- Titre dynamique selon la page
- Métadonnées pour SEO/navigation
- Intégration SvelteKit automatique

## Debug et développement

### Système de debug intégré
```typescript
export let debugThis: boolean = false;
$: console.log(
    `%c Page.svelte\n\t\tdebugThis = ${debugThis}\n\t\tpageId = ${pageId}`,
    'background: #ab2458; color: #fff'
);
```
**Logique :**
- Flag debug transmis aux composants enfants
- Logs colorés pour identification facile
- Traçabilité des instances par pageId

## Avantages du système

### Multi-instances
- Plusieurs pages identiques avec données séparées
- Support onglets navigateur
- Isolation complète des états

### Persistance
- Sauvegarde automatique des dispositions
- Restauration au rechargement
- Clés uniques par URL et instance

### Modularité
- Séparation menu/grille
- Styles personnalisables par zone
- Réutilisabilité maximale

# Documentation du fichier PageMenu.svelte

## Vue d'ensemble
Composant de menu qui fournit les outils de gestion d'une page : sauvegarde/chargement de dispositions, basculement de modes, gestion de la visibilité des éléments et outils de debug.

## Configuration et props

### Props principales
```typescript
export let debugThis: boolean = false;
export let pageStore: any = null; // Store spécifique de la page
export let pageId: string = ''; // Identifiant unique de l'instance
```
**Logique :**
- `pageStore` : injection du store spécifique
- `pageId` : différenciation des instances (multi-onglets)
- `debugThis` : mode debug pour logs détaillés

### Props de style
```typescript
let classes: string | undefined = undefined;
export { classes as class };
export let style: string = '';
```

### Store et variables réactives
```typescript
$: currentStore = pageStore || pageItemsStore;
$: storeData = $currentStore;
$: collision = storeData?.collision || 'none';
$: items = storeData?.pageItems || [];
$: hiddenItems = storeData?.hiddenItems || [];
$: globalMovable = items ? items.some((item: PageItem) => item.movable) : false;
$: debugItemExist = currentStore.hasItem && currentStore.hasItem('_debug_items_');
```
**Logique :**
- Accès réactif aux données du store
- `globalMovable` : indique si au moins un élément est déplaçable
- `debugItemExist` : vérifie la présence de l'item de debug
- Fallback sur valeurs par défaut si store indisponible

## Gestion des dispositions

### Structure des clés de sauvegarde
```typescript
function getDispositions() {
    const keys = Object.keys(localStorage);
    const keyPrefix = pageId ? `${urlPathname}_${pageId}` : urlPathname;
    return localStorageItems.filter((item) => item.key.startsWith(keyPrefix));
}
```
**Logique :**
- **Format des clés** : `{URL}_{pageId}_{nomDisposition}`
- **Séparation par page** : même URL, différents pageId
- **Séparation par URL** : différentes pages de l'application
- **Exemple** : `home_tab1_mesDisposition`, `home_tab2_mesDisposition`

### Sauvegarde de disposition
```typescript
function saveGrid(name: string) {
    const keyName = pageId ? `${urlPathname}_${pageId}_${name}` : `${urlPathname}_${name}`;
    try {
        localStorage.setItem(keyName, JSON.stringify($currentStore.pageItems));
        snackMessage(`Disposition "${name}" sauvegardée`);
    } catch (error) {
        snackMessage(`Erreur lors de la sauvegarde: ${error.message}`);
    }
}
```
**Logique :**
- Construction de clé unique avec URL + pageId + nom
- Sérialisation JSON des items du store
- Gestion d'erreur (quota dépassé, etc.)
- Notification utilisateur

### Chargement de disposition
```typescript
function loadGrid(name: string) {
    try {
        const localItems = localStorage.getItem(name);
        if (localItems) {
            const items = JSON.parse(localItems);
            currentStore.setItems(items);
            snackMessage(`Disposition "${name}" chargée`);
        }
    } catch (error) {
        snackMessage(`Erreur lors du chargement: ${error.message}`);
    }
}
```
**Logique :**
- Récupération et désérialisation JSON
- Remplacement complet des items du store
- Gestion d'erreur de parsing
- Notification de succès/erreur

## Dialogs de gestion

### Dialog de sauvegarde
```svelte
<Dialog bind:open={saveDialogOpen} on:SMUIDialog:closed={closeSaveHandler}>
    <Title>Enregistrer une disposition</Title>
    <Content>
        <Textfield bind:value={configurationName} label="Nom de la configuration" />
    </Content>
    <DActions>
        <Button action="cancel">Annuler</Button>
        <Button action="accept" disabled={!configurationName}>Sauvegarder</Button>
    </DActions>
</Dialog>
```
**Logique :**
- Saisie du nom de disposition
- Validation (nom requis)
- Actions Annuler/Sauvegarder

### Dialog de chargement
```svelte
<Dialog bind:open={loadDialogOpen} selection>
    <Title>Charger une disposition</Title>
    <Content>
        <List>
            {#each dispos as dispo}
                <LItem on:SMUI:action={() => loadGrid(dispo.key)}>
                    <Text>{dispo.key.split('_').pop()}</Text>
                </LItem>
            {/each}
        </List>
    </Content>
</Dialog>
```
**Logique :**
- Liste des dispositions disponibles
- Affichage du nom (extraction de la clé)
- Chargement au clic

## Actions de menu

### Basculement global movable
```typescript
function toggleGlobalMovable() {
    const newMovableState = !globalMovable;
    currentStore.setGlobalMovable(newMovableState);
    snackMessage(newMovableState ? 'Éléments déverrouillés' : 'Éléments verrouillés');
}
```
**Logique :**
- Bascule l'état déplaçable de tous les éléments
- Mise à jour via méthode du store
- Notification de l'état actuel

### Basculement mode collision
```typescript
function toggleCollision() {
    const modes = ['none', 'push', 'compress'];
    const currentIndex = modes.indexOf(collision);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    currentStore.setCollision(nextMode);
    snackMessage(`Mode collision: ${nextMode}`);
}
```
**Logique :**
- Cycle entre les 3 modes de collision
- Calcul de l'index suivant avec modulo
- Notification du nouveau mode

### Reset de la grille
```typescript
function resetGrid() {
    currentStore.resetToInitial();
    snackMessage('Grille réinitialisée');
}
```
**Logique :**
- Retour aux éléments initiaux
- Perte des modifications utilisateur
- Confirmation par notification

### Gestion de l'item de debug
```typescript
const id_debug = '_debug_items_';
function toggleDebug() {
    if (debugItemExist) {
        currentStore.removeItem(id_debug);
    } else {
        const debugItem = {
            id: id_debug,
            x: 0, y: 0, w: 4, h: 3,
            name: 'Debug Items',
            componentName: 'DebugItem',
            movable: true,
            resizable: true,
            visible: true
        };
        currentStore.addItem(debugItem);
    }
}
```
**Logique :**
- ID fixe pour l'item de debug
- Création/suppression dynamique
- Configuration prédéfinie (position, taille, composant)

## Gestion de la visibilité

### Contrôle individuel
```typescript
function setVisibilityItem(id: string, value: boolean | null) {
    if (value === null) {
        // Basculer la visibilité
        const currentItem = items.find(item => item.id === id);
        const newVisibility = !currentItem?.visible;
        currentStore.updateItemVisibility(id, newVisibility);
    } else {
        currentStore.updateItemVisibility(id, value);
    }
}
```
**Logique :**
- Valeur `null` = bascule automatique
- Valeur booléenne = état explicite
- Mise à jour via méthode spécialisée du store

### Affichage des éléments cachés
```svelte
{#if hiddenItems && hiddenItems.length > 0}
    <div class="hidden-items-section">
        <h3>Éléments cachés</h3>
        {#each hiddenItems as item}
            <Button on:click={() => setVisibilityItem(item.id, true)}>
                Afficher: {item.name}
            </Button>
        {/each}
    </div>
{/if}
```
**Logique :**
- Section dédiée aux éléments cachés
- Boutons de restauration
- Affichage conditionnel selon présence d'éléments

## Suppression de dispositions

### Clic droit pour suppression
```typescript
function handleRightClick(e: MouseEvent, itemKey: string) {
    e.preventDefault();
    rightClikedDispo = itemKey;
    reason = 'Supprimer cette disposition ?';
    snackbarSuppDisposition.open();
}
```
**Logique :**
- Clic droit sur disposition pour suppression
- Stockage de l'item à supprimer
- Ouverture snackbar de confirmation

### Confirmation de suppression
```typescript
function handleClosedSnackBarSuppDispo(e: CustomEvent<{ reason: string | undefined }>) {
    if (e.detail.reason === 'action') {
        localStorage.removeItem(rightClikedDispo);
        getDispositions(); // Refresh de la liste
        snackMessage('Disposition supprimée');
    }
}
```
**Logique :**
- Vérification de l'action utilisateur
- Suppression du localStorage
- Rafraîchissement de la liste
- Notification de confirmation

## Interface utilisateur

### Menu condensé/expandé
```typescript
let showConf = false;
```
**Logique :**
- Affichage minimal par défaut (icône settings)
- Expansion au clic pour révéler tous les outils
- Interface adaptative selon l'espace disponible

### Notifications système
```typescript
function snackMessage(message: string) {
    snackBarInfoMessage = message;
    snackbarInfo.open();
}
```
**Logique :**
- Fonction utilitaire pour toutes les notifications
- Store global des messages
- Affichage automatique avec auto-fermeture

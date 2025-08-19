# Documentation du fichier _404_.svelte

## Vue d'ensemble
Composant d'erreur utilisé comme fallback lorsqu'un composant demandé n'est pas trouvé dans la carte des composants.

## Structure du composant

### Script
```javascript
export let message = 'Attention ! Composant non trouvé.';
```
**Logique :**
- Prop optionnelle `message` avec valeur par défaut
- Permet de personnaliser le message d'erreur
- Le message est commenté dans le template (non affiché actuellement)

### Template
```svelte
<div class="attention-panel">
    <div class="icon">⚠️</div>
    <!--  <div class="text">{message}</div> -->
</div>
```
**Logique :**
- Interface minimaliste avec icône d'avertissement uniquement
- Texte du message désactivé (commenté)
- Structure simple pour signaler visuellement l'erreur

### Styles CSS
**Logique :**
- `.attention-panel` : conteneur principal centré avec styles d'alerte
  - Flexbox pour centrage vertical et horizontal
  - Couleurs d'avertissement (jaune/orange)
  - Bordure et ombre pour visibilité
  - Occupe 100% de l'espace disponible
- `.icon` : icône agrandie et espacée
- `.text` : style pour le texte (actuellement inutilisé)

## Utilisation dans le système
Ce composant est automatiquement utilisé dans `PageGrid.svelte` quand un `componentName` n'est pas trouvé dans la `ComponentsMap` :

```javascript
(item as any).component = componentsMap[item.componentName] || _404_;
```

**Logique d'utilisation :**
- Évite les erreurs de rendu
- Fournit un feedback visuel immédiat
- Maintient la stabilité de l'interface
- Facilite le débogage en signalant les composants manquants

import type { PageItem, LayoutItem } from '$lib/types';

// Option globale pour choisir le système de collision
export let USE_LEGACY_COLLISION_SYSTEM = true;

/**
 * Configure le système de collision à utiliser
 * @param useLegacy - true pour utiliser l'ancien système (dépôt git), false pour le nouveau
 */
export function setCollisionSystem(useLegacy: boolean) {
    USE_LEGACY_COLLISION_SYSTEM = useLegacy;
}

/**
 * Calcule la hauteur du header uniquement
 * @param item - L'item à analyser
 * @param itemSizePixels - Optionnel: taille d'une cellule en pixels pour calculs précis
 * @returns La hauteur du header en unités de grille
 */
export function getHeaderOnlyHeight(item: PageItem | LayoutItem, itemSizePixels?: { width: number; height: number }): number {
    const pageItem = item as PageItem;

    // Pas de header si l'item n'est ni headed ni movable
    if (!pageItem.headed && !pageItem.movable) {
        return 0;
    }

    return getHeaderHeight(item, itemSizePixels);
}

/**
 * Calcule la hauteur du contenu uniquement (sans header)
 * @param item - L'item à analyser
 * @returns La hauteur du contenu en unités de grille
 */
export function getContentOnlyHeight(item: PageItem | LayoutItem): number {
    const pageItem = item as PageItem;

    // Si l'item a un header, soustraire sa hauteur de la hauteur totale
    if (pageItem.headed || pageItem.movable) {
        const headerHeight = getHeaderOnlyHeight(item);
        return Math.max(0, item.h - headerHeight);
    }

    // Sinon, toute la hauteur est pour le contenu
    return item.h;
}

/**
 * Calcule la hauteur effective d'un PageItem selon son état
 * SYSTÈME CONFIGURABLE : Legacy (dépôt git) ou nouveau système
 * @param item - L'item à analyser
 * @param itemSizePixels - Optionnel: taille d'une cellule en pixels pour calculs précis
 * @returns La hauteur effective en unités de grille
 */
export function getEffectiveHeight(item: PageItem | LayoutItem, itemSizePixels?: { width: number; height: number }): number {
    const pageItem = item as PageItem;

    // SYSTÈME LEGACY (dépôt git original)
    if (USE_LEGACY_COLLISION_SYSTEM) {
        // Si l'item n'a pas de propriétés PageItem, retourner la hauteur de base.
        if (typeof pageItem.folded === 'undefined' && typeof pageItem.headed === 'undefined') {
            return item.h;
        }

        // Si l'item est replié, sa hauteur est celle du header.
        if (pageItem.folded) {
            return getHeaderHeight(item, itemSizePixels);
        }

        // Si l'item est verrouillé (ni déplaçable, ni d'en-tête forcé), il n'a pas de header.
        // Sa hauteur est simplement la hauteur de base `h`.
        if (!pageItem.movable && !pageItem.headed) {
            return item.h;
        }

        // Dans tous les autres cas (déplié, déplaçable), la hauteur est la hauteur de base `h`,
        // qui représente le total (header + contenu).
        return item.h;
    }

    // NOUVEAU SYSTÈME (header ne compte pas pour collisions si déplié + movable)
    // Si l'item n'a pas de propriétés PageItem, retourner la hauteur de base.
    if (typeof pageItem.folded === 'undefined' && typeof pageItem.headed === 'undefined') {
        return item.h;
    }

    // Si l'item est replié, sa hauteur effective est SEULEMENT celle du header
    if (pageItem.folded) {
        return getHeaderHeight(item, itemSizePixels);
    }

    // Si l'item est déplié ET movable, le header ne compte PAS dans les collisions
    // Il peut se superposer sous les autres items
    if (!pageItem.folded && pageItem.movable) {
        return getContentOnlyHeight(item); // Seulement le contenu, pas le header
    }

    // Pour tous les autres cas (headed mais pas movable, ou ni headed ni movable)
    // Nous devons ajouter le padding visuel pour les items non déplaçables et non pliés.
    // Le padding total est de 16px (8px en haut + 8px en bas).
    // Nous le convertissons en unités de grille en le divisant par la hauteur d'une unité de grille en pixels.
    if (itemSizePixels && !pageItem.folded && !pageItem.movable) {
        const paddingInGridUnits = 16 / itemSizePixels.height;
        return item.h + paddingInGridUnits;
    }

    return item.h;
}


/**
 * Calcule la largeur effective d'un PageItem selon son état
 * @param item - L'item à analyser
 * @returns La largeur effective en unités de grille
 */
export function getEffectiveWidth(item: PageItem | LayoutItem): number {
    // Pour l'instant, la largeur n'est pas affectée par l'état
    return item.w;
}

/**
 * Crée une version "effective" d'un item pour les calculs de collision
 * @param item - L'item original
 * @param itemSizePixels - Optionnel: taille d'une cellule en pixels pour calculs précis
 * @returns Un item avec les dimensions effectives
 */
export function getEffectiveItem(item: PageItem | LayoutItem, itemSizePixels?: { width: number; height: number }): LayoutItem {
    return {
        ...item,
        w: getEffectiveWidth(item),
        h: getEffectiveHeight(item, itemSizePixels)
    };
}

/**
 * Calcule la hauteur optimale pour un item replié selon son nom
 * LOGIQUE MODIFIÉE : Retourne la hauteur du header car c'est tout ce qui est visible
 * @param item - L'item à analyser
 * @param itemSizePixels - Optionnel: taille d'une cellule en pixels pour calculs précis
 * @returns La hauteur optimale pour l'état replié (hauteur du header)
 */
export function getOptimalFoldedHeight(item: PageItem | LayoutItem, itemSizePixels?: { width: number; height: number }): number {
    // Pour un item replié, la hauteur optimale est celle du header
    const headerHeight = getHeaderHeight(item, itemSizePixels);
    return Math.max(headerHeight, 0.3); // Minimum 0.3 pour éviter les items invisibles
}

/**
 * Vérifie si un item est actuellement en état replié
 * @param item - L'item à vérifier
 * @returns true si l'item est replié
 */
export function isItemFolded(item: PageItem | LayoutItem): boolean {
    const pageItem = item as PageItem;
    return pageItem.folded === true;
}

/**
 * Vérifie si un item a un header visible
 * @param item - L'item à vérifier
 * @returns true si l'item a un header visible
 */
export function hasVisibleHeader(item: PageItem | LayoutItem): boolean {
    const pageItem = item as PageItem;
    // Un header est visible si l'item est "headed" OU s'il est "movable".
    // Un item verrouillé (`movable: false`) et non "headed" n'a pas de header.
    return pageItem.headed === true || pageItem.movable === true;
}


/**
 * Calcule la hauteur du header d'un item selon son contenu et sa largeur
 * @param item - L'item à analyser
 * @param itemSizePixels - Taille d'une cellule en pixels pour calculs précis
 * @returns Hauteur du header en unités de grille
 */
export function getHeaderHeight(item: PageItem | LayoutItem, itemSizePixels?: { width: number; height: number }): number {
    // CORRECTION CRUCIALE : Si l'item n'a pas de header visible, sa hauteur est 0.
    if (!hasVisibleHeader(item)) {
        return 0;
    }

    const pageItem = item as PageItem;
    const itemName = pageItem.name || item.id || 'Item';

    // Si on n'a pas les dimensions en pixels, utiliser une estimation basique
    if (!itemSizePixels) {
        const nameLength = itemName.length;
        const itemWidth = item.w;
        const charsPerGridUnit = 12;
        const estimatedAvailableWidth = (itemWidth * 100) - 120 - 16;
        const maxCharsPerLine = Math.max(10, Math.floor(estimatedAvailableWidth / 8));

        if (nameLength <= maxCharsPerLine) {
            return 0.4;
        } else {
            const linesNeeded = Math.ceil(nameLength / maxCharsPerLine);
            return Math.min(linesNeeded * 0.4, 1.6);
        }
    }

    // Calcul précis avec les dimensions en pixels
    const reservedSpaceForButtons = 120;
    const headerPadding = 16;
    const availableWidth = Math.max(100, (item.w * itemSizePixels.width) - reservedSpaceForButtons - headerPadding);

    const headerLineHeight = 20;
    const fontSize = 14;
    const avgCharWidth = fontSize * 0.6;

    const charsPerLine = Math.max(5, Math.floor(availableWidth / avgCharWidth));
    const linesNeeded = Math.ceil(itemName.length / charsPerLine);

    const headerPixelHeight = Math.max(40, (linesNeeded * headerLineHeight) + 16);
    const headerGridHeight = headerPixelHeight / itemSizePixels.height;

    return Math.min(headerGridHeight, 2.0);
}

/**
 * Version simplifiée pour calculer la hauteur du header avec estimation
 * @param item - L'item à analyser
 * @param itemWidth - Largeur de l'item en unités de grille
 * @returns Hauteur estimée du header en unités de grille
 */
export function getHeaderHeightSimple(item: PageItem, itemWidth: number): number {
    if (!hasVisibleHeader(item)) {
        return 0;
    }
    const nameLength = item.name?.length || 10;
    const charsPerLine = itemWidth * 10;
    const lines = Math.ceil(nameLength / charsPerLine);
    return Math.max(0.5, lines * 0.4);
}

/**
 * Met à jour la hauteur d'un item pour qu'elle corresponde à son état (plié/déplié)
 * @param item - L'item à mettre à jour
 * @param itemSizePixels - Taille d'une cellule en pixels pour calculs précis
 * @returns L'item avec la hauteur corrigée
 */
export function updateItemHeightForFoldState(item: PageItem, itemSizePixels?: { width: number; height: number }): PageItem {
    const updatedItem = { ...item };

    if (updatedItem.folded) {
        // Si l'item est replié, sa hauteur devient celle du header
        const optimalHeight = getOptimalFoldedHeight(updatedItem, itemSizePixels);
        if (updatedItem.h !== optimalHeight) {
            updatedItem.nfh = updatedItem.h; // Sauvegarder la hauteur dépliée
            updatedItem.h = optimalHeight;
        }
    } else {
        // Si l'item est déplié, restaurer sa hauteur originale
        if (updatedItem.nfh && updatedItem.nfh > 0) {
            updatedItem.h = updatedItem.nfh;
            updatedItem.nfh = undefined; // Nettoyer
        }
    }
    return updatedItem;
}

/**
 * Inverse l'état plié/déplié d'un item et ajuste sa hauteur
 * @param item - L'item à basculer
 * @param itemSizePixels - Taille d'une cellule en pixels pour calculs précis
 * @returns L'item avec son état et sa hauteur mis à jour
 */
export function toggleFolded(item: PageItem, itemSizePixels?: { width: number; height: number }): PageItem {
    const newItem = { ...item, folded: !item.folded };
    return updateItemHeightForFoldState(newItem, itemSizePixels);
}

/**
 * Active le système de collision legacy (dépôt git original)
 * Dans ce mode, les headers comptent toujours dans les calculs de collision
 */
export function useLegacyCollisionSystem() {
    setCollisionSystem(true);
    console.log('🔄 Système de collision LEGACY activé (headers comptent pour collisions)');
}

/**
 * Active le nouveau système de collision
 * Dans ce mode, les headers ne comptent pas pour les collisions si l'item est déplié + movable
 */
export function useNewCollisionSystem() {
    setCollisionSystem(false);
    console.log('🔄 Système de collision NOUVEAU activé (headers peuvent se superposer)');
}

/**
 * Retourne le système de collision actuellement utilisé
 */
export function getCurrentCollisionSystem(): 'legacy' | 'new' {
    return USE_LEGACY_COLLISION_SYSTEM ? 'legacy' : 'new';
}

export function debugItemHeight(item: PageItem, itemSizePixels?: { width: number; height: number }) {
    console.group(`🔍 DEBUG: Hauteur de l'item ${item.id} (w: ${item.w}, h: ${item.h})`);
    console.log(`🔧 Système de collision: ${getCurrentCollisionSystem().toUpperCase()}`);
    console.log('État:', {
        folded: item.folded,
        headed: item.headed,
        movable: item.movable,
        visible: item.visible,
        nfh: item.nfh
    });

    const hasHeader = hasVisibleHeader(item);
    console.log(`hasVisibleHeader: ${hasHeader}`);

    if (hasHeader) {
        const headerHeight = getHeaderHeight(item, itemSizePixels);
        console.log(`getHeaderHeight (calculée): ${headerHeight}`);
    } else {
        console.log('getHeaderHeight: non calculée (pas de header visible)');
    }

    const effectiveHeight = getEffectiveHeight(item, itemSizePixels);
    console.log(`getEffectiveHeight (utilisée pour collision): ${effectiveHeight}`);

    if (item.folded) {
        const optimalFoldedHeight = getOptimalFoldedHeight(item, itemSizePixels);
        console.log(`getOptimalFoldedHeight: ${optimalFoldedHeight}`);
    }

    console.groupEnd();
}
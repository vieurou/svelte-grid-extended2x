<!-- src/routes/examples/gridPageTabBar/+page.svelte -->

<script lang="ts">
	// conf
	let debugThis: boolean = true;

	// Importer le composant PAGE et autres composants nécessaires
	import { type PageItem, Page } from '$lib';
	import { debugItemHeight } from '$lib/utils/pageItem';

	// Import des composants SMUI pour la TabBar
	import Tab, { Icon, Label } from '@smui/tab';
	import TabBar from '@smui/tab-bar';
	import Button from '@smui/button';

	//on importe la map des composants
	import componentsMap from '../gridPage/componentsMap';

	//on importe le composants car il sera appelé dans le slot
	import HelloWorld from '$lib/examples/components/showHelloWorld.svelte';
	import ByeByeWorld from '$lib/examples/components/showByeByeWorld.svelte';

	// Configuration des onglets
	let keyedTabs = [
		{
			k: 0,
			icon: 'dashboard',
			label: 'Onglet Basique'
		},
		{
			k: 1,
			icon: 'widgets',
			label: 'Onglet Avancé'
		}
	];

	let keyedTabsActive = keyedTabs[0]; // Commencer par le premier onglet

	// Items pour le premier onglet (plus simple)
	const pageItemsBasique = [
		// Item minimal
		{
			id: 'Item minimal onglet 1'
		},
		// Un item standard
		{
			id: 'standard-1',
			name: 'Item Basique',
			x: 0,
			y: 0,
			w: 4,
			h: 2,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			text: '🌟 Premier onglet - Item basique 🌟'
		},
		// Item avec nom très long pour tester le header multi-ligne
		{
			id: 'long-name-test',
			name: "Item avec un nom très très très long qui devrait s'étaler sur plusieurs lignes dans le header",
			x: 0,
			y: 2,
			w: 2, // Largeur réduite pour forcer le multi-ligne
			h: 3,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			text: '🔤 Test de nom long dans header étroit'
		},
		// Item avec composant HelloWorld
		{
			id: 'HelloWorld-basic',
			name: 'Hello World Basique',
			x: 4,
			y: 0,
			w: 4,
			h: 3,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			componentName: 'HelloWorld',
			props: {
				who: 'Onglet Basique! 🎯'
			},
			preComponentText: '<h3>🎨 Composant HelloWorld</h3>',
			postComponentText: '<p>Dans le premier onglet</p>'
		},
		// Item étroit avec nom moyen pour comparer
		{
			id: 'narrow-item',
			name: 'Item Étroit Nom Moyen',
			x: 2,
			y: 2,
			w: 1, // Très étroit
			h: 2,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			text: '📏 Item très étroit'
		},
		// Item avec titre très long pour tester le multi-ligne
		{
			id: 'long-title-wide',
			name: "Cet item a un titre extrêmement long qui devrait normalement se répartir sur plusieurs lignes lorsque l'item est en mode replié",
			x: 4,
			y: 0,
			w: 3, // Largeur moyenne
			h: 2,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			text: '📝 Item avec titre très long (largeur moyenne)'
		},
		// Item avec titre très long ET très étroit - cas le plus problématique
		{
			id: 'long-title-narrow',
			name: 'Titre extrêmement long sur item très étroit qui force plusieurs lignes',
			x: 7,
			y: 0,
			w: 1, // Très étroit
			h: 2, // Hauteur normale, sera ajustée automatiquement
			movable: true,
			resizable: true,
			folded: true, // Démarrer en mode replié pour voir le problème
			headed: true,
			visible: true,
			text: '⚠️ Item critique: long titre + très étroit'
		},
		// Item caché pour tester le menu
		{
			id: 'cache-basique',
			name: 'Item caché basique',
			x: 0,
			y: 3,
			w: 3,
			h: 1,
			visible: false,
			text: '🔍 Item caché du premier onglet'
		}
	] as PageItem[];

	// Items pour le deuxième onglet (plus complexe)
	const pageItemsAvance = [
		// Item avec ByeByeWorld
		{
			id: 'ByeByeWorld-advanced',
			name: 'Bye Bye World Avancé',
			x: 0,
			y: 0,
			w: 5,
			h: 4,
			movable: false,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			componentName: 'ByeByeWorld',
			props: {
				who: 'Onglet Avancé! 🚀'
			},
			preComponentText: '<h2>🔥 Composant ByeByeWorld Avancé</h2>',
			postComponentText: '<p class="text-blue">Deuxième onglet - Plus complexe!</p>',
			cssStyle: `
				backgroundColor: 'lightcoral',
				color: 'white',
				text-align: 'center'`
		},
		// Item complexe avec slot
		{
			id: 'slot-advanced',
			name: 'Item avec slot avancé',
			x: 6,
			y: 0,
			w: 4,
			h: 3,
			movable: true,
			resizable: true,
			folded: false,
			headed: true,
			visible: true,
			text: '🎭 Cet item utilise un slot personnalisé'
		},
		// Item réduit - hauteur normale, sera ajustée automatiquement selon l'état
		{
			id: 'reduit-avance',
			name: 'Item réduit avancé',
			x: 11,
			y: 0,
			w: 2,
			h: 6, // Hauteur normale complète
			folded: true, // Sera replié au chargement
			movable: true,
			resizable: true,
			headed: true,
			text: '📦 Item replié du deuxième onglet'
		},
		// Item avec composant inexistant pour tester l'erreur
		{
			id: 'composant-inexistant-avance',
			name: 'Test erreur composant',
			x: 0,
			y: 5,
			w: 4,
			h: 2,
			componentName: 'ComposantInexistant',
			preComponentText: "<p>⚠️ Ce composant n'existe pas</p>"
		},
		// Item bougeable avec style personnalisé
		{
			id: 'stylise-avance',
			name: 'Item stylisé',
			x: 5,
			y: 4,
			w: 4,
			h: 3,
			movable: true,
			resizable: true,
			text: '✨ Item avec style personnalisé ✨',
			cssStyle: `
				background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
				color: white;
				border-radius: 8px;
				font-weight: bold;`
		}
	] as PageItem[];

	$: if (debugThis) {
		console.log('Onglet actif:', keyedTabsActive.k);
		console.log('pageItemsBasique:', pageItemsBasique);
		console.log('pageItemsAvance:', pageItemsAvance);
	}

	// Fonction de debug pour analyser les hauteurs
	function debugAllItemHeights() {
		const currentItems = keyedTabsActive.k === 0 ? pageItemsBasique : pageItemsAvance;
		console.group(`🔍 DEBUG: Hauteurs des items de l'onglet ${keyedTabsActive.label}`);
		currentItems.forEach((item) => {
			debugItemHeight(item);
		});
		console.groupEnd();
	}
</script>

<!-- TabBar pour navigation entre onglets -->
<div class="tab-container">
	<TabBar tabs={keyedTabs} let:tab key={(tab) => tab.k} bind:active={keyedTabsActive}>
		<Tab {tab} stacked={true} indicatorSpanOnlyContent={true} tabIndicator$transition="slide">
			<Icon class="material-icons">{tab.icon}</Icon>
			<Label>{tab.label}</Label>
		</Tab>
	</TabBar>
</div>

<!-- Boutons de debug -->
<div class="debug-buttons" style="margin: 10px; display: flex; gap: 10px;">
	<Button variant="outlined" on:click={debugAllItemHeights}>
		<Icon class="material-icons">bug_report</Icon>
		<Label>Debug Hauteurs Items</Label>
	</Button>
	<Button variant="outlined" on:click={() => (debugThis = !debugThis)}>
		<Icon class="material-icons">{debugThis ? 'visibility_off' : 'visibility'}</Icon>
		<Label>{debugThis ? 'Désactiver' : 'Activer'} Debug</Label>
	</Button>
</div>

<!-- ONGLET BASIQUE -->
<div
	class="tab-content"
	style="display: {keyedTabsActive && keyedTabsActive.k === 0 ? 'block' : 'none'}"
>
	<!--{console.log('Affichage onglet basique, visible:', keyedTabsActive && keyedTabsActive.k === 0)}-->
	<Page
		pageId="basique"
		nomPage="Onglet Basique - Page d'exemple"
		description="Premier onglet avec des éléments simples"
		pageItems={pageItemsBasique}
		{componentsMap}
		{debugThis}
		pageClass="custom-page-style onglet-basique"
		pageStyle="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);"
		menuClass="custom-menu-style menu-basique"
		menuStyle="background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%) !important;"
		gridClass="custom-grid-style"
		gridStyle="padding: 10px;"
		let:item
	>
		{#if item && item.id === 'slot-content-basic'}
			<HelloWorld who={'Slot du premier onglet! 🎯'} />
		{/if}
	</Page>
</div>

<!-- ONGLET AVANCÉ -->
<div
	class="tab-content"
	style="display: {keyedTabsActive && keyedTabsActive.k === 1 ? 'block' : 'none'}"
>
	{console.log('Affichage onglet avancé, visible:', keyedTabsActive && keyedTabsActive.k === 1)}
	<Page
		pageId="avance"
		nomPage="Onglet Avancé - Page d'exemple"
		description="Deuxième onglet avec des éléments plus complexes"
		pageItems={pageItemsAvance}
		{componentsMap}
		{debugThis}
		pageClass="custom-page-style onglet-avance"
		pageStyle="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);"
		menuClass="custom-menu-style menu-avance"
		menuStyle="background: linear-gradient(90deg, #9c27b0 0%, #7b1fa2 100%) !important;"
		gridClass="custom-grid-style"
		gridStyle="padding: 10px;"
		let:item
	>
		{#if item && item.id === 'slot-advanced'}
			<ByeByeWorld who={'Slot du deuxième onglet! 🚀'} />
		{/if}
	</Page>
</div>

<style>
	.tab-container {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		background: white;
		border-radius: 8px 8px 0 0;
		overflow: hidden;
	}

	.tab-content {
		min-height: 80vh;
	}

	:global(.custom-page-style) {
		border: 2px solid transparent;
		border-radius: 0 0 8px 8px;
		overflow: hidden;
		margin-top: 0;
	}

	:global(.onglet-basique) {
		border-color: #2196f3;
	}

	:global(.onglet-avance) {
		border-color: #9c27b0;
	}

	:global(.custom-menu-style) {
		color: white;
		border-radius: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.custom-menu-style .material-icons) {
		color: white;
	}

	:global(.menu-basique .material-icons:hover) {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	:global(.menu-avance .material-icons:hover) {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	:global(.custom-grid-style) {
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 0 0 8px 8px;
		min-height: 70vh;
	}

	/* Styles spécifiques pour le TabBar */
	:global(.smui-tab-bar) {
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
	}

	:global(.smui-tab) {
		color: rgba(255, 255, 255, 0.7);
		transition: all 0.3s ease;
	}

	:global(.smui-tab--active) {
		color: white;
		font-weight: bold;
	}

	:global(.smui-tab:hover) {
		background-color: rgba(255, 255, 255, 0.1);
	}

	/* Styles pour les items personnalisés */
	:global(.text-blue) {
		color: #1976d2;
		font-weight: bold;
	}
</style>

//src/routes/examples/gridPage/componentMap.ts
import HelloWorld from "$lib/examples/components/showHelloWorld.svelte";
import type { ComponentsMap } from "$lib";
// Importez ici tous les autres composants nécessaires

export const componentsMap: ComponentsMap = {
  HelloWorld: HelloWorld,
  // Ajoutez d'autres composants ici
};

export default componentsMap;

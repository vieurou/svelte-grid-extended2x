//src/lib/store/persistent.store.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export function persistentStore(key: string, initialValue: any) {
	const storedValue = browser ? localStorage.getItem(key) : null;
	const data = storedValue ? JSON.parse(storedValue) : initialValue;

	const store = writable(data);

	if (browser) {
		store.subscribe((value) => {
			const serializedValue = JSON.stringify(value, (key, value) => {
				if (key === 'component') {
					return undefined; // Exclure la propriété 'component'
				}
				return value;
			});
			localStorage.setItem(key, serializedValue);
		});
	}

	return store;
}

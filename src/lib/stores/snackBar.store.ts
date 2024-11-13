// src/stores/snackbar.store.ts
import { writable } from 'svelte/store';

export const snackbarMessage = writable('');

//let isSnackbarVisible = false;

export function showSnackbar(message: string) {
	snackbarMessage.set(message);
}

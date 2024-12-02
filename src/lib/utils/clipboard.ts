export async function copyToClipboard(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		console.log('Texte copié avec succès', text);
	} catch (err) {
		console.error('Erreur lors de la copie :', err);
		throw err;
	}
}

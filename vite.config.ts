import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Charge les variables d'environnement
	const env = loadEnv(mode, process.cwd(), '');
	// Récupère le port depuis la variable d'environnement
	const port = Number(env.SGE2X_PORT) || 5175;

	const url = env.SGE2X_URL || 'https://sge2x.santelys.fr';

	const allowedHosts = [url, 'localhost'];

	return {
		plugins: [sveltekit()],
		server: {
			port: port, // utilise la variable d'environnement SGE2X_PORT ou 5175 par défaut
			host: true, // permet l'accès depuis n'importe quelle IP
			allowedHosts: allowedHosts // domaines autorisés
		}
	};
});

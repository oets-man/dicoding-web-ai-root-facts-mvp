import '../styles/styles.css';
import App from './pages/app.js';

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.bundle.js')
			.then((registration) => {
				console.log('Service Worker registered: ', registration);
			})
			.catch((error) => {
				console.error('Service Worker registration failed: ', error);
			});
	});
}

document.addEventListener('DOMContentLoaded', async () => {
	const app = new App({
		container: document.querySelector('#main-content'),
	});

	await app.renderPage();

	if (typeof lucide !== 'undefined') {
		// eslint-disable-next-line no-undef
		lucide.createIcons();
	}
});

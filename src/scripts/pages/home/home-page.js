import { generateCameraSection, generateInfoPanel, generateFooter } from '../../templates.js';
import HomePresenter from './home-presenter.js';

export default class HomePage {
	#presenter = null;
	#headerPresenter = null;

	constructor({ headerPresenter }) {
		this.#headerPresenter = headerPresenter;
	}

	async render() {
		return `
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
	}

	async afterRender() {
		this.#presenter = new HomePresenter({ view: this, headerPresenter: this.#headerPresenter });
		await this.#presenter.initialApp();
		this.#bindEvents();
	}

	#bindEvents() {
		const toggleBtn = document.getElementById('btn-toggle');
		const fpsSlider = document.getElementById('fps-slider');

		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => {
				this.#presenter.toggleCamera();
			});
		}

		if (fpsSlider) {
			fpsSlider.addEventListener('input', (e) => {
				const fpsValue = document.getElementById('fps-value');
				if (fpsValue) fpsValue.textContent = e.target.value;
				this.#presenter.setFPS(parseInt(e.target.value, 10));
			});
		}

		window.addEventListener('beforeunload', () => {
			this.#presenter.stopCamera();
		});
	}
	showCameraLoading() {}
	hideCameraLoading() {}
	enableToggleButton() {}
}

import sectionCamera from '../../templates/section-camera.html';
import sectionInfoPanel from '../../templates/section-info-panel.html';
import footer from '../../templates/footer.html';
import {
	getConfidenceTextClass,
	getConfidenceCardClass,
	setElementText,
	setElementHTML,
	setElementDisplay,
	setElementStyle,
	addScaleAnimation,
	addFadeInAnimation,
} from '../../utils/index.js';
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
			${sectionCamera}
			${sectionInfoPanel}
		</main>
		${footer}
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

	showCameraLoading() {
		const toggleBtn = document.getElementById('btn-toggle');
		const btnText = document.getElementById('btn-text');
		if (toggleBtn) {
			toggleBtn.disabled = true;
		}
		setElementText(btnText, 'Memuat...');
	}

	hideCameraLoading() {
		const toggleBtn = document.getElementById('btn-toggle');
		const btnText = document.getElementById('btn-text');
		if (toggleBtn && toggleBtn.disabled) {
			toggleBtn.disabled = false;
		}
		setElementText(btnText, 'Mulai Scan');
	}

	enableToggleButton() {
		const toggleBtn = document.getElementById('btn-toggle');
		const btnText = document.getElementById('btn-text');
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ toggleBtn:', toggleBtn);
		console.log('🚀 ~ HomePage ~ enableToggleButton ~ btnText:', btnText);
		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ viewInactive:', viewInactive);
		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ viewActive:', viewActive);
		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ scannerOverlay:', scannerOverlay);
		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ statusDot:', statusDot);
		// console.log('🚀 ~ HomePage ~ enableToggleButton ~ statusTextCamera:', statusTextCamera);

		if (toggleBtn) {
			toggleBtn.disabled = false;
			toggleBtn.classList.remove('btn-stop');
			toggleBtn.classList.add('btn-start');
		}
		setElementText(btnText, 'Mulai Scan');
		setElementDisplay(viewInactive, 'flex');
		setElementDisplay(viewActive, 'none');
		setElementDisplay(scannerOverlay, 'none');
		if (statusDot) statusDot.classList.remove('active');
		setElementText(statusTextCamera, 'OFFLINE');
	}

	showStatus(message) {
		this.#headerPresenter?.updateStatus(message);
	}

	showCameraActive() {
		const toggleBtn = document.getElementById('btn-toggle');
		const btnText = document.getElementById('btn-text');
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		if (toggleBtn) {
			toggleBtn.classList.remove('btn-start');
			toggleBtn.classList.add('btn-stop');
		}
		setElementText(btnText, 'Berhenti');
		setElementDisplay(viewInactive, 'none');
		setElementDisplay(viewActive, 'block');
		setElementDisplay(scannerOverlay, 'block');
		if (statusDot) statusDot.classList.add('active');
		setElementText(statusTextCamera, 'SIARAN LANGSUNG');
	}

	showCameraInactive() {
		const toggleBtn = document.getElementById('btn-toggle');
		const btnText = document.getElementById('btn-text');
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		if (toggleBtn) {
			toggleBtn.classList.remove('btn-stop');
			toggleBtn.classList.add('btn-start');
		}
		setElementText(btnText, 'Mulai Scan');
		setElementDisplay(viewInactive, 'flex');
		setElementDisplay(viewActive, 'none');
		setElementDisplay(scannerOverlay, 'none');
		if (statusDot) statusDot.classList.remove('active');
		setElementText(statusTextCamera, 'OFFLINE');
	}

	showIdleState() {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-analyzing');
		const stateResult = document.getElementById('state-result');

		setElementDisplay(stateIdle, 'flex');
		setElementDisplay(stateAnalyzing, 'none');
		setElementDisplay(stateResult, 'none');
	}

	showAnalyzingState() {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-analyzing');
		const stateResult = document.getElementById('state-result');

		setElementDisplay(stateIdle, 'none');
		setElementDisplay(stateAnalyzing, 'flex');
		setElementDisplay(stateResult, 'none');
	}

	showResultState(className, confidence) {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-analyzing');
		const stateResult = document.getElementById('state-result');
		const resName = document.getElementById('res-name');
		const resConfidence = document.getElementById('res-confidence');
		const resBar = document.getElementById('res-bar');
		const resultCard = document.getElementById('result-card');

		setElementDisplay(stateIdle, 'none');
		setElementDisplay(stateAnalyzing, 'none');
		if (stateResult) {
			setElementDisplay(stateResult, 'flex');
			addFadeInAnimation(stateResult);
		}

		setElementText(resName, className);
		setElementText(resConfidence, `${confidence}%`);
		setElementStyle(resBar, 'width', `${confidence}%`);

		if (resultCard) {
			resultCard.classList.remove('theme-green', 'theme-yellow', 'theme-red');
			resultCard.classList.add(getConfidenceCardClass(confidence));
		}
		if (resConfidence) {
			resConfidence.classList.remove('text-green', 'text-yellow', 'text-red');
			resConfidence.classList.add(getConfidenceTextClass(confidence));
		}
	}

	showResultsWithNullNutrition(className, confidence) {
		const resName = document.getElementById('res-name');
		const resConfidence = document.getElementById('res-confidence');
		const resBar = document.getElementById('res-bar');
		const resultCard = document.getElementById('result-card');
		const nutriFact = document.getElementById('nutri-fact');
		const nutriHeaderTitle = document.getElementById('nutri-header-title');

		setElementText(resName, className);
		setElementText(resConfidence, `${confidence}%`);
		setElementStyle(resBar, 'width', `${confidence}%`);

		if (resultCard) {
			resultCard.classList.remove('theme-green', 'theme-yellow', 'theme-red');
			resultCard.classList.add(getConfidenceCardClass(confidence));
		}
		if (resConfidence) {
			resConfidence.classList.remove('text-green', 'text-yellow', 'text-red');
			resConfidence.classList.add(getConfidenceTextClass(confidence));
		}

		this.showResultState(className, confidence);

		setElementText(nutriFact, 'Menghasilkan informasi nutrisi...');
		setElementHTML(nutriHeaderTitle, '🤖 Menghasilkan Fakta Nutrisi...');
	}

	showNutritionLoading() {
		const nutriFact = document.getElementById('nutri-fact');
		const nutriHeaderTitle = document.getElementById('nutri-header-title');
		const generateBtn = document.getElementById('generate-nutri-btn');

		setElementHTML(nutriHeaderTitle, '🤖 Menghasilkan...');
		setElementText(nutriFact, 'Sedang menghasilkan informasi nutrisi...');
		if (generateBtn) {
			generateBtn.disabled = true;
			setElementText(generateBtn, 'Memproses...');
		}
	}

	showNutritionSuccess(fact) {
		const nutriFact = document.getElementById('nutri-fact');
		const nutriHeaderTitle = document.getElementById('nutri-header-title');

		setElementText(nutriHeaderTitle, 'Fakta Nutrisi');
		addScaleAnimation(nutriFact, () => setElementText(nutriFact, fact));
	}

	showNutritionError() {
		const nutriFact = document.getElementById('nutri-fact');
		const nutriHeaderTitle = document.getElementById('nutri-header-title');
		const generateBtn = document.getElementById('generate-nutri-btn');

		setElementText(nutriHeaderTitle, 'Fakta Nutrisi (Gagal)');
		setElementText(nutriFact, 'Tidak dapat menghasilkan informasi nutrisi saat ini.');
		if (generateBtn) {
			generateBtn.disabled = false;
			setElementText(generateBtn, '🔄 Coba Lagi');
		}
	}

	showError(message) {
		alert(message);
	}

	getCameraSelectElement() {
		return document.getElementById('camera-select');
	}

	getFPSValue() {
		const fpsSlider = document.getElementById('fps-slider');
		return parseInt(fpsSlider?.value || '30', 10);
	}
}

import sectionCamera from '../../templates/section-camera.html';
import sectionInfoPanel from '../../templates/section-info-panel.html';
import footer from '../../templates/footer.html';
import {
	getConfidenceTextClass,
	getConfidenceCardClass,
	setElementText,
	setElementDisplay,
	setElementStyle,
	addScaleAnimation,
	addFadeInAnimation,
	showElement,
	hideElement,
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
		if (toggleBtn) {
			toggleBtn.addEventListener('click', () => {
				this.#presenter.toggleCamera();
			});
		}

		const fpsSlider = document.getElementById('fps-slider');
		if (fpsSlider) {
			fpsSlider.addEventListener('input', (e) => {
				const fpsValue = document.getElementById('fps-label');
				if (fpsValue) fpsValue.textContent = e.target.value;
				this.#presenter.setFPS(parseInt(e.target.value, 10));
			});
		}

		const toneSelect = document.getElementById('tone-select');
		if (toneSelect) {
			toneSelect.addEventListener('change', (e) => {
				this.#presenter.setTone(e.target.value);
			});
		}

		const generateBtn = document.getElementById('btn-generate');
		if (generateBtn) {
			generateBtn.addEventListener('click', () => {
				this.#presenter.regenerateNutrition();
			});
		}

		const copyBtn = document.getElementById('btn-copy');
		if (copyBtn) {
			copyBtn.addEventListener('click', () => {
				this.#presenter.copyToClipboard();
			});
		}

		window.addEventListener('beforeunload', () => {
			this.#presenter.stopCamera();
		});
	}

	showCameraLoading() {
		const captureBtn = document.getElementById('btn-toggle');
		captureBtn.classList.add('scanning');
	}

	hideCameraLoading() {
		const captureBtn = document.getElementById('btn-toggle');
		captureBtn.classList.remove('scanning');
	}

	enableToggleButton() {
		const toggleBtn = document.getElementById('btn-toggle');
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		if (toggleBtn) {
			toggleBtn.disabled = false;
			toggleBtn.classList.remove('btn-stop');
			toggleBtn.classList.add('btn-start');
		}
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
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		if (toggleBtn) {
			toggleBtn.classList.remove('btn-start');
			toggleBtn.classList.add('btn-stop');
		}
		setElementDisplay(viewInactive, 'none');
		setElementDisplay(viewActive, 'block');
		setElementDisplay(scannerOverlay, 'block');
		if (statusDot) statusDot.classList.add('active');
		setElementText(statusTextCamera, 'SIARAN LANGSUNG');
	}

	showCameraInactive() {
		const toggleBtn = document.getElementById('btn-toggle');
		const viewInactive = document.getElementById('view-inactive');
		const viewActive = document.getElementById('view-active');
		const scannerOverlay = document.getElementById('scanner-overlay');
		const statusDot = document.getElementById('status-dot');
		const statusTextCamera = document.getElementById('status-text-camera');

		if (toggleBtn) {
			toggleBtn.classList.remove('btn-stop');
			toggleBtn.classList.add('btn-start');
		}
		setElementDisplay(viewInactive, 'flex');
		setElementDisplay(viewActive, 'none');
		setElementDisplay(scannerOverlay, 'none');
		if (statusDot) statusDot.classList.remove('active');
		setElementText(statusTextCamera, 'OFFLINE');
	}

	showIdleState() {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-loading');
		const stateResult = document.getElementById('state-result');

		showElement(stateIdle);
		hideElement(stateAnalyzing);
		hideElement(stateResult);
	}

	showAnalyzingState() {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-loading');
		const stateResult = document.getElementById('state-result');

		showElement(stateAnalyzing);
		hideElement(stateIdle);
		hideElement(stateResult);
	}

	showResultState(className, confidence) {
		const stateIdle = document.getElementById('state-idle');
		const stateAnalyzing = document.getElementById('state-loading');
		const stateResult = document.getElementById('state-result');

		hideElement(stateIdle);
		hideElement(stateAnalyzing);
		if (stateResult) {
			showElement(stateResult);
			addFadeInAnimation(stateResult);
		}

		const resName = document.getElementById('detected-name');
		setElementText(resName, className);

		const detectConfidence = document.getElementById('detected-confidence');
		const confidentFill = document.getElementById('confidence-fill');

		setElementText(detectConfidence, `${confidence}%`);
		setElementStyle(confidentFill, 'width', `${confidence}%`);

		const funFactSpinner = document.getElementById('fun-fact-spinner');
		hideElement(funFactSpinner);
	}

	showResultsWithNullNutrition(className, confidence) {
		const resName = document.getElementById('res-name');
		const resConfidence = document.getElementById('res-confidence');
		const resBar = document.getElementById('res-bar');
		const resultCard = document.getElementById('result-card');
		const nutriFact = document.getElementById('fun-fact-text');
		const funFactSpinner = document.getElementById('fun-fact-spinner');

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
		showElement(funFactSpinner);
	}

	showNutritionLoading(tone) {
		const nutriFact = document.getElementById('fun-fact-text');
		const funFactSpinner = document.getElementById('fun-fact-spinner');
		setElementText(nutriFact, `${tone.toUpperCase()}: Sedang menghasilkan informasi nutrisi...`);
		showElement(funFactSpinner);
	}

	showNutritionSuccess(fact) {
		const nutriFact = document.getElementById('fun-fact-text');
		const funFactSpinner = document.getElementById('fun-fact-spinner');
		addScaleAnimation(nutriFact, () => setElementText(nutriFact, fact));
		hideElement(funFactSpinner);
	}

	showNutritionError(err) {
		const nutriFact = document.getElementById('fun-fact-text');
		const funFactSpinner = document.getElementById('fun-fact-spinner');
		setElementText(nutriFact, err || 'Tidak dapat menghasilkan informasi nutrisi saat ini.');
		hideElement(funFactSpinner);
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

	getToneValue() {
		const toneSelect = document.getElementById('tone-select');
		return toneSelect?.value || 'normal';
	}

	showCopyFeedback() {
		const btnCopy = document.getElementById('btn-copy');
		btnCopy.classList.add('copied');
		setTimeout(() => {
			btnCopy.classList.remove('copied');
		}, 1500);
	}

	showRegenerateFeedback() {
		const btnGenerate = document.getElementById('btn-generate');
		btnGenerate.classList.add('regenerated');
		setTimeout(() => {
			btnGenerate.classList.remove('regenerated');
		}, 1000);
	}
}

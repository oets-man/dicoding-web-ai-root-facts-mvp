import { APP_CONFIG } from '../../config.js';
import CameraService from '../../services/camera.service.js';
import DetectionService from '../../services/detection.service.js';
import GeneratorService from '../../services/generator.service.js';
import { createDelay, isValidDetection } from '../../utils/index.js';

export default class HomePresenter {
	#view;
	#headerPresenter;
	#cameraService;
	#detectionService;
	#generatorService;
	#timer = null;
	#currentLoopId = null;
	#className = null;
	#generationResult = null;
	#maxLoop = 100;
	#loopCount = 0;

	constructor({ view, headerPresenter }) {
		this.#view = view;
		this.#headerPresenter = headerPresenter;
		this.#cameraService = new CameraService();
		this.#detectionService = new DetectionService();

		// Callback untuk update progress download model
		this.#generatorService = new GeneratorService((progress) => {
			this.#updateStatus(progress.message);
		});
	}

	#updateStatus(message) {
		if (this.#headerPresenter) {
			this.#headerPresenter.updateStatus(message);
		}
	}

	async initialApp() {
		this.#updateStatus('Memuat model AI...');
		try {
			this.#view.showCameraLoading();
			await this.#cameraService.loadCameras(this.#view.getCameraSelectElement());

			await this.#detectionService.loadModel();
			await this.#generatorService.loadModel();
			this.#updateStatus('Model AI Siap');

			this.#view.enableToggleButton();
		} catch (error) {
			console.error('initialApp: error:', error);
			this.#updateStatus('Model gagal dimuat');
			this.#view.showError(error.message);
		} finally {
			this.#view.hideCameraLoading();
		}
	}

	async copyToClipboard() {
		try {
			const text = this.#generationResult || 'Tidak ada informasi untuk disalin.';
			await navigator.clipboard.writeText(text);
			this.#view.showCopyFeedback();
		} catch (error) {
			this.#view.showCopyFeedback('Gagal menyalin informasi.', 'error');
			console.error('copyToClipboard: error:', error);
		}
	}

	async startCamera() {
		try {
			this.#view.showCameraLoading();
			await this.#cameraService.startCamera('media-video', 'media-canvas', this.#view.getCameraSelectElement());
			this.#view.showCameraActive();
			this.#view.showAnalyzingState();
			this.#startDetectionLoop();
		} catch (error) {
			console.error('startCamera: error:', error);
			this.#view.showError(error.message);
		} finally {
			this.#view.hideCameraLoading();
		}
	}

	stopCamera() {
		this.#stopDetectionLoop();
		this.#cameraService.stopCamera();
		this.#view.showCameraInactive();
		this.#view.showIdleState();
	}

	toggleCamera() {
		if (this.#cameraService.isActive()) {
			this.stopCamera();
		} else {
			this.startCamera();
		}
	}

	setFPS(fps) {
		this.#cameraService.setFPS(fps);
		if (this.#cameraService.isActive()) {
			this.#startDetectionLoop();
		}
	}

	setTone(tone) {
		this.#generatorService.setTone(tone);
	}

	#startDetectionLoop() {
		this.#stopDetectionLoop();
		const fps = Math.max(15, Math.min(60, this.#view.getFPSValue()));
		const interval = Math.round(1000 / fps);
		const loopId = Date.now();

		this.#currentLoopId = loopId;
		this.#loopCount = 0; // Reset counter setiap start loop baru
		this.#detectionLoop(loopId);
		this.#timer = setInterval(() => {
			this.#detectionLoop(loopId);
		}, interval);
	}

	#stopDetectionLoop() {
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = null;
		}
		this.#currentLoopId = null;
	}

	async #detectionLoop(loopId) {
		if (!this.#cameraService.isActive() || this.#currentLoopId !== loopId) {
			return;
		}

		this.#loopCount++;
		if (this.#loopCount >= this.#maxLoop) {
			this.#stopDetectionLoop();
			this.stopCamera();
			this.#view.showError(
				`Gagal mendeteksi sayuran setelah ${this.#maxLoop} kali percobaan. Pastikan objek terlihat jelas di kamera.`,
			);
			return;
		}

		const canvas = this.#cameraService.captureFrame();
		if (!canvas) return;

		try {
			const result = await this.#detectionService.predict(canvas);

			if (isValidDetection(result)) {
				this.#stopDetectionLoop();
				this.#view.showAnalyzingState();

				await createDelay(APP_CONFIG.analyzingDelay);

				this.#className = result.className;
				this.stopCamera();
				this.#view.showResultState(result.className, result.confidence);

				this.#generateNutritionAfterDetection(result.className, result.confidence);
			}
		} catch (error) {
			console.error('detectionLoop: error:', error);
		}
	}

	async regenerateNutrition() {
		this.#view.showRegenerateFeedback();
		await this.generateNutrition();
	}

	async generateNutrition(className = this.#className) {
		if (this.#generatorService.isReady()) {
			this.#view.showNutritionLoading();
			await createDelay(APP_CONFIG.analyzingDelay);

			try {
				const result = await this.#generatorService.generateFacts(className);
				// console.log('🚀 ~ HomePresenter ~ result:', result);
				this.#view.showNutritionSuccess(result.nutritionFact);
				this.#generationResult = result.nutritionFact;
			} catch (error) {
				console.error('generateFacts: error:', error);
				this.#view.showNutritionError();
			}
		} else {
			this.#view.showNutritionError();
		}
	}

	async #generateNutritionAfterDetection(className, confidence) {
		this.#view.showResultsWithNullNutrition(className, confidence);

		this.#cameraService.stopCamera();
		this.#view.showCameraInactive();
		this.#view.enableToggleButton();

		await this.generateNutrition(className);
	}
}

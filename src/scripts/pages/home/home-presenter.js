import { APP_CONFIG } from '../../config.js';
import CameraService from '../../services/camera.service.js';
import DetectionService from '../../services/detection.service.js';
import NutritionService from '../../services/nutrition.service.js';
import { createDelay, isValidDetection } from '../../utils/index.js';

export default class HomePresenter {
	#view;
	#headerPresenter;
	#cameraService;
	#detectionService;
	#nutritionService;
	#timer = null;
	#currentLoopId = null;

	constructor({ view, headerPresenter }) {
		this.#view = view;
		this.#headerPresenter = headerPresenter;
		this.#cameraService = new CameraService();
		this.#detectionService = new DetectionService();

		// Callback untuk update progress download model
		this.#nutritionService = new NutritionService((progress) => {
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
		this.#view.showCameraLoading();
		try {
			// await this.#cameraService.loadCameras(this.#view.getCameraSelectElement());
			// await this.#detectionService.loadModel();

			// await this.#nutritionService.loadModel();

			this.#updateStatus('Model AI Siap');
			this.#view.hideCameraLoading();
			this.#view.enableToggleButton();
		} catch (error) {
			console.error('initialApp: error:', error);
			this.#updateStatus('Model gagal dimuat');
			this.#view.hideCameraLoading();
			this.#view.showError(error.message);
		}
	}

	async startCamera() {
		this.#view.showCameraLoading();
		try {
			await this.#cameraService.startCamera('media-video', 'media-canvas', this.#view.getCameraSelectElement());
			this.#view.showCameraActive();
			this.#view.showAnalyzingState();
			this.#startDetectionLoop();
		} catch (error) {
			console.error('startCamera: error:', error);
			this.#view.hideCameraLoading();
			this.#view.showError(error.message);
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

	async generateNutrition(className) {
		this.#view.showNutritionLoading();
		try {
			const result = await this.#nutritionService.generateNutrition(className);
			this.#view.showNutritionSuccess(result.nutritionFact);
		} catch (error) {
			console.error('generateNutrition: error:', error);
			this.#view.showNutritionError();
		}
	}

	#startDetectionLoop() {
		this.#stopDetectionLoop();
		const fps = Math.max(15, Math.min(60, this.#view.getFPSValue()));
		const interval = Math.round(1000 / fps);
		const loopId = Date.now();

		this.#currentLoopId = loopId;
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

		const canvas = this.#cameraService.captureFrame();
		if (!canvas) return;

		try {
			const result = await this.#detectionService.predict(canvas);

			if (isValidDetection(result)) {
				this.#stopDetectionLoop();
				this.#view.showAnalyzingState();

				await createDelay(APP_CONFIG.analyzingDelay);

				this.stopCamera();
				this.#view.showResultState(result.className, result.confidence);

				this.#generateNutritionAfterDetection(result.className, result.confidence);
			}
		} catch (error) {
			console.error('detectionLoop: error:', error);
		}
	}

	async #generateNutritionAfterDetection(className, confidence) {
		this.#view.showResultsWithNullNutrition(className, confidence);

		this.#cameraService.stopCamera();
		this.#view.showCameraInactive();
		this.#view.enableToggleButton();

		if (this.#nutritionService.isReady()) {
			await createDelay(APP_CONFIG.analyzingDelay);
			this.#view.showNutritionLoading();

			try {
				const result = await this.#nutritionService.generateNutrition(className);
				this.#view.showNutritionSuccess(result.nutritionFact);
			} catch (error) {
				console.error('generateNutrition: error:', error);
				this.#view.showNutritionError();
			}
		} else {
			this.#view.showNutritionError();
		}
	}
}

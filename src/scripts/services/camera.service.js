import { getCameraConfig, getCameraConstraints, getCameraErrorMessage, logError } from '../utils/index.js';

class CameraService {
	constructor() {
		this.stream = null;
		this.video = null;
		this.canvas = null;
		this.config = getCameraConfig();
	}

	initializeElements(videoId, canvasId) {
		this.video = document.getElementById(videoId);
		this.canvas = document.getElementById(canvasId);
	}

	async loadCameras(cameraSelect) {
		try {
			const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });

			const devices = await navigator.mediaDevices.enumerateDevices();
			const cameras = devices.filter((device) => device.kind === 'videoinput');

			tempStream.getTracks().forEach((track) => track.stop());

			if (cameras.length === 0) {
				logError('Tidak ada kamera ditemukan', new Error('Tidak ada perangkat input video'));
				return [];
			}

			if (cameraSelect) {
				cameraSelect.innerHTML = '';
				cameras.forEach((camera, index) => {
					const option = document.createElement('option');
					option.value = camera.deviceId;
					option.textContent = camera.label || `Kamera ${index + 1}`;
					cameraSelect.appendChild(option);
				});
			}

			return cameras;
		} catch (error) {
			logError('Gagal memuat kamera', error);
			throw new Error(`Akses kamera gagal: ${error.message}`);
		}
	}

	async startCamera(videoId, canvasId, cameraSelect) {
		console.log('🚀 ~ CameraService ~ this.config:', this.config);

		try {
			this.initializeElements(videoId, canvasId);
			this.stopCamera();

			const selectedCameraId = cameraSelect ? cameraSelect.value : undefined;
			const constraints = getCameraConstraints(selectedCameraId);

			this.stream = await navigator.mediaDevices.getUserMedia(constraints);

			if (this.video) {
				this.video.srcObject = this.stream;
				await this.video.play();
			}

			return true;
		} catch (error) {
			logError('Gagal memulai kamera', error);
			const errorMessage = getCameraErrorMessage(error);
			throw new Error(errorMessage);
		}
	}

	stopCamera() {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;

			if (this.video) {
				this.video.srcObject = null;
			}
		}
	}

	setFPS(fps) {
		const { fpsRange } = this.config;
		if (fps < fpsRange.min || fps > fpsRange.max) {
			logError('FPS tidak valid', new Error(`FPS harus antara ${fpsRange.min} dan ${fpsRange.max}`));
			return;
		}
		this.config.defaultFPS = fps;
	}

	isActive() {
		return this.stream && this.stream.active;
	}

	isReady() {
		return this.isActive() && this.video && this.video.readyState >= 2 && !this.video.paused;
	}

	captureFrame() {
		if (!this.isReady() || !this.canvas) {
			return null;
		}

		const ctx = this.canvas.getContext('2d');
		this.canvas.width = this.video.videoWidth;
		this.canvas.height = this.video.videoHeight;
		ctx.drawImage(this.video, 0, 0);

		return this.canvas;
	}

	getConfig() {
		return this.config;
	}
}

export default CameraService;

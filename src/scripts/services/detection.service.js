import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';
import { validateModelMetadata, isWebGPUSupported, logError } from '../utils/index.js';
import { TENSORFLOW_CONFIG } from '../config.js';

class DetectionService {
	constructor() {
		this.model = null;
		this.labels = [];
		this.config = TENSORFLOW_CONFIG;
		this.performanceStats = {
			operations: 0,
			totalTime: 0,
			averageTime: 0,
		};
	}

	async loadModel() {
		try {
			const backend = isWebGPUSupported() ? 'webgpu' : 'webgl';

			await tf.setBackend(backend);
			await tf.ready();

			const backendName = tf.getBackend();

			const [metadata, model] = await Promise.all([
				fetch(this.config.metadataPath).then((r) => {
					if (!r.ok) {
						throw new Error(`HTTP ${r.status}: ${r.statusText}`);
					}
					return r.json();
				}),
				tf.loadLayersModel(this.config.modelPath),
			]);
			// console.log('🚀 ~ DetectionService ~ loadModel ~ model:', model);
			// console.log('🚀 ~ DetectionService ~ loadModel ~ metadata:', metadata);

			if (!validateModelMetadata(metadata)) {
				throw new Error('Metadata tidak valid: array label tidak ditemukan');
			}

			this.labels = metadata.labels;
			this.model = model;

			const result = {
				success: true,
				labels: this.labels,
				modelName: metadata.modelName || 'Tidak Diketahui',
				version: metadata.version || '1.0.0',
				backend: backendName,
			};
			// console.log('🚀 ~ DetectionService ~ loadModel ~ result:', result);

			return result;
		} catch (error) {
			logError('Gagal memuat model', error);
			throw new Error(`Gagal memuat model: ${error.message}`);
		}
	}

	async predict(imageElement) {
		if (!this.model) {
			throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
		}

		if (!imageElement) {
			throw new Error('Elemen gambar diperlukan untuk prediksi');
		}

		let tensor = null;
		let predictions = null;
		const startTime = performance.now();

		try {
			tensor = tf.tidy(() => {
				return tf.browser
					.fromPixels(imageElement)
					.resizeBilinear(this.config.inputSize)
					.div(this.config.normalizationFactor)
					.expandDims(0);
			});

			predictions = this.model.predict(tensor);
			const values = await predictions.data();

			const endTime = performance.now();
			const predictionTime = endTime - startTime;

			// Update performance stats
			this.performanceStats.operations++;
			this.performanceStats.totalTime += predictionTime;
			this.performanceStats.averageTime = this.performanceStats.totalTime / this.performanceStats.operations;

			const maxIndex = values.indexOf(Math.max(...values));
			const confidence = Math.round(values[maxIndex] * 100);
			const className = this.labels[maxIndex];
			const isValid = confidence >= this.config.confidenceThreshold;

			const result = {
				className: className,
				confidence: confidence,
				score: values[maxIndex],
				isValid: isValid,
				allPredictions: this.labels
					.map((label, index) => ({
						className: label,
						confidence: Math.round(values[index] * 100),
					}))
					.sort((a, b) => b.confidence - a.confidence),
				performance: {
					operationTime: Math.round(predictionTime),
					backend: tf.getBackend(),
					averageTime: Math.round(this.performanceStats.averageTime),
					totalOperations: this.performanceStats.operations,
				},
			};

			console.log('🚀 ~ DetectionService ~ predict ~ result:', result);
			return result;
		} catch (error) {
			logError('Kesalahan prediksi', error);
			throw new Error(`Prediksi gagal: ${error.message}`);
		} finally {
			if (tensor) tensor.dispose();
			if (predictions) predictions.dispose();
		}
	}

	isLoaded() {
		return !!this.model && this.labels.length > 0;
	}

	getLabels() {
		return this.labels;
	}
}

export default DetectionService;

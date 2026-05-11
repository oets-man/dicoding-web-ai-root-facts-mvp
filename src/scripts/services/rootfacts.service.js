import { pipeline } from '@huggingface/transformers';
import { APP_CONFIG, TRANSFORMERS_CONFIG } from '../config.js';
import { createDelay, createModelProgressCallback, isWebGPUSupported, logError } from '../utils/index.js';

class RootFactsService {
	constructor(onProgress = null) {
		this.generator = null;
		this.isModelLoaded = false;
		this.isGenerating = false;
		this.config = TRANSFORMERS_CONFIG;
		this.currentBackend = null;
		this.currentTone = 'normal';
		this.onProgress = onProgress; // Callback untuk update progress
	}

	// TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
	// TODO [Advance] Implementasikan strategi Backend Adaptive
	async loadModel() {
		try {
			const device = isWebGPUSupported() ? 'webgpu' : 'wasm';

			this.generator = await pipeline('text2text-generation', this.config.modelName, {
				dtype: 'q4',
				device,
				progress_callback: createModelProgressCallback(this.onProgress),
			});

			await createDelay(APP_CONFIG.nutritionGenerationDelay);

			this.isModelLoaded = true;
			this.currentBackend = device;

			return {
				success: true,
				model: this.config.modelName,
				backend: this.currentBackend,
			};
		} catch (error) {
			logError('Kesalahan memuat model Transformers.js', error);

			this.isModelLoaded = false;
			throw new Error(`Gagal memuat model: ${error.message}`);
		}
	}

	// TODO [Advance] Konfigurasi tone fakta yang dihasilkan
	setTone(tone) {}

	// TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
	// TODO [Basic] Tambahkan validasi untuk maksimum panjang input dan pembersihan input terhadap karakter khusus untuk mengatasi prompt injection
	// TODO [Skilled] Konfigurasikan parameter generasi berdasarkan kebutuhan
	// TODO [Advance] Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan
	async generateFacts(vegetable, tone = 'normal') {
		if (!this.isModelLoaded || this.isGenerating) {
			throw new Error('Model belum siap atau sedang menghasilkan konten');
		}

		if (!vegetable || typeof vegetable !== 'string') {
			throw new Error('Nama sayuran yang valid diperlukan');
		}

		try {
			this.isGenerating = true;

			await createDelay(APP_CONFIG.generationDelay);

			const prompt = `Write a simple nutrition fact about ${vegetable}. Include key nutritional benefits in 1-2 sentences.`;

			const result = await this.generator(prompt, {
				max_new_tokens: this.config.maxTokens,
				temperature: this.config.temperature,
				do_sample: true,
				top_p: this.config.topP,
			});

			const generatedText = result[0].generated_text;

			return {
				nutritionFact: generatedText.trim(),
				generated: true,
				source: 'Dihasilkan AI',
			};
		} catch (error) {
			logError('Kesalahan menghasilkan konten nutrisi', error);
			throw new Error(`Gagal menghasilkan informasi nutrisi: ${error.message}`);
		} finally {
			this.isGenerating = false;
		}
	}

	// TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
	isReady() {
		return this.isModelLoaded && !this.isGenerating;
	}
}

export default RootFactsService;

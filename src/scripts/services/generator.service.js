import { APP_CONFIG, TRANSFORMERS_CONFIG } from '../config.js';
import { createDelay, createModelProgressCallback, isWebGPUSupported, logError } from '../utils/index.js';

class GeneratorService {
	constructor(onProgress = null) {
		this.generator = null;
		this.isModelLoaded = false;
		this.isGenerating = false;
		this.config = TRANSFORMERS_CONFIG;
		this.currentBackend = null;
		this.currentTone = 'normal';
		this.onProgress = onProgress; // Callback untuk update progress
		this.pipelineModule = null; // Cache untuk dynamic import
	}

	// TODO [Basic] ✓ Muat model dan inisialisasi pipeline text2text-generation
	// TODO [Advance] ✓ Implementasikan strategi Backend Adaptive
	async loadModel() {
		try {
			const device = isWebGPUSupported() ? 'webgpu' : 'wasm';

			// Dynamic import untuk menghindari masalah __webpack_module__
			if (!this.pipelineModule) {
				this.pipelineModule = await import('@huggingface/transformers');
			}

			this.generator = await this.pipelineModule.pipeline('text2text-generation', this.config.modelName, {
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
			throw new Error(`Gagal memuat model: ${error.message}`, { cause: error });
		}
	}

	// TODO [Advance] ✓ Konfigurasi tone fakta yang dihasilkan
	setTone(tone) {
		this.currentTone = tone;
		// console.log('generator service set tone', this);
		return this;
	}

	// TODO [Basic] ✓ Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
	// TODO [Basic] ✓ Tambahkan validasi untuk maksimum panjang input dan pembersihan input terhadap karakter khusus untuk mengatasi prompt injection
	// TODO [Skilled] ✓ Konfigurasikan parameter generasi berdasarkan kebutuhan
	// TODO [Advance] ✓ Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan

	// CATATAN:
	// konfigurasi paramater generasi berdasarkan kebutuhan. atur di file config.js
	// tone dibuat dinamis. bisa diatur dari UI.
	// sesuai dengan contoh https://root-facts-advance.netlify.app/

	async generateFacts(vegetable, tone = this.currentTone || 'normal') {
		// console.log('🚀 ~ GeneratorService ~ generateFacts ~ this:', this);

		if (!this.isModelLoaded || this.isGenerating) {
			throw new Error('Model belum siap atau sedang menghasilkan konten');
		}

		if (!vegetable || typeof vegetable !== 'string') {
			throw new Error('Nama sayuran yang valid diperlukan');
		}

		const tonePrompts = {
			normal: `Write a simple nutrition fact about ${vegetable}. Include key nutritional benefits in 1-2 sentences. Use a neutral, informative tone.`,
			professional: `Write a professional nutrition brief about ${vegetable}. Include scientifically accurate health benefits and nutritional composition in a concise, formal manner. Keep it to 1-2 sentences.`,
			funny: `Write a fun and humorous nutrition fact about ${vegetable}. Make it lighthearted and entertaining while still including real nutritional benefits. Keep it to 1-2 sentences.`,
			casual: `Write a casual, friendly nutrition fact about ${vegetable}. Use conversational language like you're telling a friend about it. Include key nutritional benefits in 1-2 sentences.`,
		};

		try {
			this.isGenerating = true;

			await createDelay(APP_CONFIG.generationDelay);

			const prompt = tonePrompts[tone] || tonePrompts.normal;

			const generate = await this.generator(prompt, {
				max_new_tokens: this.config.maxTokens,
				temperature: this.config.temperature,
				do_sample: true,
				top_p: this.config.topP,
			});
			// console.log('🚀 ~ GeneratorService ~ generateFacts ~ generate:', generate);

			const generatedText = generate[0].generated_text;

			const result = {
				nutritionFact: generatedText.trim(),
				generated: true,
				source: 'Dihasilkan AI',
				tone: tone,
				backend: this.currentBackend,
				model: this.config.modelName,
				timestamp: new Date().toISOString(),
			};
			console.log('🚀 ~ GeneratorService ~ generateFacts ~ result:', result);

			return result;
		} catch (error) {
			logError('Kesalahan menghasilkan konten sayuran', error);
			throw new Error(`Gagal menghasilkan informasi sayuran: ${error.message}`, { cause: error });
		} finally {
			this.isGenerating = false;
		}
	}

	// TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
	isReady() {
		return this.isModelLoaded && !this.isGenerating;
	}
}

export default GeneratorService;

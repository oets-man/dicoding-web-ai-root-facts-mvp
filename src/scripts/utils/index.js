import { APP_CONFIG, UI_CONFIG, CAMERA_CONFIG } from '../config.js';

export const isMobileDevice = () => {
	return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const createDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const sleep = (time = 1000) => {
	return new Promise((resolve) => setTimeout(resolve, time));
};

export function showFormattedDate(date, locale = 'en-US', options = {}) {
	return new Date(date).toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		...options,
	});
}

export const isValidDetection = (result) => {
	const { detectionConfidenceThreshold } = APP_CONFIG;
	return result && result.isValid && result.confidence >= detectionConfidenceThreshold;
};

export const validateModelMetadata = (metadata) => {
	return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getConfidenceTheme = (confidence) => {
	const { excellent, good } = UI_CONFIG.confidenceThresholds;
	if (confidence >= excellent) return 'green';
	if (confidence >= good) return 'yellow';
	return 'red';
};

export const getConfidenceTextClass = (confidence) => {
	const theme = getConfidenceTheme(confidence);
	return `text-${theme}`;
};

export const getConfidenceCardClass = (confidence) => {
	const theme = getConfidenceTheme(confidence);
	return `theme-${theme}`;
};

export const getCameraErrorMessage = (error) => {
	if (error.name === 'NotAllowedError') {
		return 'Izin kamera ditolak. Harap izinkan akses kamera.';
	} else if (error.name === 'NotFoundError') {
		return 'Tidak ada kamera ditemukan pada perangkat ini.';
	} else if (error.name === 'NotReadableError') {
		return 'Kamera sedang digunakan oleh aplikasi lain.';
	}
	return 'Gagal memulai kamera';
};

export const addFadeInAnimation = (element) => {
	if (!element) return;

	const { fadeAnimation } = UI_CONFIG;
	element.style.animation = 'none';
	void element.offsetWidth;
	element.style.animation = fadeAnimation;
};

export const addScaleAnimation = (element, callback) => {
	if (!element) return;

	const { animationDuration } = UI_CONFIG;
	element.style.transform = 'scale(1.02)';
	element.style.transition = `transform ${animationDuration}ms ease`;

	setTimeout(() => {
		if (element) {
			element.style.transform = 'scale(1)';
		}
		if (callback) {
			callback();
		}
	}, animationDuration);
};

export const hideElement = (element) => {
	if (element) element.classList.add('hidden');
};

export const showElement = (element) => {
	if (element) element.classList.remove('hidden');
};

export const setElementOpacity = (element, opacity) => {
	if (element) element.style.opacity = opacity;
};

export const setElementText = (element, text) => {
	if (element) element.textContent = text;
};

export const setElementHTML = (element, html) => {
	if (element) element.innerHTML = html;
};

export const logError = (context, error) => {
	console.error(`❌ ${context}:`, error);
};

export const isWebGPUSupported = () => {
	return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

/**
 * Membuat callback untuk melacak progress download model.
 * Menghitung progress encoder dan decoder secara terpisah.
 * Menggunakan throttling untuk menghindari terlalu banyak pemanggilan callback.
 */
export const createModelProgressCallback = (onProgress, throttleMs = 200) => {
	const fileProgress = {};
	let lastMessage = '';
	let lastCallTime = 0;

	return (progress) => {
		// Abaikan jika bukan event progress atau tidak ada file
		if (progress.status !== 'progress' || !progress.file) return;

		// Filter hanya file encoder dan decoder
		const isEncoder = progress.file.includes('encoder');
		const isDecoder = progress.file.includes('decoder');
		if (!isEncoder && !isDecoder) return;

		// Update progress untuk file ini
		fileProgress[progress.file] = Math.round(progress.progress);

		// Hitung rata-rata progress untuk encoder dan decoder
		const encoderFiles = Object.entries(fileProgress).filter(([file]) => file.includes('encoder'));
		const decoderFiles = Object.entries(fileProgress).filter(([file]) => file.includes('decoder'));

		const average = (entries) => {
			if (entries.length === 0) return 0;
			const sum = entries.reduce((acc, [, val]) => acc + val, 0);
			return Math.round(sum / entries.length);
		};

		const encoder = average(encoderFiles);
		const decoder = average(decoderFiles);
		const message = `Mengunduh model AI... Encoder: ${encoder}% | Decoder: ${decoder}%`;

		// Throttling: hanya panggil callback jika ada perubahan dan interval terpenuhi
		if (message === lastMessage) return;

		const now = Date.now();
		if (now - lastCallTime < throttleMs) return;
		lastCallTime = now;
		lastMessage = message;

		if (onProgress && typeof onProgress === 'function') {
			onProgress({ status: 'downloading', encoder, decoder, message });
		}
	};
};

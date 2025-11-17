import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin(() => {
	if (process.server) return;

	// Ambil utilitas dari composable agar state reaktif ikut tersinkron
	let setMode, setPrimaryColor, setRootFontSize;
	try {
		// Dynamic import via global since direct import path alias may vary
		const acc = require('~/composables/useAccessibility');
		const useAcc = acc.useAccessibility || window.useAccessibility;
		if (typeof useAcc === 'function') {
			const api = useAcc();
			setMode = api.setMode;
			setPrimaryColor = api.setPrimaryColor;
			setRootFontSize = api.setRootFontSize;
		}
	} catch {}

	const getHostOrigin = () => {
		try {
			// Prioritaskan referrer dari host app
			const ref = document.referrer || '';
			if (ref) {
				const origin = new URL(ref).origin;
				if (origin) return origin;
			}

			// Fallback ke konfigurasi environment
			if (process.client) {
				const env = require('~/config/environment').default;
				return env.IS_PRODUCTION ? env.FRONTEND_URLS.PRODUCTION.ESS_HOST : env.FRONTEND_URLS.DEVELOPMENT.ESS_HOST;
			}

			return '*';
		} catch {
			return '*';
		}
	};

	const applyAccessibility = (payload = {}) => {
		const { mode, primaryColor, rootFontSize } = payload;

		// Terapkan ke state reaktif bila tersedia, agar UI menu ikut sinkron
		if (mode === 'light' || mode === 'dark') {
			if (typeof setMode === 'function') setMode(mode);
			document.documentElement.classList.toggle('dark', mode === 'dark');
		}
		if (primaryColor) {
			if (typeof setPrimaryColor === 'function') setPrimaryColor(primaryColor);
			document.documentElement.style.setProperty('--color-primary-500', primaryColor);
		}
		if (Number.isFinite(rootFontSize)) {
			if (typeof setRootFontSize === 'function') setRootFontSize(rootFontSize);
			document.documentElement.style.fontSize = `${rootFontSize}px`;
		}
	};

	window.addEventListener('message', (event) => {
		try {
			const type = event.data?.type;
			if (type !== 'ACCESSIBILITY_UPDATE') return;

			const data = event.data?.data || {};
			applyAccessibility(data);
		} catch {
			// no-op
		}
	});

	const postAccessibilityToHost = (payload) => {
		const hostOrigin = getHostOrigin();
		window.parent?.postMessage(
			{
				type: 'ACCESSIBILITY_UPDATE',
				source: 'update-data',
				data: {
					mode: payload?.mode,
					primaryColor: payload?.primaryColor,
					rootFontSize: payload?.rootFontSize,
				},
				timestamp: Date.now(),
			},
			hostOrigin
		);
	};

	return {
		provide: {
			postAccessibilityToHost,
			applyAccessibility,
		},
	};
});

/**
 * vitest.config.ts
 * ----------------
 *
 * Vitest configuration for the React wrapper. Uses `jsdom` so we get
 * a fake DOM to mount React components into; the actual
 * `@arraypress/waveform-player` library is mocked at the module
 * boundary (it relies on Web Audio + Canvas + Fetch which jsdom does
 * not implement). Tests therefore verify the wrapper's
 * responsibilities — option pass-through, useEffect lifecycle, ref
 * forwarding — without needing a real audio runtime.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.{ts,tsx}'],
		environment: 'jsdom',
		globals: false,
		setupFiles: ['./test/setup.ts'],
	},
});

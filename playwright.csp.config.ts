import { defineConfig } from '@playwright/test';
import config from './playwright.config';

/** Opt-in preview checks use an existing server and never start a development build. */
export default defineConfig({
	...config,
	testMatch: 'csp.spec.ts',
	workers: 1,
	use: {
		...config.use,
		baseURL: process.env.CSP_TEST_BASE_URL ?? 'http://localhost:3000',
		// Authenticated pages can contain personal data; do not record cookies/passwords in traces.
		trace: 'off',
		extraHTTPHeaders: process.env.CSP_TEST_PREVIEW_BYPASS
			? { 'x-vercel-protection-bypass': process.env.CSP_TEST_PREVIEW_BYPASS }
			: undefined,
	},
});

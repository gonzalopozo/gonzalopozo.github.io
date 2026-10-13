// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ getSessionCookie: vi.fn() }));
vi.mock('better-auth/cookies', () => ({ getSessionCookie: mocks.getSessionCookie }));
import { proxy } from '@/proxy';

beforeEach(() => {
	vi.stubEnv('CSP_ADMIN_MODE', 'report-only');
	vi.stubEnv('CSP_ADMIN_POLICY', 'static');
	vi.stubEnv('BLOB_PUBLIC_HOSTNAME', 'https://images.public.blob.vercel-storage.com');
	mocks.getSessionCookie.mockReturnValue(null);
});
afterEach(() => vi.unstubAllEnvs());

describe('administrative request policy', () => {
	it('preserves optimistic redirects and prevents shared caching', async () => {
		const response = await proxy(new NextRequest('https://example.com/dashboard/projects'));
		expect(response.headers.get('location')).toBe('https://example.com/login');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(response.headers.has('content-security-policy-report-only')).toBe(true);
		expect(response.headers.get('content-security-policy-report-only')).not.toContain(
			'upgrade-insecure-requests',
		);
	});
	it('replaces spoofed request nonces and CSP with a fresh preview nonce', async () => {
		vi.stubEnv('VERCEL_ENV', 'preview');
		vi.stubEnv('CSP_ADMIN_POLICY', 'nonce');
		vi.stubEnv('CSP_ADMIN_MODE', 'enforce');
		const request = () =>
			new NextRequest('https://example.com/login', {
				headers: {
					'x-nonce': 'attacker',
					'content-security-policy': "script-src * 'unsafe-inline'",
				},
			});
		const first = await proxy(request());
		const second = await proxy(request());
		const policy = first.headers.get('content-security-policy');
		expect(policy).toContain('nonce-');
		expect(policy).not.toContain('attacker');
		expect(policy).not.toContain('script-src *');
		expect(policy).toBe(first.headers.get('x-middleware-request-content-security-policy'));
		expect(first.headers.get('x-middleware-request-x-nonce')).not.toBe('attacker');
		expect(second.headers.get('content-security-policy')).not.toBe(policy);
	});
	it('keeps authenticated login redirects intact', async () => {
		mocks.getSessionCookie.mockReturnValue('cookie');
		const response = await proxy(new NextRequest('https://example.com/login'));
		expect(response.headers.get('location')).toBe('https://example.com/dashboard');
	});
});

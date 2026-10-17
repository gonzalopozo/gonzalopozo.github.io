import type { NextConfig } from 'next';
import { buildCsp, getCspHeaderName, getCspMode } from './lib/security/csp';

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	cacheComponents: true,
	// Valid in Next.js 16, not yet in the published types.
	// @ts-expect-error - remove when NextConfig includes partialPrefetching
	partialPrefetching: true,
	async headers() {
		const mode = getCspMode(process.env.CSP_PUBLIC_MODE);
		const policy = buildCsp({
			section: 'public',
			mode,
			isDevelopment: process.env.NODE_ENV === 'development',
			blobHostname: process.env.BLOB_PUBLIC_HOSTNAME,
		});
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
					},
					...(process.env.NODE_ENV === 'production'
						? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
						: []),
				],
			},
			{
				// Admin CSP belongs to proxy.ts. APIs/assets are not document policy targets.
				source: '/:path((?!login(?:/|$)|dashboard(?:/|$)|api(?:/|$)|_next(?:/|$)).*)',
				headers: [{ key: getCspHeaderName(mode), value: policy }],
			},
		];
	},

	experimental: {
		turbopackFileSystemCacheForDev: true,
		turbopackFileSystemCacheForBuild: true,
		optimizePackageImports: ['lucide-react', 'react-icons', '@radix-ui/react-icons'],
	},
	images: {
		remotePatterns: [
			new URL(`${process.env.BLOB_PUBLIC_HOSTNAME}/**`),
			new URL('https://lastfm.freetls.fastly.net/**'),
			new URL('https://image-cdn-**.spotifycdn.com/**'),
			new URL('https://i.scdn.co/**'),
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '**.mzstatic.com',
				pathname: '/**',
			},
		],
	},
};

export default nextConfig;

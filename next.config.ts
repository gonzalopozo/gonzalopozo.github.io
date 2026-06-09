import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	cacheComponents: true,

	experimental: {
		turbopackFileSystemCacheForDev: true,
		turbopackFileSystemCacheForBuild: true,
		optimizePackageImports: ['lucide-react', 'react-icons', '@radix-ui/react-icons'],
	},
	images: {
		remotePatterns: [
			new URL(`${process.env.BLOB_PUBLIC_HOSTNAME}/**`),
			new URL('https://lastfm.freetls.fastly.net/**'),
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

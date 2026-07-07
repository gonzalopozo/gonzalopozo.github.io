import 'server-only';

const SPOTIFY_OEMBED_ENDPOINT = 'https://open.spotify.com/oembed';

type SpotifyOEmbedFetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface SpotifyOEmbedOptions {
	fetcher?: SpotifyOEmbedFetcher;
}

interface SpotifyOEmbedResponse {
	provider_name?: string;
	thumbnail_url?: string;
	thumbnail_width?: number;
	thumbnail_height?: number;
}

export async function getSpotifyOEmbedThumbnailUrl(
	spotifyUrl: string,
	options: SpotifyOEmbedOptions = {},
): Promise<string | null> {
	const response = await safeFetch(options.fetcher ?? fetch, buildSpotifyOEmbedUrl(spotifyUrl));
	if (!response?.ok) return null;

	const embed = await parseJson<SpotifyOEmbedResponse>(response);
	if (embed?.provider_name !== 'Spotify') return null;

	const thumbnailUrl = embed.thumbnail_url?.trim();
	return thumbnailUrl || null;
}

function buildSpotifyOEmbedUrl(spotifyUrl: string): URL {
	const url = new URL(SPOTIFY_OEMBED_ENDPOINT);
	url.search = new URLSearchParams({ url: spotifyUrl }).toString();
	return url;
}

async function safeFetch(
	fetcher: SpotifyOEmbedFetcher,
	input: string | URL,
	init?: RequestInit,
): Promise<Response | null> {
	try {
		return await fetcher(input, init);
	} catch {
		return null;
	}
}

async function parseJson<T>(response: Response): Promise<T | null> {
	try {
		return (await response.json()) as T;
	} catch {
		return null;
	}
}

import 'server-only';
import {
	SPOTIFY_MARKET,
	buildSpotifyTrackSearchQuery,
	selectBestSpotifyTrack,
	type SpotifyTrackMatch,
	type SpotifyTrackObject,
	type SpotifyTrackSearchInput,
} from '@/lib/spotify-utils';

const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_ENDPOINT = 'https://api.spotify.com/v1/search';
const SPOTIFY_TOKEN_EXPIRY_BUFFER_MS = 60_000;
const SPOTIFY_MAX_RETRIES = 2;
const SPOTIFY_MAX_RETRY_AFTER_MS = 2_000;

type SpotifyFetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;
type SpotifySleep = (ms: number) => Promise<void>;

interface CachedSpotifyToken {
	accessToken: string;
	expiresAt: number;
}

interface SpotifyClientOptions {
	fetcher?: SpotifyFetcher;
	sleep?: SpotifySleep;
	now?: () => number;
	maxRetries?: number;
}

interface SpotifyTokenResponse {
	access_token?: string;
	expires_in?: number;
	token_type?: string;
}

interface SpotifySearchResponse {
	tracks?: {
		items?: SpotifyTrackObject[];
	};
}

let cachedSpotifyToken: CachedSpotifyToken | null = null;

export async function findSpotifyTrackForLastFmTrack(
	input: SpotifyTrackSearchInput,
	options: SpotifyClientOptions = {},
): Promise<SpotifyTrackMatch | null> {
	const query = buildSpotifyTrackSearchQuery(input);
	if (!query) return null;

	const response = await fetchSpotifySearch(query, options);
	if (!response) return null;

	const searchResult = await parseJson<SpotifySearchResponse>(response);
	if (!searchResult) return null;

	return selectBestSpotifyTrack(input, searchResult.tracks?.items ?? []);
}

export function resetSpotifyTokenCacheForTesting(): void {
	cachedSpotifyToken = null;
}

async function fetchSpotifySearch(
	query: string,
	options: SpotifyClientOptions,
): Promise<Response | null> {
	const fetcher = options.fetcher ?? fetch;
	const sleep = options.sleep ?? defaultSleep;
	const now = options.now ?? Date.now;
	const maxRetries = options.maxRetries ?? SPOTIFY_MAX_RETRIES;
	let accessToken = await getSpotifyAccessToken(options);
	let hasRefreshedAfterUnauthorized = false;

	if (!accessToken) return null;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		const url = new URL(SPOTIFY_SEARCH_ENDPOINT);
		url.search = new URLSearchParams({
			q: query,
			type: 'track',
			market: SPOTIFY_MARKET,
			limit: '5',
		}).toString();

		const response = await safeFetch(fetcher, url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response) {
			if (attempt < maxRetries) {
				await sleep(getBackoffMs(attempt));
				continue;
			}
			return null;
		}

		if (response.ok) return response;

		if (response.status === 401 && !hasRefreshedAfterUnauthorized) {
			await readSpotifyErrorMessage(response);
			cachedSpotifyToken = null;
			accessToken = await getSpotifyAccessToken({ ...options, forceRefresh: true });
			hasRefreshedAfterUnauthorized = true;

			if (!accessToken) return null;
			continue;
		}

		if (response.status === 429 && attempt < maxRetries) {
			const retryAfterMs = getRetryAfterMs(response.headers.get('Retry-After'), now());
			if (retryAfterMs > SPOTIFY_MAX_RETRY_AFTER_MS) return null;

			await sleep(retryAfterMs);
			continue;
		}

		if (response.status >= 500 && response.status < 600 && attempt < maxRetries) {
			await sleep(getBackoffMs(attempt));
			continue;
		}

		await readSpotifyErrorMessage(response);
		return null;
	}

	return null;
}

async function getSpotifyAccessToken(
	options: SpotifyClientOptions & { forceRefresh?: boolean } = {},
): Promise<string | null> {
	const fetcher = options.fetcher ?? fetch;
	const now = options.now ?? Date.now;
	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

	if (!clientId || !clientSecret) return null;

	const currentTime = now();
	if (
		!options.forceRefresh &&
		cachedSpotifyToken &&
		cachedSpotifyToken.expiresAt > currentTime + SPOTIFY_TOKEN_EXPIRY_BUFFER_MS
	) {
		return cachedSpotifyToken.accessToken;
	}

	const response = await safeFetch(fetcher, SPOTIFY_TOKEN_ENDPOINT, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' }),
	});

	if (!response?.ok) {
		if (response) await readSpotifyErrorMessage(response);
		return null;
	}

	const token = await parseJson<SpotifyTokenResponse>(response);
	if (!token?.access_token || !token.expires_in) return null;

	cachedSpotifyToken = {
		accessToken: token.access_token,
		expiresAt: currentTime + token.expires_in * 1000,
	};

	return cachedSpotifyToken.accessToken;
}

async function safeFetch(
	fetcher: SpotifyFetcher,
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

async function readSpotifyErrorMessage(response: Response): Promise<string | null> {
	const error = await parseJson<{ error?: { message?: string } | string }>(response);

	if (typeof error?.error === 'string') return error.error;
	return error?.error?.message ?? null;
}

function getRetryAfterMs(value: string | null, now: number): number {
	if (!value) return getBackoffMs(0);

	const seconds = Number(value);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

	const date = Date.parse(value);
	if (!Number.isNaN(date)) return Math.max(0, date - now);

	return getBackoffMs(0);
}

function getBackoffMs(attempt: number): number {
	return 250 * 2 ** attempt;
}

function defaultSleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

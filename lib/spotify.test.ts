import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
	findSpotifyTrackForLastFmTrack,
	resetSpotifyTokenCacheForTesting,
} from '@/lib/spotify';

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
	return new Response(JSON.stringify(body), { status, headers });
}

function tokenResponse(accessToken: string, expiresIn = 3600): Response {
	return jsonResponse({
		access_token: accessToken,
		token_type: 'Bearer',
		expires_in: expiresIn,
	});
}

function searchResponse(trackId = 'spotify-track'): Response {
	return jsonResponse({
		tracks: {
			items: [
				{
					id: trackId,
					name: 'Come Together',
					artists: [{ name: 'The Beatles' }],
					album: {
						name: 'Abbey Road',
						images: [
							{
								url: 'https://i.scdn.co/image/cover',
								height: 640,
								width: 640,
							},
						],
					},
					external_urls: {
						spotify: `https://open.spotify.com/track/${trackId}`,
					},
					is_playable: true,
				},
			],
		},
	});
}

const searchInput = {
	trackName: 'Come Together',
	artistName: 'The Beatles',
	albumName: 'Abbey Road',
};

describe('findSpotifyTrackForLastFmTrack', () => {
	beforeEach(() => {
		resetSpotifyTokenCacheForTesting();
		process.env.SPOTIFY_CLIENT_ID = 'client-id';
		process.env.SPOTIFY_CLIENT_SECRET = 'client-secret';
	});

	it('reuses a valid client credentials token between searches', async () => {
		const fetcher = vi.fn(async (input: string | URL) => {
			const url = String(input);
			if (url === 'https://accounts.spotify.com/api/token') return tokenResponse('cached-token');
			return searchResponse('cached-search');
		});

		const first = await findSpotifyTrackForLastFmTrack(searchInput, { fetcher });
		const second = await findSpotifyTrackForLastFmTrack(searchInput, { fetcher });

		expect(first?.spotifyTrackId).toBe('cached-search');
		expect(second?.spotifyTrackId).toBe('cached-search');
		expect(fetcher).toHaveBeenCalledTimes(3);
		expect(
			fetcher.mock.calls.filter(([input]) => String(input) === 'https://accounts.spotify.com/api/token'),
		).toHaveLength(1);
	});

	it('requests a fresh token before the cached token expires', async () => {
		let now = 0;
		const fetcher = vi.fn(async (input: string | URL) => {
			const url = String(input);
			if (url === 'https://accounts.spotify.com/api/token') {
				return tokenResponse(fetcher.mock.calls.length === 1 ? 'first-token' : 'second-token', 120);
			}
			return searchResponse('fresh-token-search');
		});

		await findSpotifyTrackForLastFmTrack(searchInput, { fetcher, now: () => now });
		now = 70_000;
		await findSpotifyTrackForLastFmTrack(searchInput, { fetcher, now: () => now });

		expect(
			fetcher.mock.calls.filter(([input]) => String(input) === 'https://accounts.spotify.com/api/token'),
		).toHaveLength(2);
	});

	it('refreshes the token once after a 401 search response', async () => {
		const responses = [
			tokenResponse('expired-token'),
			jsonResponse({ error: { message: 'The access token expired' } }, 401),
			tokenResponse('fresh-token'),
			searchResponse('refreshed-search'),
		];
		const fetcher = vi.fn(async () => responses.shift() ?? searchResponse());

		const match = await findSpotifyTrackForLastFmTrack(searchInput, { fetcher });

		expect(match?.spotifyTrackId).toBe('refreshed-search');
		expect(fetcher).toHaveBeenCalledTimes(4);
	});

	it('waits for Retry-After before retrying after a 429 response', async () => {
		const responses = [
			tokenResponse('rate-limit-token'),
			jsonResponse({ error: { message: 'Rate limit exceeded' } }, 429, {
				'Retry-After': '1',
			}),
			searchResponse('retry-after-search'),
		];
		const sleep = vi.fn(async () => undefined);
		const fetcher = vi.fn(async () => responses.shift() ?? searchResponse());

		const match = await findSpotifyTrackForLastFmTrack(searchInput, { fetcher, sleep });

		expect(match?.spotifyTrackId).toBe('retry-after-search');
		expect(sleep).toHaveBeenCalledWith(1000);
	});

	it('returns null without fetching when Spotify credentials are missing', async () => {
		delete process.env.SPOTIFY_CLIENT_ID;
		delete process.env.SPOTIFY_CLIENT_SECRET;
		const fetcher = vi.fn(async () => searchResponse());

		await expect(findSpotifyTrackForLastFmTrack(searchInput, { fetcher })).resolves.toBeNull();
		expect(fetcher).not.toHaveBeenCalled();
	});
});

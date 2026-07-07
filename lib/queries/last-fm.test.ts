import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({
	cacheLife: vi.fn(),
	cacheTag: vi.fn(),
}));

vi.mock('@/lib/spotify-oembed', () => ({
	getSpotifyOEmbedThumbnailUrl: vi.fn(),
}));
vi.mock('@/lib/spotify-search-scraper', () => ({
	findExactSpotifyTrackUrlFromSearch: vi.fn(),
}));

import { getTrack } from '@/lib/queries/last-fm';
import { getSpotifyOEmbedThumbnailUrl } from '@/lib/spotify-oembed';
import { findExactSpotifyTrackUrlFromSearch } from '@/lib/spotify-search-scraper';

interface LastFmTrackJSON {
	'@attr'?: { nowplaying?: string };
	name: string;
	artist?: { '#text'?: string };
	album?: { '#text'?: string };
	url?: string;
	date?: { uts?: string; '#text'?: string };
}

const LASTFM_TRACK_URL = 'https://www.last.fm/music/The+Beatles/_/Come+Together';
const SPOTIFY_TRACK_URL = 'https://open.spotify.com/track/3qovVqQWqHRZ8B';
const SPOTIFY_THUMBNAIL_URL =
	'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e020e61ccc192d563f763decbb8';
const SPOTIFY_SEARCH_FALLBACK_URL =
	'https://open.spotify.com/search/Come%20Together%20The%20Beatles%20Abbey%20Road';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

function buildTrack(overrides: Partial<LastFmTrackJSON> = {}): LastFmTrackJSON {
	return {
		name: 'Come Together',
		artist: { '#text': 'The Beatles' },
		album: { '#text': 'Abbey Road' },
		url: LASTFM_TRACK_URL,
		...overrides,
	};
}

function stubLastFmResponse(track: LastFmTrackJSON | LastFmTrackJSON[], status = 200): Mock {
	const tracks = Array.isArray(track) ? track : [track];
	const fetchMock = vi.fn(async () => jsonResponse({ recenttracks: { track: tracks } }, status));
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('getTrack', () => {
	beforeEach(() => {
		vi.stubEnv('LASTFM_USERNAME', 'demo');
		vi.stubEnv('LASTFM_API_KEY', 'secret');
		vi.mocked(getSpotifyOEmbedThumbnailUrl).mockResolvedValue(null);
		vi.mocked(findExactSpotifyTrackUrlFromSearch).mockResolvedValue(null);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it('returns null when the Last.fm API responds with an error status', async () => {
		stubLastFmResponse(buildTrack(), 500);

		await expect(getTrack()).resolves.toBeNull();
		expect(findExactSpotifyTrackUrlFromSearch).not.toHaveBeenCalled();
		expect(getSpotifyOEmbedThumbnailUrl).not.toHaveBeenCalled();
	});

	it('returns null when there are no recent tracks in the response', async () => {
		stubLastFmResponse(buildTrack());
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ recenttracks: {} })),
		);

		await expect(getTrack()).resolves.toBeNull();
	});

	it('returns null when the recent tracks list is empty', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => jsonResponse({ recenttracks: { track: [] } })),
		);

		await expect(getTrack()).resolves.toBeNull();
	});

	it('maps a now-playing track to a Track with isOnline true', async () => {
		stubLastFmResponse(buildTrack({ '@attr': { nowplaying: 'true' } }));

		const result = await getTrack();

		expect(result).toEqual({
			isOnline: true,
			trackName: 'Come Together',
			artistName: 'The Beatles',
			albumName: 'Abbey Road',
			artworkUrl: null,
			lastFmUrl: LASTFM_TRACK_URL,
			spotifyTrackId: null,
			spotifyUrl: SPOTIFY_SEARCH_FALLBACK_URL,
			spotifyArtworkUrl: null,
			playedAtUnix: null,
			playedAtLabel: null,
		});
	});

	it('maps a recently played track with its playedAt timestamp', async () => {
		stubLastFmResponse(
			buildTrack({ date: { uts: '1700000000', '#text': '15 Nov 2023, 12:00' } }),
		);

		const result = await getTrack();

		expect(result?.isOnline).toBe(false);
		expect(result?.playedAtUnix).toBe(1700000000);
		expect(result?.playedAtLabel).toBe('15 Nov 2023, 12:00');
	});

	it('uses Spotify oEmbed artwork when the scraper finds an exact track URL', async () => {
		vi.mocked(findExactSpotifyTrackUrlFromSearch).mockResolvedValue(SPOTIFY_TRACK_URL);
		vi.mocked(getSpotifyOEmbedThumbnailUrl).mockResolvedValue(SPOTIFY_THUMBNAIL_URL);
		stubLastFmResponse(buildTrack());

		const result = await getTrack();

		expect(result?.artworkUrl).toBe(SPOTIFY_THUMBNAIL_URL);
		expect(result?.spotifyArtworkUrl).toBe(SPOTIFY_THUMBNAIL_URL);
		expect(result?.spotifyUrl).toBe(SPOTIFY_TRACK_URL);
		expect(result?.spotifyTrackId).toBeNull();
		expect(getSpotifyOEmbedThumbnailUrl).toHaveBeenCalledWith(SPOTIFY_TRACK_URL);
	});

	it('falls back to a Spotify search URL when no exact match is found', async () => {
		stubLastFmResponse(buildTrack());

		const result = await getTrack();

		expect(result?.spotifyUrl).toBe(SPOTIFY_SEARCH_FALLBACK_URL);
		expect(result?.artworkUrl).toBeNull();
		expect(result?.spotifyArtworkUrl).toBeNull();
		expect(findExactSpotifyTrackUrlFromSearch).toHaveBeenCalledOnce();
		expect(getSpotifyOEmbedThumbnailUrl).not.toHaveBeenCalled();
	});

	it('handles missing artist and album fields gracefully', async () => {
		stubLastFmResponse(buildTrack({ artist: undefined, album: undefined }));

		const result = await getTrack();

		expect(result?.artistName).toBeNull();
		expect(result?.albumName).toBeNull();
	});

	it('ignores a non-numeric playedAt uts value', async () => {
		stubLastFmResponse(buildTrack({ date: { uts: 'not-a-number', '#text': 'label' } }));

		const result = await getTrack();

		expect(result?.playedAtUnix).toBeNull();
		expect(result?.playedAtLabel).toBe('label');
	});

	it('builds the request URL with the configured Last.fm credentials', async () => {
		const fetchMock = stubLastFmResponse(buildTrack());

		await getTrack();

		expect(fetchMock).toHaveBeenCalledOnce();
		const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
		expect(requestUrl).toBe(
			'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=demo&api_key=secret&format=json&limit=1',
		);
	});

	it('enriches the track using the Spotify helpers', async () => {
		stubLastFmResponse(buildTrack());

		await getTrack();

		expect(findExactSpotifyTrackUrlFromSearch).toHaveBeenCalledWith({
			trackName: 'Come Together',
			artistName: 'The Beatles',
			albumName: 'Abbey Road',
		});
	});
});

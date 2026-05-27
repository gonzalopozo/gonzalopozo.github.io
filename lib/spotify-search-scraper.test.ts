import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
	findExactSpotifyTrackUrlFromSearch,
	selectFirstValidatedSpotifyTrackUrl,
	type SpotifyBrowser,
	type SpotifyBrowserLauncher,
	type SpotifyBrowserPage,
	type SpotifySearchScrapeResult,
} from '@/lib/spotify-search-scraper';

const searchInput = {
	trackName: 'Cuando Calienta El Sol',
	artistName: 'Luis Miguel',
	albumName: 'Soy Como Quiero Ser',
};

describe('selectFirstValidatedSpotifyTrackUrl', () => {
	it('returns the first Spotify track URL when title and artist are present', () => {
		expect(
			selectFirstValidatedSpotifyTrackUrl(searchInput, {
				bodyText: 'Top result Cuando Calienta El Sol Luis Miguel Songs',
				candidates: [
					{
						href: 'https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5',
						text: 'Cuando Calienta El Sol',
					},
					{
						href: 'https://open.spotify.com/track/not-used',
						text: 'Other Song',
					},
				],
			}),
		).toBe('https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5');
	});

	it('normalizes localized Spotify track URLs', () => {
		expect(
			selectFirstValidatedSpotifyTrackUrl(searchInput, {
				bodyText: 'Top result Cuando Calienta El Sol Luis Miguel Songs',
				candidates: [
					{
						href: 'https://open.spotify.com/intl-es/track/3hVaK0zn3sVWWY8TvN1Te5',
						text: 'Cuando Calienta El Sol',
					},
				],
			}),
		).toBe('https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5');
	});

	it('rejects the first result when the rendered page does not include the artist', () => {
		expect(
			selectFirstValidatedSpotifyTrackUrl(searchInput, {
				bodyText: 'Top result Cuando Calienta El Sol Different Artist Songs',
				candidates: [
					{
						href: 'https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5',
						text: 'Cuando Calienta El Sol',
					},
				],
			}),
		).toBeNull();
	});

	it('rejects the first result when its title does not match', () => {
		expect(
			selectFirstValidatedSpotifyTrackUrl(searchInput, {
				bodyText: 'Top result Si Te Dejas Llevar Luis Miguel Songs',
				candidates: [
					{
						href: 'https://open.spotify.com/track/3cdecPxEdxk99munEMVQ01',
						text: 'Si Te Dejas Llevar',
					},
				],
			}),
		).toBeNull();
	});
});

describe('findExactSpotifyTrackUrlFromSearch', () => {
	it('scrapes the first validated track URL from a rendered Spotify search page', async () => {
		const close = vi.fn(async () => undefined);
		const renderedResult: SpotifySearchScrapeResult = {
			bodyText: 'Top result Cuando Calienta El Sol Luis Miguel Songs',
			candidates: [
				{
					href: 'https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5',
					text: 'Cuando Calienta El Sol',
				},
			],
		};
		const page: SpotifyBrowserPage = {
			goto: async () => undefined,
			waitForSelector: async () => undefined,
			waitForTimeout: async () => undefined,
			evaluate: async <T>() => renderedResult as T,
		};
		const browser: SpotifyBrowser = {
			close,
			newPage: async () => page,
		};
		const browserLauncher: SpotifyBrowserLauncher = {
			launch: vi.fn(async () => browser),
		};

		await expect(
			findExactSpotifyTrackUrlFromSearch(searchInput, { browserLauncher, timeoutMs: 10 }),
		).resolves.toBe('https://open.spotify.com/track/3hVaK0zn3sVWWY8TvN1Te5');
		expect(close).toHaveBeenCalledOnce();
	});
});

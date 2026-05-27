import { describe, expect, it } from 'vitest';
import {
	buildSpotifyTrackSearchQuery,
	buildSpotifyTrackSearchUrl,
	selectBestSpotifyTrack,
	type SpotifyTrackObject,
} from '@/lib/spotify-utils';

const baseTrack: SpotifyTrackObject = {
	id: 'track-1',
	name: 'Come Together',
	artists: [{ name: 'The Beatles' }],
	album: {
		name: 'Abbey Road',
		images: [{ url: 'https://i.scdn.co/image/cover', height: 640, width: 640 }],
	},
	external_urls: {
		spotify: 'https://open.spotify.com/track/track-1',
	},
	is_playable: true,
	popularity: 50,
};

describe('buildSpotifyTrackSearchQuery', () => {
	it('builds a track search query with artist and album filters', () => {
		expect(
			buildSpotifyTrackSearchQuery({
				trackName: ' Come   Together ',
				artistName: ' The Beatles ',
				albumName: ' Abbey Road ',
			}),
		).toBe('track:Come Together artist:The Beatles album:Abbey Road');
	});

	it('returns null when the artist is missing', () => {
		expect(
			buildSpotifyTrackSearchQuery({
				trackName: 'Come Together',
				artistName: null,
				albumName: 'Abbey Road',
			}),
		).toBeNull();
	});
});

describe('buildSpotifyTrackSearchUrl', () => {
	it('builds a Spotify web search URL without calling the Spotify API', () => {
		expect(
			buildSpotifyTrackSearchUrl({
				trackName: 'Cuando Calienta El Sol',
				artistName: 'Luis Miguel',
				albumName: 'Soy Como Quiero Ser',
			}),
		).toBe(
			'https://open.spotify.com/search/Cuando%20Calienta%20El%20Sol%20Luis%20Miguel%20Soy%20Como%20Quiero%20Ser',
		);
	});
});

describe('selectBestSpotifyTrack', () => {
	it('selects the exact track and artist match using album as a tie-breaker', () => {
		const match = selectBestSpotifyTrack(
			{
				trackName: 'Come Together',
				artistName: 'The Beatles',
				albumName: 'Abbey Road',
			},
			[
				{
					...baseTrack,
					id: 'wrong-album',
					album: { ...baseTrack.album, name: 'The Beatles 1967-1970' },
					external_urls: { spotify: 'https://open.spotify.com/track/wrong-album' },
					popularity: 100,
				},
				{
					...baseTrack,
					id: 'abbey-road',
					external_urls: { spotify: 'https://open.spotify.com/track/abbey-road' },
					popularity: 1,
				},
			],
		);

		expect(match).toEqual({
			spotifyTrackId: 'abbey-road',
			spotifyUrl: 'https://open.spotify.com/track/abbey-road',
			spotifyArtworkUrl: 'https://i.scdn.co/image/cover',
		});
	});

	it('accepts common remaster suffix differences for confident matches', () => {
		const match = selectBestSpotifyTrack(
			{
				trackName: 'Come Together - 2019 Remaster',
				artistName: 'The Beatles',
				albumName: 'Abbey Road',
			},
			[baseTrack],
		);

		expect(match?.spotifyTrackId).toBe('track-1');
	});

	it('rejects unplayable, restricted, and mismatched tracks', () => {
		const match = selectBestSpotifyTrack(
			{
				trackName: 'Come Together',
				artistName: 'The Beatles',
				albumName: 'Abbey Road',
			},
			[
				{ ...baseTrack, id: 'unplayable', is_playable: false },
				{ ...baseTrack, id: 'restricted', restrictions: { reason: 'market' } },
				{ ...baseTrack, id: 'wrong-artist', artists: [{ name: 'A Different Artist' }] },
			],
		);

		expect(match).toBeNull();
	});
});

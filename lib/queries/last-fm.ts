import 'server-only';
import { type Track } from '@/lib/types';
import { cacheLife, cacheTag } from 'next/cache';
import { getSpotifyOEmbedThumbnailUrl } from '@/lib/spotify-oembed';
import { buildSpotifyTrackSearchUrl } from '@/lib/spotify-utils';
import { findExactSpotifyTrackUrlFromSearch } from '@/lib/spotify-search-scraper';

interface LastFmTrackJSON {
	'@attr'?: {
		nowplaying?: string;
	};
	name: string;
	artist?: {
		'#text'?: string;
	};
	album?: {
		'#text'?: string;
	};
	url?: string;
	date?: {
		uts?: string;
		'#text'?: string;
	};
}

interface LastFmRecentTracksResponse {
	recenttracks?: {
		track?: LastFmTrackJSON[];
	};
}

export async function getTrack(): Promise<Track | null> {
	'use cache';
	cacheLife({
		stale: 30,
		revalidate: 60,
		expire: 300,
	});
	cacheTag('track');

	const response = await fetch(
		`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${process.env.LASTFM_USERNAME}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`,
	);

	if (!response.ok) return null;

	const { recenttracks } = (await response.json()) as LastFmRecentTracksResponse;
	const tracks = recenttracks?.track;

	if (!tracks?.length) return null;

	const trackJSON = tracks[0];
	const isNowPlaying = trackJSON['@attr']?.nowplaying === 'true';
	const artistName = trackJSON.artist?.['#text'] ?? null;
	const albumName = trackJSON.album?.['#text'] ?? null;
	const playedAtUnix = parsePlayedAtUnix(trackJSON.date?.uts);
	const trackSearchInput = {
		trackName: trackJSON.name,
		artistName,
		albumName,
	};
	const exactSpotifyUrl = await findExactSpotifyTrackUrlFromSearch(trackSearchInput);
	const spotifyArtworkUrl = exactSpotifyUrl
		? await getSpotifyOEmbedThumbnailUrl(exactSpotifyUrl)
		: null;
	const spotifyUrl = exactSpotifyUrl ?? buildSpotifyTrackSearchUrl(trackSearchInput);

	return {
		isOnline: isNowPlaying,
		trackName: trackJSON.name,
		artistName,
		albumName,
		artworkUrl: spotifyArtworkUrl,
		lastFmUrl: trackJSON.url ?? null,
		spotifyTrackId: null,
		spotifyUrl,
		spotifyArtworkUrl,
		playedAtUnix,
		playedAtLabel: trackJSON.date?.['#text'] ?? null,
	};
}

function parsePlayedAtUnix(value: string | undefined): number | null {
	if (!value) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

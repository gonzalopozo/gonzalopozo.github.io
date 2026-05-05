import 'server-only';
import { type Track } from '@/lib/types';
import { cacheLife, cacheTag } from 'next/cache';

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

	const { recenttracks } = await response.json();
	const tracks = recenttracks?.track;

	if (!tracks?.length) return null;

	const trackJSON = tracks[0];
	const isNowPlaying = trackJSON['@attr']?.nowplaying === 'true';
	const rawArtworkUrl: string | undefined = trackJSON.image?.[2]?.['#text'];
	// Last.fm returns this MD5 hash for tracks with no album art — treat as null.
	const artworkUrl =
		rawArtworkUrl && !rawArtworkUrl.includes('2a96cbd8b46e442fc41c2b86b821562f')
			? rawArtworkUrl
			: null;

	return {
		isOnline: isNowPlaying,
		trackName: trackJSON.name,
		artistName: trackJSON.artist?.['#text'] ?? null,
		albumName: trackJSON.album?.['#text'] ?? null,
		artworkUrl,
		lastFmUrl: trackJSON.url ?? null,
		playedAtUnix: trackJSON.date?.uts ?? null,
		playedAtLabel: trackJSON.date?.['#text'] ?? null,
	};
}

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

	return {
		status: isNowPlaying ? 'now-playing' : 'last-played',
		trackName: trackJSON.name,
		artistName: trackJSON.artist?.['#text'] ?? null,
		albumName: trackJSON.album?.['#text'] ?? null,
		artworkUrl: trackJSON.image?.[2]?.['#text'] ?? null,
		lastFmUrl: trackJSON.url ?? null,
		playedAtUnix: trackJSON.date?.uts ?? null,
		playedAtLabel: trackJSON.date?.['#text'] ?? null,
	};
}

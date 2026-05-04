import 'server-only';
import { type Track } from '@/lib/types';

export async function getTrack(): Promise<Track | null> {
	const response = await fetch(
		`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${process.env.LASTFM_USERNAME}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`,
	);

	if (!response.ok) return null;

	const { recenttracks } = await response.json();
	const trackJSON = recenttracks.track;

	if (!recenttracks) return null;

	return {
		status: trackJSON['@attr'] ? 'now-playing' : 'last-played',
		trackName: trackJSON.name,
		artistName: trackJSON.artist['#text'],
		albumName: trackJSON.album['#text'] ?? null,
		artworkUrl: trackJSON.image[2]['#text'] ?? null,
		lastFmUrl: trackJSON.url ?? null,
		playedAtUnix: trackJSON.date.uts ?? null,
		playedAtLabel: trackJSON.date['#text'] ?? null,
	};
}

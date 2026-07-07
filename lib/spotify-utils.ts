export interface SpotifyTrackSearchInput {
	trackName: string;
	artistName: string | null;
	albumName: string | null;
}

export function buildSpotifyTrackSearchUrl(input: SpotifyTrackSearchInput): string | null {
	const track = sanitizeSpotifySearchTerm(input.trackName);
	const artist = sanitizeSpotifySearchTerm(input.artistName);
	const album = sanitizeSpotifySearchTerm(input.albumName);

	if (!track || !artist) return null;

	return `https://open.spotify.com/search/${encodeURIComponent(
		[track, artist, album].filter(Boolean).join(' '),
	)}`;
}

function sanitizeSpotifySearchTerm(value: string | null): string | null {
	const sanitized = value?.replace(/\s+/g, ' ').trim();
	return sanitized || null;
}

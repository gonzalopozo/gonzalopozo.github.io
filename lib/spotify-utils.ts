export const SPOTIFY_MARKET = 'ES';

export interface SpotifyTrackSearchInput {
	trackName: string;
	artistName: string | null;
	albumName: string | null;
}

export interface SpotifyImageObject {
	url: string;
	height: number | null;
	width: number | null;
}

export interface SpotifyArtistObject {
	name: string;
	external_urls?: {
		spotify?: string;
	};
}

export interface SpotifyTrackObject {
	id: string;
	name: string;
	artists: SpotifyArtistObject[];
	album: {
		name: string;
		images: SpotifyImageObject[];
		restrictions?: {
			reason?: string;
		};
	};
	external_urls?: {
		spotify?: string;
	};
	is_local?: boolean;
	is_playable?: boolean;
	popularity?: number;
	restrictions?: {
		reason?: string;
	};
}

export interface SpotifyTrackMatch {
	spotifyTrackId: string;
	spotifyUrl: string;
	spotifyArtworkUrl: string | null;
}

interface ScoredSpotifyTrack {
	score: number;
	track: SpotifyTrackObject;
}

export function buildSpotifyTrackSearchQuery({
	trackName,
	artistName,
	albumName,
}: SpotifyTrackSearchInput): string | null {
	const track = sanitizeSpotifySearchTerm(trackName);
	const artist = sanitizeSpotifySearchTerm(artistName);
	const album = sanitizeSpotifySearchTerm(albumName);

	if (!track || !artist) return null;

	return [`track:${track}`, `artist:${artist}`, album ? `album:${album}` : null]
		.filter(Boolean)
		.join(' ');
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

export function selectBestSpotifyTrack(
	input: SpotifyTrackSearchInput,
	tracks: SpotifyTrackObject[],
): SpotifyTrackMatch | null {
	const expectedTrack = normalizeTrackTitle(input.trackName);
	const expectedArtist = normalizeName(input.artistName);
	const expectedAlbum = normalizeName(input.albumName);

	if (!expectedTrack || !expectedArtist) return null;

	const scored = tracks
		.map((track): ScoredSpotifyTrack | null => {
			if (!isPlayableCatalogTrack(track)) return null;

			const trackName = normalizeTrackTitle(track.name);
			const hasTrackMatch =
				trackName === expectedTrack ||
				normalizeName(track.name) === normalizeName(input.trackName);
			const hasArtistMatch = track.artists.some(
				(artist) => normalizeName(artist.name) === expectedArtist,
			);

			if (!hasTrackMatch || !hasArtistMatch) return null;

			const albumName = normalizeName(track.album.name);
			const hasAlbumMatch = Boolean(expectedAlbum && albumName === expectedAlbum);
			const hasPartialAlbumMatch = Boolean(
				expectedAlbum &&
				(albumName.includes(expectedAlbum) || expectedAlbum.includes(albumName)),
			);

			let score = 100;
			if (hasAlbumMatch) score += 30;
			else if (hasPartialAlbumMatch) score += 12;
			score += Math.min(track.popularity ?? 0, 100) / 100;

			return { score, track };
		})
		.filter((track): track is ScoredSpotifyTrack => track !== null)
		.sort((a, b) => b.score - a.score);

	const best = scored[0]?.track;
	const spotifyUrl = best?.external_urls?.spotify;

	if (!best || !spotifyUrl) return null;

	return {
		spotifyTrackId: best.id,
		spotifyUrl,
		spotifyArtworkUrl: best.album.images[0]?.url ?? null,
	};
}

function sanitizeSpotifySearchTerm(value: string | null): string | null {
	const sanitized = value?.replace(/\s+/g, ' ').trim();
	return sanitized || null;
}

function isPlayableCatalogTrack(track: SpotifyTrackObject): boolean {
	if (track.is_local) return false;
	if (track.is_playable === false) return false;
	if (track.restrictions?.reason || track.album.restrictions?.reason) return false;
	return true;
}

function normalizeTrackTitle(value: string | null): string {
	return normalizeName(stripVersionDetails(value));
}

function stripVersionDetails(value: string | null): string | null {
	if (!value) return value;

	return value
		.replace(
			/\s*[-–—]\s*(\d{4}\s*)?(remaster(ed)?|radio edit|single version|album version|mono|stereo|clean|explicit).*$/i,
			'',
		)
		.replace(
			/\s*\((\d{4}\s*)?(remaster(ed)?|radio edit|single version|album version|mono|stereo|clean|explicit)[^)]+\)\s*$/i,
			'',
		)
		.trim();
}

function normalizeName(value: string | null): string {
	return (
		value
			?.normalize('NFKD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/&/g, ' and ')
			.replace(/['’]/g, '')
			.replace(/[^a-z0-9]+/g, ' ')
			.trim() ?? ''
	);
}

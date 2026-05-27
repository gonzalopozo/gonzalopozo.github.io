export const ITUNES_SEARCH_COUNTRY = 'ES';

export interface ITunesSongSearchInput {
	trackName: string;
	artistName: string | null;
	albumName: string | null;
}

export interface ITunesSongSearchResult {
	wrapperType?: string;
	kind?: string;
	trackId?: number;
	trackName?: string;
	artistName?: string;
	collectionName?: string;
	artworkUrl100?: string;
	trackViewUrl?: string;
}

export interface ITunesArtworkMatch {
	artworkUrl: string;
	trackViewUrl: string | null;
}

interface ScoredITunesSong {
	score: number;
	result: ITunesSongSearchResult;
}

export function buildITunesSongSearchTerm({
	trackName,
	artistName,
	albumName,
}: ITunesSongSearchInput): string | null {
	const track = sanitizeITunesSearchTerm(trackName);
	const artist = sanitizeITunesSearchTerm(artistName);
	const album = sanitizeITunesSearchTerm(albumName);

	if (!track || !artist) return null;

	return [track, artist, album].filter(Boolean).join(' ');
}

export function selectBestITunesArtwork(
	input: ITunesSongSearchInput,
	results: ITunesSongSearchResult[],
): ITunesArtworkMatch | null {
	const expectedTrack = normalizeTrackTitle(input.trackName);
	const expectedArtist = normalizeName(input.artistName);
	const expectedAlbum = normalizeName(input.albumName);

	if (!expectedTrack || !expectedArtist) return null;

	const scored = results
		.map((result): ScoredITunesSong | null => {
			if (result.kind !== 'song' || !result.artworkUrl100) return null;

			const hasTrackMatch = normalizeTrackTitle(result.trackName ?? null) === expectedTrack;
			const hasArtistMatch = normalizeName(result.artistName ?? null) === expectedArtist;

			if (!hasTrackMatch || !hasArtistMatch) return null;

			const albumName = normalizeName(result.collectionName ?? null);
			const hasAlbumMatch = Boolean(expectedAlbum && albumName === expectedAlbum);
			const hasPartialAlbumMatch = Boolean(
				expectedAlbum &&
				(albumName.includes(expectedAlbum) || expectedAlbum.includes(albumName)),
			);

			let score = 100;
			if (hasAlbumMatch) score += 30;
			else if (hasPartialAlbumMatch) score += 12;

			return { score, result };
		})
		.filter((result): result is ScoredITunesSong => result !== null)
		.sort((a, b) => b.score - a.score);

	const best = scored[0]?.result;
	if (!best?.artworkUrl100) return null;

	return {
		artworkUrl: getHigherResolutionArtworkUrl(best.artworkUrl100),
		trackViewUrl: best.trackViewUrl ?? null,
	};
}

function sanitizeITunesSearchTerm(value: string | null): string | null {
	const sanitized = value?.replace(/\s+/g, ' ').trim();
	return sanitized || null;
}

function getHigherResolutionArtworkUrl(artworkUrl: string): string {
	return artworkUrl.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, '/600x600bb.$1');
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

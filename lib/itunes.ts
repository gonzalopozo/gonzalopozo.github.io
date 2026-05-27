import 'server-only';
import {
	ITUNES_SEARCH_COUNTRY,
	buildITunesSongSearchTerm,
	selectBestITunesArtwork,
	type ITunesArtworkMatch,
	type ITunesSongSearchInput,
	type ITunesSongSearchResult,
} from '@/lib/itunes-utils';

const ITUNES_SEARCH_ENDPOINT = 'https://itunes.apple.com/search';

type ITunesFetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

interface ITunesClientOptions {
	fetcher?: ITunesFetcher;
}

interface ITunesSearchResponse {
	resultCount?: number;
	results?: ITunesSongSearchResult[];
}

export async function findITunesArtworkForTrack(
	input: ITunesSongSearchInput,
	options: ITunesClientOptions = {},
): Promise<ITunesArtworkMatch | null> {
	const term = buildITunesSongSearchTerm(input);
	if (!term) return null;

	const response = await safeFetch(options.fetcher ?? fetch, buildITunesSearchUrl(term));
	if (!response?.ok) return null;

	const searchResult = await parseJson<ITunesSearchResponse>(response);
	if (!searchResult) return null;

	return selectBestITunesArtwork(input, searchResult.results ?? []);
}

function buildITunesSearchUrl(term: string): URL {
	const url = new URL(ITUNES_SEARCH_ENDPOINT);
	url.search = new URLSearchParams({
		term,
		media: 'music',
		entity: 'song',
		country: ITUNES_SEARCH_COUNTRY,
		limit: '5',
	}).toString();

	return url;
}

async function safeFetch(
	fetcher: ITunesFetcher,
	input: string | URL,
	init?: RequestInit,
): Promise<Response | null> {
	try {
		return await fetcher(input, init);
	} catch {
		return null;
	}
}

async function parseJson<T>(response: Response): Promise<T | null> {
	try {
		return (await response.json()) as T;
	} catch {
		return null;
	}
}

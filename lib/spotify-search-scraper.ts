import 'server-only';
import { buildSpotifyTrackSearchUrl, type SpotifyTrackSearchInput } from '@/lib/spotify-utils';

const SPOTIFY_SEARCH_SCRAPE_TIMEOUT_MS = 8_000;
const SPOTIFY_TRACK_URL_PATTERN =
	/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/[A-Za-z0-9]+/;

export interface SpotifySearchScrapeCandidate {
	href: string;
	text: string;
}

export interface SpotifySearchScrapeResult {
	bodyText: string;
	candidates: SpotifySearchScrapeCandidate[];
}

export interface SpotifyBrowserPage {
	goto: (
		url: string,
		options?: { waitUntil?: 'domcontentloaded'; timeout?: number },
	) => Promise<unknown>;
	waitForSelector: (selector: string, options?: { timeout?: number }) => Promise<unknown>;
	waitForTimeout: (timeout: number) => Promise<unknown>;
	evaluate: <T>(callback: () => T) => Promise<T>;
}

export interface SpotifyBrowser {
	newPage: (options?: { userAgent?: string }) => Promise<SpotifyBrowserPage>;
	close: () => Promise<unknown>;
}

export interface SpotifyBrowserLauncher {
	launch: (options?: { headless?: boolean }) => Promise<SpotifyBrowser>;
}

interface SpotifySearchScraperOptions {
	browserLauncher?: SpotifyBrowserLauncher;
	timeoutMs?: number;
}

export async function findExactSpotifyTrackUrlFromSearch(
	input: SpotifyTrackSearchInput,
	options: SpotifySearchScraperOptions = {},
): Promise<string | null> {
	const searchUrl = buildSpotifyTrackSearchUrl(input);
	if (!searchUrl) return null;

	let browser: SpotifyBrowser | null = null;

	try {
		const browserLauncher = options.browserLauncher ?? (await loadChromiumBrowserLauncher());
		if (!browserLauncher) return null;

		const timeoutMs = options.timeoutMs ?? SPOTIFY_SEARCH_SCRAPE_TIMEOUT_MS;
		browser = await browserLauncher.launch({ headless: true });
		const page = await browser.newPage({
			userAgent:
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
		});

		await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
		await page.waitForSelector('a[href*="/track/"]', { timeout: timeoutMs });
		await page.waitForTimeout(250);

		const renderedResult = await page.evaluate<SpotifySearchScrapeResult>(() => ({
			bodyText: document.body.innerText,
			candidates: [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/track/"]')].map(
				(anchor) => ({
					href: anchor.href,
					text: anchor.textContent?.trim().replace(/\s+/g, ' ') ?? '',
				}),
			),
		}));

		return selectFirstValidatedSpotifyTrackUrl(input, renderedResult);
	} catch {
		return null;
	} finally {
		await browser?.close();
	}
}

export function selectFirstValidatedSpotifyTrackUrl(
	input: SpotifyTrackSearchInput,
	result: SpotifySearchScrapeResult,
): string | null {
	const expectedTrack = normalizeTrackTitle(input.trackName);
	const expectedArtist = normalizeName(input.artistName);
	const bodyText = normalizeName(result.bodyText);

	if (!expectedTrack || !expectedArtist) return null;
	if (!bodyText.includes(expectedArtist)) return null;

	const firstCandidate = result.candidates.find((candidate) =>
		SPOTIFY_TRACK_URL_PATTERN.test(candidate.href),
	);
	if (!firstCandidate) return null;

	const candidateTrack = normalizeTrackTitle(firstCandidate.text);
	if (candidateTrack !== expectedTrack) return null;

	return firstCandidate.href.replace(
		/^https:\/\/open\.spotify\.com\/intl-[a-z]{2}\//,
		'https://open.spotify.com/',
	);
}

async function loadChromiumBrowserLauncher(): Promise<SpotifyBrowserLauncher | null> {
	try {
		const { chromium } = (await import('@playwright/test')) as {
			chromium?: SpotifyBrowserLauncher;
		};
		return chromium ?? null;
	} catch {
		return null;
	}
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

import Image from 'next/image';
import { Clock, Music } from 'lucide-react';
import type { Track } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LastTrackGridItemContentProps {
	track: Track | null;
}

interface TrackArtworkProps {
	isOnline: boolean;
	trackName: string;
	safeArtist: string;
	artworkUrl: string | null;
	playedAtUnix: number | null;
	playedAtLabel: string | null;
}

export function LastTrackGridItemContent({ track }: LastTrackGridItemContentProps) {
	if (!track) {
		return <MusicEmptyState />;
	}

	const {
		isOnline,
		trackName,
		artistName,
		artworkUrl,
		lastFmUrl,
		spotifyUrl,
		spotifyArtworkUrl,
		playedAtUnix,
		playedAtLabel,
	} = track;
	const safeArtist = artistName?.trim() ? artistName : 'Unknown artist';
	const hasSpotifySource = Boolean(spotifyUrl || spotifyArtworkUrl);
	const sourceName = hasSpotifySource ? 'Spotify' : 'Last.fm';
	const sourceUrl = hasSpotifySource ? spotifyUrl : lastFmUrl;
	const ariaLabel = `${isOnline ? 'Now playing' : 'Last scrobbled'}: ${trackName} by ${safeArtist}${
		sourceUrl ? `. Opens ${sourceName}.` : ''
	}`;

	const inner = hasSpotifySource ? (
		<SpotifyTrackArtwork
			isOnline={isOnline}
			trackName={trackName}
			safeArtist={safeArtist}
			artworkUrl={spotifyArtworkUrl}
			playedAtUnix={playedAtUnix}
			playedAtLabel={playedAtLabel}
		/>
	) : (
		<LastFmTrackArtwork
			isOnline={isOnline}
			trackName={trackName}
			safeArtist={safeArtist}
			artworkUrl={artworkUrl}
			playedAtUnix={playedAtUnix}
			playedAtLabel={playedAtLabel}
		/>
	);

	const baseClassName =
		'relative block size-full overflow-hidden focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none';

	if (sourceUrl) {
		return (
			<a
				href={sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={ariaLabel}
				className={baseClassName}
			>
				{inner}
			</a>
		);
	}

	return (
		<div className={baseClassName} aria-label={ariaLabel}>
			{inner}
		</div>
	);
}

function SpotifyTrackArtwork({
	isOnline,
	trackName,
	safeArtist,
	artworkUrl,
	playedAtUnix,
	playedAtLabel,
}: TrackArtworkProps) {
	const hasArtwork = Boolean(artworkUrl);

	return (
		<>
			<div className="absolute inset-0 bg-linear-to-br from-card via-secondary/55 to-card" />
			{isOnline && <NowPlayingAtmosphere onArtwork={false} />}

			<SourceLabel source="spotify" onArtwork={false} />
			<ActivityBadge
				isOnline={isOnline}
				playedAtUnix={playedAtUnix}
				playedAtLabel={playedAtLabel}
				onArtwork={false}
			/>

			<div className="absolute inset-x-3 top-11 bottom-3 grid min-h-0 grid-cols-[5.25rem_minmax(0,1fr)] items-end gap-3 [@container_music-card_(min-width:300px)]:grid-cols-[6.75rem_minmax(0,1fr)]">
				<div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-border/70 bg-secondary/70 p-1.5 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--card)_70%,transparent)]">
					<div className="relative size-full">
						{hasArtwork ? (
							<Image
								src={artworkUrl!}
								alt=""
								fill
								sizes="(min-width: 996px) 7rem, (min-width: 768px) 6rem, 5.25rem"
								className="object-contain"
								aria-hidden="true"
							/>
						) : (
							<div className="grid size-full place-items-center">
								<Music className="size-9 text-primary/40" aria-hidden="true" />
							</div>
						)}
					</div>
				</div>

				<TrackText
					trackName={trackName}
					safeArtist={safeArtist}
					onArtwork={false}
					className="pb-1"
				/>
			</div>
		</>
	);
}

function LastFmTrackArtwork({
	isOnline,
	trackName,
	safeArtist,
	artworkUrl,
	playedAtUnix,
	playedAtLabel,
}: TrackArtworkProps) {
	const hasArtwork = Boolean(artworkUrl);

	return (
		<>
			{hasArtwork ? (
				<div
					className={cn(
						'absolute inset-0',
						isOnline &&
							`motion-safe:animate-now-playing-cover motion-reduce:scale-[1.015]`,
					)}
				>
					<Image
						src={artworkUrl!}
						alt=""
						fill
						sizes="(min-width: 996px) 25vw, (min-width: 768px) 50vw, 100vw"
						className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover/music:scale-[1.04]"
						aria-hidden="true"
					/>
				</div>
			) : (
				<div
					className={cn(
						'absolute inset-0 bg-linear-to-br from-primary/25 via-card to-card',
						isOnline &&
							`from-primary/35 via-accent/10 motion-safe:animate-now-playing-cover`,
					)}
				>
					<div className="absolute inset-0 grid place-items-center">
						<Music className="size-10 text-primary/40" aria-hidden="true" />
					</div>
				</div>
			)}

			{isOnline && <NowPlayingAtmosphere onArtwork={hasArtwork} />}

			{hasArtwork && (
				<>
					<div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/55 to-transparent" />
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/85 via-black/45 to-transparent transition-[background-image] duration-300 motion-safe:group-hover/music:from-black/90" />
				</>
			)}

			<SourceLabel source="last.fm" onArtwork={hasArtwork} />
			<ActivityBadge
				isOnline={isOnline}
				playedAtUnix={playedAtUnix}
				playedAtLabel={playedAtLabel}
				onArtwork={hasArtwork}
			/>

			<TrackText
				trackName={trackName}
				safeArtist={safeArtist}
				onArtwork={hasArtwork}
				className="absolute inset-x-3 bottom-3 z-10"
			/>
		</>
	);
}

function SourceLabel({ source, onArtwork }: { source: 'spotify' | 'last.fm'; onArtwork: boolean }) {
	return (
		<span
			className={cn(
				`absolute top-3 left-3 z-10 font-mono text-[10px] tracking-wide transition-colors`,
				onArtwork ? `text-white/70 group-hover/music:text-white` : 'text-muted-foreground',
			)}
			aria-hidden="true"
		>
			{source}
		</span>
	);
}

function ActivityBadge({
	isOnline,
	playedAtUnix,
	playedAtLabel,
	onArtwork,
}: {
	isOnline: boolean;
	playedAtUnix: number | null;
	playedAtLabel: string | null;
	onArtwork: boolean;
}) {
	return (
		<span
			className={cn(
				`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium tracking-wide uppercase backdrop-blur-md transition-colors`,
				isOnline
					? onArtwork
						? 'border-accent/30 bg-black/50 text-white/95 shadow-lg shadow-accent/20'
						: `border-primary/30 bg-primary/10 text-foreground shadow-lg shadow-primary/15`
					: onArtwork
						? 'border-white/10 bg-black/40 text-white/95'
						: 'border-foreground/10 bg-foreground/10 text-foreground',
			)}
		>
			{isOnline ? (
				<>
					<NowPlayingEqualiser onArtwork={onArtwork} />
					<span>Now Playing</span>
					<span className="sr-only">Currently playing</span>
				</>
			) : (
				<>
					<Clock className="size-3" aria-hidden="true" />
					<span>{formatRelative(playedAtUnix, playedAtLabel)}</span>
				</>
			)}
		</span>
	);
}

function TrackText({
	trackName,
	safeArtist,
	onArtwork,
	className,
}: {
	trackName: string;
	safeArtist: string;
	onArtwork: boolean;
	className?: string;
}) {
	return (
		<div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
			<p
				className={cn(
					'line-clamp-2 text-sm/tight font-semibold',
					onArtwork
						? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]'
						: 'text-foreground',
				)}
			>
				{trackName}
			</p>
			<p
				className={cn(
					'line-clamp-1 text-xs/tight',
					onArtwork ? 'text-white/85' : 'text-muted-foreground',
				)}
			>
				{safeArtist}
			</p>
		</div>
	);
}

function NowPlayingAtmosphere({ onArtwork }: { onArtwork: boolean }) {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<span
				className={cn(
					`absolute -top-12 -right-10 size-32 rounded-full blur-2xl motion-safe:animate-now-playing-glow motion-reduce:opacity-40`,
					onArtwork ? 'bg-accent/45' : 'bg-primary/25',
				)}
			/>
			<span
				className={cn(
					`absolute top-8 -left-20 h-14 w-[150%] rotate-[-14deg] motion-safe:animate-now-playing-sweep motion-reduce:hidden`,
					onArtwork ? 'bg-white/20' : 'bg-primary/10',
				)}
			/>
		</div>
	);
}

function NowPlayingEqualiser({ onArtwork }: { onArtwork: boolean }) {
	const barClass = cn(
		`block h-full w-0.5 origin-bottom rounded-full bg-current motion-reduce:scale-y-[0.65]`,
	);
	return (
		<span
			className={cn(
				'relative flex h-3.5 items-end gap-0.5',
				onArtwork ? 'text-accent' : 'text-primary',
			)}
			aria-hidden="true"
		>
			<span className="absolute -inset-1 rounded-full bg-current opacity-20 blur-sm motion-safe:animate-now-playing-glow motion-reduce:opacity-20" />
			<span className={cn(barClass, 'motion-safe:animate-eq-bar-1')} />
			<span className={cn(barClass, 'motion-safe:animate-eq-bar-2')} />
			<span className={cn(barClass, 'motion-safe:animate-eq-bar-3')} />
			<span className={cn(barClass, 'motion-safe:animate-eq-bar-4')} />
		</span>
	);
}

function formatRelative(unix: number | null, fallback: string | null): string {
	if (unix === null || unix === undefined) return fallback ?? '—';
	const ts = Number(unix);
	if (!Number.isFinite(ts)) return fallback ?? '—';
	const diff = Math.max(0, Math.floor(Date.now() / 1000) - ts);
	if (diff < 60) return 'now';
	if (diff < 3600) return `${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
	if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
	return (
		fallback ??
		new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	);
}

function MusicEmptyState() {
	return (
		<div className="relative size-full overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-primary/20 via-card to-card" />
			<div className="absolute inset-0 grid place-items-center">
				<Music className="size-10 text-primary/40" aria-hidden="true" />
			</div>
			<span
				className="absolute top-3 left-3 font-mono text-[10px] tracking-wide text-muted-foreground"
				aria-hidden="true"
			>
				last.fm
			</span>
			<div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-0.5">
				<p className="text-sm/tight font-semibold text-foreground">Not scrobbling</p>
				<p className="text-xs text-muted-foreground">No recent activity</p>
			</div>
		</div>
	);
}

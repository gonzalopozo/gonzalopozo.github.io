'use client';
'use no memo';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import {
	Briefcase,
	History,
	LayoutGrid,
	Send,
	UserRound,
	type LucideIcon,
} from 'lucide-react';
import {
	Responsive,
	useContainerWidth,
	type Layout,
	type LayoutItem,
	type ResponsiveLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useState, type ReactNode } from 'react';
import { Map, MapMarker, MarkerContent } from '@/components/ui/map';
import { ArroyomolinosMarkerPin, ArroyomolinosPopup } from '@/components/public/map-marker-content';
import { GridItem } from '@/components/public/grid-item';
import { InfoGridItemContent } from '@/components/public/info-grid-item-content';
import { LastTrackGridItemContent } from '@/components/public/last-track-grid-item-content';
import { SocialLinkGridItemContent } from '@/components/public/social-link-grid-item-content';
import { BB8ThemeSwitcher } from '@/components/public/bb8-theme-switcher';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';
import { type Settings, type Track } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FaGithub } from 'react-icons/fa';

export type InformationAboutMe = Omit<Settings, 'id' | 'updatedAt'>;

interface PortfolioGridProps {
	infoAboutMe: InformationAboutMe | undefined;
	projectCards: ReactNode[];
	lastTrack: Track | null;
}

type GridBreakpoint = 'lg' | 'md' | 'sm';
type SectionLayouts = ResponsiveLayouts<GridBreakpoint>;

const SEED_LAYOUTS_BY_SECTION: Record<string, SectionLayouts> = {
	All: {
		lg: [
			{ i: 'a', x: 0, y: 0, w: 4, h: 6 },
			{ i: 'b', x: 4, y: 0, w: 2, h: 6 },
			{ i: 'c', x: 6, y: 0, w: 2, h: 12 },
			{ i: 'd', x: 0, y: 1, w: 2, h: 6 },
			{ i: 'e', x: 2, y: 1, w: 2, h: 6 },
			{ i: 'f', x: 4, y: 1, w: 2, h: 12 },
			{ i: 'g', x: 0, y: 2, w: 4, h: 6 },
			{ i: 'i', x: 6, y: 2, w: 2, h: 6 },
		],
		md: [
			{ i: 'a', x: 0, y: 0, w: 4, h: 8 },
			{ i: 'c', x: 0, y: 8, w: 2, h: 12 },
			{ i: 'f', x: 2, y: 8, w: 2, h: 12 },
			{ i: 'g', x: 0, y: 20, w: 4, h: 6 },
			{ i: 'b', x: 0, y: 26, w: 2, h: 6 },
			{ i: 'd', x: 2, y: 26, w: 2, h: 6 },
			{ i: 'e', x: 0, y: 32, w: 2, h: 6 },
			{ i: 'i', x: 2, y: 32, w: 2, h: 6 },
		],
		sm: [
			{ i: 'a', x: 0, y: 0, w: 1, h: 8 },
			{ i: 'c', x: 0, y: 8, w: 1, h: 12 },
			{ i: 'f', x: 0, y: 20, w: 1, h: 12 },
			{ i: 'g', x: 0, y: 32, w: 1, h: 9 },
			{ i: 'd', x: 0, y: 41, w: 1, h: 6 },
			{ i: 'e', x: 0, y: 47, w: 1, h: 6 },
			{ i: 'i', x: 0, y: 53, w: 1, h: 6 },
			{ i: 'b', x: 0, y: 59, w: 1, h: 6 },
		],
	},
	'About me': {
		lg: [
			{ i: 'd', x: 0, y: 1, w: 1, h: 1 },
			{ i: 'e', x: 1, y: 2, w: 2, h: 1 },
			{ i: 'f', x: 3, y: 1, w: 1, h: 1 },
		],
		md: [
			{ i: 'd', x: 0, y: 0, w: 2, h: 8 },
			{ i: 'e', x: 1, y: 1, w: 3, h: 2 },
			{ i: 'f', x: 2, y: 2, w: 1, h: 1 },
		],
	},
};

const DRAG_CANCEL_SELECTORS =
	'button, a, input, textarea, select, [role="button"], .bb8-theme-switcher, .leaflet-container, .leaflet-interactive, .leaflet-control';

function layoutItemEquals(a: LayoutItem, b: LayoutItem): boolean {
	return a.i === b.i && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function layoutArraysEqual(a: Layout | undefined, b: Layout | undefined): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!layoutItemEquals(a[i]!, b[i]!)) return false;
	}
	return true;
}

function shallowEqualLayouts(a: SectionLayouts, b: SectionLayouts): boolean {
	const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
	for (const k of keys) {
		if (!layoutArraysEqual(a[k as GridBreakpoint], b[k as GridBreakpoint])) return false;
	}
	return true;
}

export function PortfolioGrid({ infoAboutMe, projectCards, lastTrack }: PortfolioGridProps) {
	const [section, setSection] = useQueryState(
		'section',
		parseAsStringLiteral(PORTFOLIO_SECTIONS),
	);
	const shouldReduceMotion = useReducedMotion();

	const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
	const [canMapMarkerJiggle, setCanMapMarkerJiggle] = useState(false);

	const [layoutsBySection, setLayoutsBySection] =
		useState<Record<string, SectionLayouts>>(SEED_LAYOUTS_BY_SECTION);

	const handleMapGridMouseEnter = () => {
		if (!isMapPopupOpen) {
			setCanMapMarkerJiggle(true);
		}
	};

	const handleMapGridMouseLeave = () => {
		setCanMapMarkerJiggle(false);
	};

	const handleMapPopupOpen = () => {
		setIsMapPopupOpen(true);
		setCanMapMarkerJiggle(false);
	};

	const handleMapPopupClose = () => {
		setIsMapPopupOpen(false);
	};

	const sections: {
		url: string;
		v: PortfolioSection | null;
		Icon: LucideIcon;
		GridItems?: ReactNode;
	}[] = [
		{ url: 'All', v: null, Icon: LayoutGrid, GridItems: [] },
		{
			url: 'About me',
			v: 'About me',
			Icon: UserRound,
			GridItems: [
				<div className="bg-primary w-50" key="d">
					d
				</div>,
				<div className="bg-accent w-50" key="e">
					e
				</div>,
				<div className="bg-secondary w-50" key="f">
					f
				</div>,
			],
		},
		{ url: 'Projects', v: 'Projects', Icon: Briefcase },
		{ url: 'Experience', v: 'Experience', Icon: History },
		{ url: 'Contact', v: 'Contact', Icon: Send },
	];

	const resolvedSection = sections.find((e) => e.v === section) ?? sections[0];
	const activeUrl = resolvedSection.url;
	const gridLayouts = layoutsBySection[activeUrl];

	const { width, containerRef, mounted } = useContainerWidth({
		measureBeforeMount: true,
	});

	const currentBreakpoint: GridBreakpoint = width >= 996 ? 'lg' : width >= 768 ? 'md' : 'sm';

	function handleLayoutChange(_current: Layout, all: ResponsiveLayouts) {
		setLayoutsBySection((prev) => {
			const existing = prev[activeUrl];
			const next = { ...(existing ?? {}), ...(all as SectionLayouts) };
			if (existing && shallowEqualLayouts(existing, next)) return prev;
			return { ...prev, [activeUrl]: next };
		});
	}

	const backdropEnterTransition = {
		duration: shouldReduceMotion ? 0.12 : 0.2,
		ease: 'easeOut' as const,
	};
	const backdropExitTransition = {
		duration: shouldReduceMotion ? 0.1 : 0.16,
		ease: 'easeOut' as const,
	};
	const popupInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 };
	const popupAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 };
	const popupExit = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 };
	const popupEnterTransition = {
		duration: shouldReduceMotion ? 0.14 : 0.24,
		ease: 'easeOut' as const,
	};
	const popupExitTransition = {
		duration: shouldReduceMotion ? 0.12 : 0.18,
		ease: 'easeIn' as const,
	};
	const navIndicatorTransition = shouldReduceMotion
		? { duration: 0.01, ease: 'linear' as const }
		: { type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.9 };
	const navLabelInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 };
	const navLabelAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 };
	const navLabelExit = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 };
	const navLabelTransition = {
		duration: shouldReduceMotion ? 0.01 : 0.16,
		ease: 'easeOut' as const,
	};

	return (
		<>
			<nav
				aria-label="Portfolio sections"
				className="flex justify-center px-[3.5vw] py-5 sm:h-24 sm:items-center sm:py-5"
			>
				<ul className="border-border/70 bg-card/90 shadow-foreground/10 flex max-w-[calc(100vw-1rem)] items-center gap-1 rounded-full border p-1 shadow-2xl backdrop-blur-xl sm:gap-1.5 sm:p-1.5">
					{sections.map(({ url, v, Icon }) => {
						const isActive = activeUrl === url;

						return (
							<li className="shrink-0" key={url}>
								<button
									aria-current={isActive ? 'page' : undefined}
									aria-label={isActive ? undefined : `Show ${url} section`}
									className={cn(
										'group/nav relative isolate flex h-10 touch-manipulation items-center overflow-hidden rounded-full outline-none transition-[background-color,box-shadow,color,transform,width] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] sm:h-12',
										isActive
											? 'w-[clamp(7rem,36vw,8rem)] justify-start pl-0.5 pr-3 text-primary-foreground sm:w-auto sm:min-w-40 sm:pl-1 sm:pr-5'
											: 'size-10 justify-center text-muted-foreground hover:text-foreground sm:size-12',
									)}
									onClick={() => setSection(v)}
									type="button"
								>
									{isActive && (
										<motion.span
											className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/25"
											layoutId="portfolio-nav-indicator"
											transition={navIndicatorTransition}
										/>
									)}

									<span
										className={cn(
											'relative z-10 grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-200 ease-out sm:size-10',
											isActive
												? 'bg-primary-foreground/15 text-primary-foreground'
												: 'bg-secondary text-muted-foreground group-hover/nav:bg-secondary/80 group-hover/nav:text-foreground',
										)}
									>
										<Icon aria-hidden="true" className="size-5" />
									</span>

									<AnimatePresence initial={false}>
										{isActive && (
											<motion.span
												animate={navLabelAnimate}
												className="relative z-10 min-w-0 truncate pl-2.5 text-sm font-semibold"
												exit={navLabelExit}
												initial={navLabelInitial}
												transition={navLabelTransition}
											>
												{url}
											</motion.span>
										)}
									</AnimatePresence>
								</button>
							</li>
						);
					})}
				</ul>
			</nav>

			<div ref={containerRef} className="mx-auto max-w-300 px-[3.5vw]">
				{mounted && (
					<Responsive
						layouts={gridLayouts}
						width={width}
						breakpoints={{ lg: 996, md: 768, sm: 0 }}
						cols={{ lg: 8, md: 4, sm: 1 }}
						rowHeight={30}
						margin={[16, 16]}
						containerPadding={[0, 0]}
						resizeConfig={{ enabled: false, handles: [] }}
						dragConfig={{
							enabled: currentBreakpoint === 'lg',
							bounded: true,
							threshold: 3,
							cancel: DRAG_CANCEL_SELECTORS,
						}}
						onLayoutChange={handleLayoutChange}
					>
						<GridItem variant="about" key="a">
							<InfoGridItemContent infoAboutMe={infoAboutMe!} />
						</GridItem>
						<GridItem
							variant="map"
							key="b"
							onMouseEnter={handleMapGridMouseEnter}
							onMouseLeave={handleMapGridMouseLeave}
						>
							<div className="relative size-full">
								<Map
									center={[-3.916, 40.27]}
									zoom={13}
									attributionControl={false}
									dragPan={false}
									dragRotate={false}
									scrollZoom={false}
								>
									<MapMarker
										key={'map-marker'}
										longitude={-3.916}
										latitude={40.27}
										onClick={handleMapPopupOpen}
									>
										<MarkerContent>
											<ArroyomolinosMarkerPin
												shouldJiggle={canMapMarkerJiggle && !isMapPopupOpen}
											/>
										</MarkerContent>
									</MapMarker>
								</Map>

								<AnimatePresence initial={false}>
									{isMapPopupOpen && (
										<motion.div
											aria-hidden="true"
											className="bg-background/12 absolute inset-0 z-10"
											onClick={handleMapPopupClose}
											initial={{ opacity: 0 }}
											animate={{
												opacity: 1,
												transition: backdropEnterTransition,
											}}
											exit={{
												opacity: 0,
												transition: backdropExitTransition,
											}}
										/>
									)}
								</AnimatePresence>

								<AnimatePresence initial={false}>
									{isMapPopupOpen && (
										<motion.div
											className="pointer-events-none absolute inset-x-2 top-4 bottom-4 z-20 flex items-start justify-center"
											initial={popupInitial}
											animate={{
												...popupAnimate,
												transition: popupEnterTransition,
											}}
											exit={{
												...popupExit,
												transition: popupExitTransition,
											}}
										>
											<ArroyomolinosPopup
												onClose={handleMapPopupClose}
												className="pointer-events-auto max-w-52 sm:max-w-56"
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</GridItem>
						<GridItem variant="music" key="d">
							<LastTrackGridItemContent track={lastTrack} />
						</GridItem>
						<GridItem variant="contact" key="e">
							<SocialLinkGridItemContent
								backgroundColor="#66696D"
								url="https://github.com/gonzalopozo"
								ariaLabel="Visit Gonzalo's GitHub profile"
							>
								<FaGithub aria-hidden="true" className="size-14 text-white/95" />
							</SocialLinkGridItemContent>
						</GridItem>
						{(['c', 'f', 'g'] as const).map((slot, index) =>
							projectCards[index] ? (
								<GridItem variant="project" key={slot}>
									{projectCards[index]}
								</GridItem>
							) : null,
						)}
						<GridItem variant="contact" key="i">
							<BB8ThemeSwitcher />
						</GridItem>
					</Responsive>
				)}
			</div>
		</>
	);
}

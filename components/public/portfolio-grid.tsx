'use client';
'use no memo';

import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { useQueryState } from 'nuqs';
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
import { HobbiesGridItemContent } from '@/components/public/hobbies-grid-item-content';
import { BB8ThemeSwitcher } from '@/components/public/bb8-theme-switcher';
import { portfolioSectionParser } from '@/components/public/portfolio-sections';
import { PortfolioNavigation } from '@/components/public/portfolio-navigation';
import { type Settings, type Track } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FaGithub } from 'react-icons/fa';

/** @public */
export type InformationAboutMe = Omit<Settings, 'id' | 'updatedAt'>;

interface PortfolioGridProps {
	infoAboutMe: InformationAboutMe | undefined;
	projectCards: ReactNode[];
	experienceCard: ReactNode;
	lastTrack: Track | null;
}

type GridBreakpoint = 'lg' | 'md' | 'sm';
type SectionLayouts = ResponsiveLayouts<GridBreakpoint>;

const SEED_LAYOUTS_BY_SECTION: Record<string, SectionLayouts> = {
	All: {
		lg: [
			{ i: 'a', x: 0, y: 0, w: 2, h: 6 },
			{ i: 'b', x: 2, y: 0, w: 1, h: 6 },
			{ i: 'c', x: 3, y: 0, w: 1, h: 12 },
			{ i: 'd', x: 0, y: 1, w: 1, h: 6 },
			{ i: 'e', x: 1, y: 1, w: 1, h: 6 },
			{ i: 'f', x: 2, y: 1, w: 1, h: 12 },
			{ i: 'g', x: 0, y: 19, w: 2, h: 6 },
			{ i: 'i', x: 3, y: 19, w: 1, h: 6 },
			{ i: 'h', x: 0, y: 25, w: 2, h: 6 },
			{ i: 'j', x: 2, y: 25, w: 2, h: 6 },
		],
		md: [
			{ i: 'a', x: 0, y: 0, w: 4, h: 8 },
			{ i: 'c', x: 0, y: 8, w: 2, h: 12 },
			{ i: 'f', x: 2, y: 8, w: 2, h: 12 },
			{ i: 'h', x: 0, y: 20, w: 4, h: 6 },
			{ i: 'j', x: 0, y: 26, w: 4, h: 6 },
			{ i: 'g', x: 0, y: 32, w: 4, h: 6 },
			{ i: 'b', x: 0, y: 38, w: 2, h: 6 },
			{ i: 'd', x: 2, y: 38, w: 2, h: 6 },
			{ i: 'e', x: 0, y: 44, w: 2, h: 6 },
			{ i: 'i', x: 2, y: 44, w: 2, h: 6 },
		],
		sm: [
			{ i: 'a', x: 0, y: 0, w: 1, h: 8 },
			{ i: 'c', x: 0, y: 8, w: 1, h: 12 },
			{ i: 'f', x: 0, y: 20, w: 1, h: 12 },
			{ i: 'h', x: 0, y: 32, w: 1, h: 9 },
			{ i: 'j', x: 0, y: 41, w: 1, h: 9 },
			{ i: 'g', x: 0, y: 50, w: 1, h: 9 },
			{ i: 'd', x: 0, y: 59, w: 1, h: 6 },
			{ i: 'e', x: 0, y: 65, w: 1, h: 6 },
			{ i: 'i', x: 0, y: 71, w: 1, h: 6 },
			{ i: 'b', x: 0, y: 77, w: 1, h: 6 },
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
const GRID_MAX_WIDTH_PX = 1308.6;
const GRID_ROW_HEIGHT_PX = 34.5;
const GRID_ITEM_MARGIN: [number, number] = [16, 16];
const GRID_COLUMNS_BY_BREAKPOINT: Record<GridBreakpoint, number> = {
	lg: 4,
	md: 4,
	sm: 1,
};

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

export function PortfolioGrid({
	infoAboutMe,
	projectCards,
	experienceCard,
	lastTrack,
}: PortfolioGridProps) {
	const [section, setSection] = useQueryState('section', portfolioSectionParser);
	const shouldReduceMotion = useReducedMotion();

	const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
	const [canMapMarkerJiggle, setCanMapMarkerJiggle] = useState(false);
	const [isGridEntering, setIsGridEntering] = useState(true);

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

	const activeUrl = section ?? 'All';
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
	const gridEntranceInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 };
	const gridEntranceAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
	const gridEntranceTransition = {
		duration: shouldReduceMotion ? 0.12 : 0.36,
		ease: 'easeOut' as const,
	};

	return (
		<LazyMotion features={domAnimation}>
			<PortfolioNavigation section={section} onSectionChange={setSection} />

			<div
				ref={containerRef}
				className="mx-auto px-[3.5vw] pb-48"
				style={{ maxWidth: GRID_MAX_WIDTH_PX }}
			>
				{mounted && (
					<m.div
						initial={gridEntranceInitial}
						animate={gridEntranceAnimate}
						transition={gridEntranceTransition}
						onAnimationComplete={() => setIsGridEntering(false)}
					>
						<Responsive
							className={cn(isGridEntering && 'portfolio-grid-entering')}
							layouts={gridLayouts}
							width={width}
							breakpoints={{ lg: 996, md: 768, sm: 0 }}
							cols={GRID_COLUMNS_BY_BREAKPOINT}
							rowHeight={GRID_ROW_HEIGHT_PX}
							margin={GRID_ITEM_MARGIN}
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
								variant="about"
								cardClassName="group/map"
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
													shouldJiggle={
														canMapMarkerJiggle && !isMapPopupOpen
													}
												/>
											</MarkerContent>
										</MapMarker>
									</Map>

									<AnimatePresence initial={false}>
										{isMapPopupOpen && (
											<m.div
												aria-hidden="true"
												className="absolute inset-0 z-10 bg-background/12"
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
											<m.div
												className="pointer-events-none absolute inset-x-2 inset-y-4 z-20 flex items-start justify-center"
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
											</m.div>
										)}
									</AnimatePresence>
								</div>
							</GridItem>
							<GridItem
								variant="about"
								cardClassName="group/music @container/music-card @container-[size] isolate"
								key="d"
							>
								<LastTrackGridItemContent track={lastTrack} />
							</GridItem>
							<GridItem variant="about" key="e">
								<SocialLinkGridItemContent
									backgroundColor="#66696D"
									url="https://github.com/gonzalopozo"
									ariaLabel="Visit Gonzalo's GitHub profile"
								>
									<FaGithub aria-hidden="true" className="size-14" />
								</SocialLinkGridItemContent>
							</GridItem>
							{(['c', 'f'] as const).map((slot, index) =>
								projectCards[index] ? (
									<GridItem variant="project" key={slot}>
										{projectCards[index]}
									</GridItem>
								) : null,
							)}
							<GridItem variant="experience" key="g">
								{experienceCard}
							</GridItem>
							<GridItem
								variant="about"
								cardClassName="group/hobby @container/hobby-card @container-[size] isolate"
								key="j"
							>
								<HobbiesGridItemContent />
							</GridItem>
							{projectCards[2] ? (
								<GridItem variant="project" key="h">
									{projectCards[2]}
								</GridItem>
							) : null}
							<GridItem variant="about" key="i">
								<BB8ThemeSwitcher />
							</GridItem>
						</Responsive>
					</m.div>
				)}
			</div>
		</LazyMotion>
	);
}

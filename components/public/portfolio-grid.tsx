'use client';
'use no memo';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Button } from '@/components/ui/button';
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
import type { ProjectCardLayout } from '@/components/public/project-grid-item-content';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';
import { ModeToggle } from '@/components/theme-toggler';
import { type Settings } from '@/lib/types';

export type InformationAboutMe = Omit<Settings, 'id' | 'updatedAt'>;

interface PortfolioGridProps {
	infoAboutMe: InformationAboutMe | undefined;
	projectCards: {
		featured: Record<ProjectCardLayout, ReactNode> | null;
		supporting: Record<ProjectCardLayout, ReactNode>[];
	};
}

type GridBreakpoint = 'lg' | 'md' | 'sm';
type SectionLayouts = ResponsiveLayouts<GridBreakpoint>;

const SEED_LAYOUTS_BY_SECTION: Record<string, SectionLayouts> = {
	All: {
		lg: [
			{ i: 'a', x: 0, y: 0, w: 4, h: 6 },
			{ i: 'b', x: 4, y: 0, w: 2, h: 6 },
			{ i: 'c', x: 6, y: 0, w: 2, h: 12 },
			{ i: 'd', x: 0, y: 1, w: 2, h: 12 },
			{ i: 'e', x: 2, y: 1, w: 4, h: 14 },
		],
		md: [
			{ i: 'a', x: 0, y: 0, w: 2, h: 8 },
			{ i: 'b', x: 1, y: 1, w: 3, h: 2 },
			{ i: 'c', x: 2, y: 2, w: 1, h: 1 },
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
	'button, a, input, textarea, select, [role="button"], .leaflet-container, .leaflet-interactive, .leaflet-control';

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

export function PortfolioGrid({ infoAboutMe, projectCards }: PortfolioGridProps) {
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
		GridItems?: ReactNode;
	}[] = [
		{ url: 'All', v: null, GridItems: [] },
		{
			url: 'About me',
			v: 'About me',
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
		{ url: 'Projects', v: 'Projects' },
		{ url: 'Experience', v: 'Experience' },
		{ url: 'Contact', v: 'Contact' },
	];

	const resolvedSection = sections.find((e) => e.v === section) ?? sections[0];
	const activeUrl = resolvedSection.url;
	const gridLayouts = layoutsBySection[activeUrl];

	const { width, containerRef, mounted } = useContainerWidth({
		measureBeforeMount: true,
	});

	const currentBreakpoint: GridBreakpoint = width >= 996 ? 'lg' : width >= 768 ? 'md' : 'sm';
	const supportingProjects = projectCards.supporting.slice(0, 2);
	const projectSlotLayouts: Layout =
		layoutsBySection.All?.lg ?? SEED_LAYOUTS_BY_SECTION.All.lg ?? [];

	function getProjectCardLayout(itemId: 'c' | 'd' | 'e'): ProjectCardLayout {
		const cardHeight = projectSlotLayouts.find((item) => item.i === itemId)?.h ?? 0;
		return cardHeight >= 12 ? 'vertical-tall' : 'default';
	}

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

	return (
		<>
			<nav className="h-32 px-[3.5vw]">
				<ul className="flex h-full flex-row items-center-safe justify-center gap-1.5">
					{sections.map((s) => (
						<li key={s.url}>
							<Button onClick={() => setSection(s.v)}>{s.url}</Button>
						</li>
					))}
					<ModeToggle />
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
								<Map center={[-3.916, 40.27]} zoom={13} attributionControl={false}>
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
						{supportingProjects[0] ? (
							<GridItem variant="project" key="c">
								{supportingProjects[0][getProjectCardLayout('c')]}
							</GridItem>
						) : null}
						{supportingProjects[1] ? (
							<GridItem variant="project" key="d">
								{supportingProjects[1][getProjectCardLayout('d')]}
							</GridItem>
						) : null}
						{projectCards.featured ? (
							<GridItem variant="project" key="e">
								{projectCards.featured[getProjectCardLayout('e')]}
							</GridItem>
						) : null}
					</Responsive>
				)}
			</div>
		</>
	);
}

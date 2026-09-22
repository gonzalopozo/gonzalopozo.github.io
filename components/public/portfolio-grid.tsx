'use client';
'use no memo';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'motion/react';
import { useQueryState } from 'nuqs';
import {
	GridLayout,
	noCompactor,
	verticalCompactor,
	useContainerWidth,
	type Layout,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useMemo, useState, type ReactNode } from 'react';
import { PortfolioNavigation } from '@/components/public/portfolio-navigation';
import { GridItem } from '@/components/public/grid-item';
import { InfoGridItemContent } from '@/components/public/info-grid-item-content';
import { MapGridItemContent } from '@/components/public/map-grid-item-content';
import { LastTrackGridItemContent } from '@/components/public/last-track-grid-item-content';
import { HobbiesGridItemContent } from '@/components/public/hobbies-grid-item-content';
import { BB8ThemeSwitcher } from '@/components/public/bb8-theme-switcher';
import { portfolioSectionParser } from '@/components/public/portfolio-sections';
import {
	createCollectionCards,
	createSectionLayouts,
	getSectionCards,
	matchesSection,
	GRID_COLUMNS_BY_BREAKPOINT,
	type GridBreakpoint,
	type PortfolioCardDescriptor,
	type PortfolioGridCard,
	type SectionLayouts,
} from '@/components/public/portfolio-grid-layout';
import { usePortfolioTransition } from '@/components/public/use-portfolio-transition';
import { type Settings, type Track } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PortfolioGridProps {
	infoAboutMe: Omit<Settings, 'id' | 'updatedAt'> | undefined;
	projectCards: PortfolioCardDescriptor[];
	experienceCards: PortfolioCardDescriptor[];
	experienceOverviewCard: ReactNode;
	socialLinkCards: PortfolioCardDescriptor[];
	lastTrack: Track | null;
}

const DRAG_CANCEL_SELECTORS =
	'button, a, input, textarea, select, [role="button"], [role="region"], .bb8-theme-switcher, .maplibregl-map';
const GRID_MAX_WIDTH_PX = 1308.6;
const GRID_ROW_HEIGHT_PX = 34.5;
const GRID_ITEM_MARGIN: [number, number] = [16, 16];

export function PortfolioGrid({
	infoAboutMe,
	projectCards,
	experienceCards,
	experienceOverviewCard,
	socialLinkCards,
	lastTrack,
}: PortfolioGridProps) {
	const [section, setSection] = useQueryState('section', portfolioSectionParser);
	const shouldReduceMotion = useReducedMotion();
	const [isGridEntering, setIsGridEntering] = useState(true);
	const [savedLayouts, setSavedLayouts] = useState<
		Partial<Record<string, Partial<SectionLayouts>>>
	>({});
	const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
	const currentBreakpoint: GridBreakpoint = width >= 996 ? 'lg' : width >= 768 ? 'md' : 'sm';

	const cards = useMemo<PortfolioGridCard[]>(
		() => [
			{
				id: 'info',
				variant: 'about',
				homeSlot: 'a',
				sizeSlot: 'a',
				content: (
					<InfoGridItemContent
						infoAboutMe={
							infoAboutMe ?? { isEmployed: null, resumeUrl: '', statusMessage: null }
						}
					/>
				),
			},
			{
				id: 'map',
				variant: 'about',
				homeSlot: 'b',
				sizeSlot: 'b',
				cardClassName: 'group/map',
				content: <MapGridItemContent />,
			},
			{
				id: 'music',
				variant: 'about',
				homeSlot: 'd',
				sizeSlot: 'd',
				cardClassName: 'group/music @container/music-card @container-[size] isolate',
				content: <LastTrackGridItemContent track={lastTrack} />,
			},
			{
				id: 'hobbies',
				variant: 'about',
				homeSlot: 'j',
				sizeSlot: 'j',
				cardClassName: 'group/hobby @container/hobby-card @container-[size] isolate',
				content: <HobbiesGridItemContent />,
			},
			{
				id: 'theme',
				variant: 'about',
				homeSlot: 'i',
				sizeSlot: 'i',
				content: <BB8ThemeSwitcher />,
			},
			{
				id: 'experience-overview',
				variant: 'experience',
				homeSlot: 'g',
				sizeSlot: 'g',
				content: experienceOverviewCard,
			},
			...createCollectionCards({
				projects: projectCards,
				experiences: experienceCards,
				socialLinks: socialLinkCards,
			}),
		],
		[
			infoAboutMe,
			projectCards,
			experienceCards,
			experienceOverviewCard,
			socialLinkCards,
			lastTrack,
		],
	);

	const { displayedSection, exitingIds, generation, completeExit } = usePortfolioTransition(
		cards,
		section,
		Boolean(shouldReduceMotion),
	);
	const displayedKey = displayedSection ?? 'All';
	const gridLayouts = useMemo(
		() => ({ ...createSectionLayouts(cards, displayedSection), ...savedLayouts[displayedKey] }),
		[cards, displayedSection, displayedKey, savedLayouts],
	);
	const visibleCards = getSectionCards(cards, displayedSection, currentBreakpoint);
	const positions = new Map(gridLayouts[currentBreakpoint].map((item) => [item.i, item]));
	const orderedCards = visibleCards.toSorted((a, b) => {
		const first = positions.get(a.id)!;
		const second = positions.get(b.id)!;
		return first.y - second.y || first.x - second.x;
	});
	const exitingIdSet = new Set(exitingIds);
	const isChangingSection = exitingIdSet.size > 0;
	const matchingCount = cards.filter((card) => matchesSection(card, section)).length;

	function handleDragStop(layout: Layout) {
		if (isChangingSection) return;
		setSavedLayouts((previous) => ({
			...previous,
			[displayedKey]: {
				...previous[displayedKey],
				[currentBreakpoint]: layout.map((item) => ({ ...item })),
			},
		}));
	}

	const gridEntranceInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32 };
	const gridEntranceAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
	const gridEntranceTransition = {
		duration: shouldReduceMotion ? 0.12 : 0.36,
		ease: 'easeOut' as const,
	};

	return (
		<LazyMotion features={domAnimation}>
			<PortfolioNavigation section={section} onSectionChange={setSection} />
			<p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
				{section ? `${section}: ${matchingCount} cards` : 'All portfolio highlights'}
			</p>
			<div
				ref={containerRef}
				className="mx-auto px-[3.5vw] pb-48"
				style={{ maxWidth: GRID_MAX_WIDTH_PX }}
			>
				{section && matchingCount === 0 ? (
					<p className="mb-6 text-center text-muted-foreground">
						No {section.toLowerCase()} to show yet.
					</p>
				) : null}
				{mounted && (
					<m.div
						data-portfolio-grid
						initial={gridEntranceInitial}
						animate={gridEntranceAnimate}
						transition={gridEntranceTransition}
						onAnimationComplete={() => setIsGridEntering(false)}
					>
						<GridLayout
							className={cn(isGridEntering && 'portfolio-grid-entering')}
							layout={gridLayouts[currentBreakpoint]}
							width={width}
							gridConfig={{
								cols: GRID_COLUMNS_BY_BREAKPOINT[currentBreakpoint],
								rowHeight: GRID_ROW_HEIGHT_PX,
								margin: GRID_ITEM_MARGIN,
								containerPadding: [0, 0],
							}}
							compactor={displayedSection ? noCompactor : verticalCompactor}
							resizeConfig={{ enabled: false, handles: [] }}
							dragConfig={{
								enabled: currentBreakpoint === 'lg' && !isChangingSection,
								bounded: true,
								threshold: 3,
								cancel: DRAG_CANCEL_SELECTORS,
							}}
							onDragStop={handleDragStop}
						>
							{orderedCards.map((card) => {
								const isExiting = exitingIdSet.has(card.id);
								return (
									<div
										key={card.id}
										data-portfolio-card={card.id}
										data-category={card.variant}
										data-muted={!matchesSection(card, section)}
										data-exiting={isExiting}
										className="focus-within:z-20 hover:z-20"
										inert={isExiting || undefined}
									>
										<m.div
											className="size-full"
											initial={
												isGridEntering || shouldReduceMotion
													? false
													: { opacity: 0, y: 12 }
											}
											animate={isExiting ? 'exit' : 'visible'}
											variants={{
												exit: { opacity: 0, y: 0 },
												visible: { opacity: 1, y: 0 },
											}}
											transition={{
												duration: shouldReduceMotion
													? 0
													: isExiting
														? 0.16
														: 0.24,
												ease: 'easeOut',
											}}
											onAnimationComplete={(definition) => {
												if (definition === 'exit')
													completeExit(card.id, generation);
											}}
										>
											<GridItem
												variant={card.variant}
												cardClassName={card.cardClassName}
												data-portfolio-surface
												className="size-full"
											>
												{card.content}
											</GridItem>
										</m.div>
									</div>
								);
							})}
						</GridLayout>
					</m.div>
				)}
			</div>
		</LazyMotion>
	);
}

'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Responsive, useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useState, type ReactNode } from 'react';
import { Map, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip } from '@/components/ui/map';
import {
	ArroyomolinosMarkerPin,
	ArroyomolinosPopup,
	ArroyomolinosTooltip,
} from '@/components/public/map-marker-content';
import { GridItem } from '@/components/public/grid-item';
import { InfoGridItemContent } from '@/components/public/info-grid-item-content';
import { PORTFOLIO_SECTIONS, type PortfolioSection } from '@/components/public/portfolio-sections';
import { ModeToggle } from '@/components/theme-toggler';
import { type Settings } from '@/lib/types';

export type InformationAboutMe = Omit<Settings, 'id' | 'updatedAt'>;

interface PortfolioGridProps {
	infoAboutMe: InformationAboutMe | undefined;
	projectCards: ReactNode[];
}

export function PortfolioGrid({ infoAboutMe, projectCards }: PortfolioGridProps) {
	const [section, setSection] = useQueryState(
		'section',
		parseAsStringLiteral(PORTFOLIO_SECTIONS),
	);

	const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
	const [canMapMarkerJiggle, setCanMapMarkerJiggle] = useState(false);

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
		layouts?: { lg: Layout; md: Layout };
		GridItems?: ReactNode;
	}[] = [
		{
			url: 'All',
			v: null,
			layouts: {
				lg: [
					{ i: 'a', x: 0, y: 0, w: 4, h: 6 },
					{ i: 'b', x: 4, y: 0, w: 2, h: 6 },
					{ i: 'c', x: 6, y: 0, w: 2, h: 14 },
					{ i: 'd', x: 0, y: 1, w: 2, h: 14 },
					{ i: 'e', x: 2, y: 1, w: 4, h: 14 },
				],
				md: [
					{ i: 'a', x: 0, y: 0, w: 2, h: 8 },
					{ i: 'b', x: 1, y: 1, w: 3, h: 2 },
					{ i: 'c', x: 2, y: 2, w: 1, h: 1 },
				],
			},
			GridItems: [],
		},
		{
			url: 'About me',
			v: 'About me',
			layouts: {
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
	const gridLayouts = resolvedSection.layouts;

	const { width, containerRef, mounted } = useContainerWidth({
		measureBeforeMount: true,
	});

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

			<div ref={containerRef} className="mx-auto max-w-[1200px] px-[3.5vw]">
				{mounted && (
					<Responsive
						layouts={gridLayouts}
						width={width}
						breakpoints={{ lg: 996, md: 768, sm: 0 }}
						cols={{ lg: 8, md: 4, sm: 1 }}
						rowHeight={30}
						margin={[16, 16]}
						containerPadding={[0, 0]}
						resizeConfig={{ enabled: false }}
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
							<Map center={[-3.916, 40.27]} zoom={13} attributionControl={false}>
								<MapMarker key={'map-marker'} longitude={-3.916} latitude={40.27}>
									<MarkerContent>
										<ArroyomolinosMarkerPin
											shouldJiggle={canMapMarkerJiggle && !isMapPopupOpen}
										/>
									</MarkerContent>
									<MarkerTooltip>
										<ArroyomolinosTooltip />
									</MarkerTooltip>
									<MarkerPopup
										closeButton
										closeButtonClassName="top-2.5 right-3 rounded-full bg-background/80 p-0.5 opacity-100 shadow-sm backdrop-blur-sm hover:bg-background"
										focusAfterOpen={false}
										anchor="center"
										offset={4}
										className="rounded-4xl border-0 p-0"
										onOpen={handleMapPopupOpen}
										onClose={handleMapPopupClose}
									>
										<ArroyomolinosPopup />
									</MarkerPopup>
								</MapMarker>
							</Map>
						</GridItem>
						<GridItem variant="project" key="c">
							{projectCards[0]}
						</GridItem>
						<GridItem variant="project" key="d">
							{projectCards[1]}
						</GridItem>
						<GridItem variant="project" key="e">
							{projectCards[2]}
						</GridItem>
					</Responsive>
				)}
			</div>
		</>
	);
}

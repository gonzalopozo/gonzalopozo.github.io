'use client';

import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Responsive, useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { Map, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip } from '@/components/ui/map';
import { GridItem } from '@/components/public/grid-item';
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
						<GridItem
							variant="about"
							className="flex flex-col items-start gap-2"
							key="a"
						>
							<figure className="shrink-0">
								<Image
									src="/cv_pic.png"
									width={70}
									height={120}
									alt="Picture of Gonzalo"
									className="h-auto max-w-full object-contain"
								/>
							</figure>
							<div>
								<h3 className="text-primary">Gonzalo</h3>
								<p className="text-muted-foreground">
									{infoAboutMe!.statusMessage || 'Status message'}
								</p>
								<p className="text-muted-foreground">
									{infoAboutMe!.isEmployed ? 'Con trabajo' : 'Sin trabajo'}
								</p>
								<p className="text-muted-foreground">
									{infoAboutMe!.resumeUrl ? (
										<a
											href={infoAboutMe!.resumeUrl}
											target="_blank"
											rel="noreferrer"
										>
											CV
										</a>
									) : (
										'Link CV'
									)}
								</p>
							</div>
						</GridItem>
						<GridItem variant="map" key="b">
							<Map center={[-3.916, 40.2728]} zoom={13} attributionControl={false}>
								<MapMarker key={'map-marker'} longitude={-3.916} latitude={40.2728}>
									<MarkerContent>
										<div className="size-6 rounded-lg bg-green-500" />
									</MarkerContent>
									<MarkerTooltip>Arroyomolinos</MarkerTooltip>
									<MarkerPopup>
										<div className="space-y-1">
											<p className="text-foreground font-medium">
												Arroyomolinos
											</p>
											<p className="text-muted-foreground text-xs">
												Info de Arroyo
											</p>
										</div>
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

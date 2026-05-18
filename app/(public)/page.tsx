import { Suspense } from 'react';
import { PortfolioGrid } from '@/components/public/portfolio-grid';
import { ProjectGridItemContent } from '@/components/public/project-grid-item-content';
import { getPublicInfoAboutMe } from '@/lib/queries/about-me';
import { getPublicProjects } from '@/lib/queries/projects';
import { getTrack } from '@/lib/queries/last-fm';

function PortfolioGridFallback() {
	const cells = [
		'lg:col-span-2 lg:row-span-1 md:col-span-4',
		'lg:col-span-1 lg:row-span-1 md:col-span-2',
		'lg:col-span-1 lg:row-span-2 md:col-span-2 md:row-span-2',
		'lg:col-span-1 lg:row-span-1 md:col-span-2',
		'lg:col-span-1 lg:row-span-1 md:col-span-2',
		'lg:col-span-1 lg:row-span-2 md:col-span-2 md:row-span-2',
		'lg:col-span-2 lg:row-span-1 md:col-span-4',
		'lg:col-span-1 lg:row-span-1 md:col-span-2',
	];

	return (
		<>
			<span className="sr-only" role="status">
				Loading portfolio
			</span>
			<div aria-hidden="true">
				<nav className="mb-12 flex justify-center px-[3.5vw] pt-12">
					<div className="flex h-10 w-[min(28rem,calc(100vw-1rem))] items-center gap-1 rounded-full border border-border/70 bg-card/90 px-1 py-0.5 shadow-2xl shadow-foreground/10 backdrop-blur-xl">
						<div className="h-8 w-32 rounded-full bg-primary/25 motion-safe:animate-pulse" />
						<div className="size-8 rounded-full bg-secondary motion-safe:animate-pulse" />
						<div className="size-8 rounded-full bg-secondary motion-safe:animate-pulse" />
						<div className="size-8 rounded-full bg-secondary motion-safe:animate-pulse" />
					</div>
				</nav>
				<div className="mx-auto px-[3.5vw]" style={{ maxWidth: 1308.6 }}>
					<div className="grid auto-rows-[223px] grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-4">
						{cells.map((className, index) => (
							<div
								key={index}
								className={`
          min-h-0 rounded-4xl border border-border/70 bg-card
          motion-safe:animate-pulse
          ${className}
        `}
							/>
						))}
					</div>
				</div>
			</div>
		</>
	);
}

export default async function PublicPage() {
	const [projects, aboutMe, track] = await Promise.all([
		getPublicProjects(),
		getPublicInfoAboutMe(),
		getTrack(),
	]);

	const projectCards = projects
		.slice(0, 3)
		.map((project, index) => (
			<ProjectGridItemContent
				key={project.id}
				project={project}
				variant={index === 2 ? 'horizontal' : 'vertical'}
			/>
		));

	return (
		<Suspense fallback={<PortfolioGridFallback />}>
			<PortfolioGrid infoAboutMe={aboutMe} projectCards={projectCards} lastTrack={track} />
		</Suspense>
	);
}

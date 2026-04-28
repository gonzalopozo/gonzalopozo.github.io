import { PortfolioGrid } from '@/components/public/portfolio-grid';
import { ProjectGridItemContent } from '@/components/public/project-grid-item-content';
import { getInfoAboutMe } from '@/lib/queries/about-me';
import { getProjects } from '@/lib/queries/projects';
import type { ProjectCardLayout } from '@/components/public/project-grid-item-content';

function renderProjectVariants(project: import('@/lib/types').ProjectInfo) {
	const variants: Record<ProjectCardLayout, React.ReactNode> = {
		default: <ProjectGridItemContent project={project} layout="default" />,
		'vertical-tall': <ProjectGridItemContent project={project} layout="vertical-tall" />,
	};
	return variants;
}

export default async function PublicPage() {
	const [projects, aboutMe] = await Promise.all([getProjects(), getInfoAboutMe()]);

	const projectCards = projects.slice(0, 3).map((project) => renderProjectVariants(project));

	return <PortfolioGrid infoAboutMe={aboutMe} projectCards={projectCards} />;
}

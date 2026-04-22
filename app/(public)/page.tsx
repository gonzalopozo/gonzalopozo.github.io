import { PortfolioGrid } from '@/components/public/portfolio-grid';
import { ProjectGridItemContent } from '@/components/public/project-grid-item-content';
import { getInfoAboutMe } from '@/lib/queries/about-me';
import { getProjects } from '@/lib/queries/projects';

export default async function PublicPage() {
	const [projects, aboutMe] = await Promise.all([getProjects(), getInfoAboutMe()]);

	const projectCards = {
		featured: projects[0] ? (
			<ProjectGridItemContent
				key={projects[0].id}
				project={projects[0]}
				orientation="horizontal"
			/>
		) : null,
		supporting: projects.slice(1, 3).map((project) => (
			<ProjectGridItemContent
				key={project.id}
				project={project}
				orientation="vertical"
			/>
		)),
	};

	return <PortfolioGrid infoAboutMe={aboutMe} projectCards={projectCards} />;
}

import { PortfolioGrid } from '@/components/public/portfolio-grid';
import { ProjectGridItemContent } from '@/components/public/project-grid-item-content';
import { getPublicInfoAboutMe } from '@/lib/queries/about-me';
import { getPublicProjects } from '@/lib/queries/projects';
import { getTrack } from '@/lib/queries/last-fm';

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

	return <PortfolioGrid infoAboutMe={aboutMe} projectCards={projectCards} lastTrack={track} />;
}

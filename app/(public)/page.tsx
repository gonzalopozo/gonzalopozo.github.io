import { PortfolioGrid } from "@/components/public/portfolio-grid";
import { ProjectGridItemContent } from "@/components/public/project-grid-item-content";
import { getProjects } from "@/lib/queries/projects";

export default async function PublicPage() {
    const projects = await getProjects();
    const projectCards = projects.map((project) => (
        <ProjectGridItemContent key={project.id} project={project} />
    ))

    return (
        <>
            <PortfolioGrid projectCards={projectCards} />
        </>
    )
}
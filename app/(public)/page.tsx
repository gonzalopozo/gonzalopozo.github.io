import { PortfolioGrid } from "@/components/public/portfolio-grid";
import { getProjects } from "@/lib/queries/projects";

export default async function PublicPage() {
    const projects = await getProjects();

    console.log(projects)

    return (
        <>
            <PortfolioGrid projects={projects} />
        </>
    )
}
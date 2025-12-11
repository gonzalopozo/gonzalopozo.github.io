import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { projects } from "@/db/schema/portfolio";
import { LifeBuoyIcon } from "lucide-react";
import Link from "next/link";

export default async function ProjectsDashboardPage() {
    const projectsData = await db.select().from(projects);

    console.log(projectsData);

    return (
        <>
            <Button variant={"link"}>
                <Link href={'/dashboard/projects/new'} className="gap-1.5 flex" >
                    <LifeBuoyIcon />
                    ¡Crear nuevo proyecto!
                </Link>
            </Button>

            <div>
                {projectsData.length === 0 ? (
                    <p>No hay proyectos</p>
                ) : (
                    <>
                        {projectsData.map(project => (
                            <ul key={project.id}>
                                <li>{project.title}</li>
                                <li>{project.description}</li>
                                <li>{project.url}</li>
                                <li>{project.repoUrl}</li>
                                <li>{project.status}</li>
                                <li>{project.order}</li>
                                <li>{project.createdAt.toISOString()}</li>
                                <li>{project.updatedAt.toISOString()}</li>
                                <Button variant={"link"}>
                                    <Link href={`/dashboard/projects/${project.id}/edit`}>
                                        ¡Editar proyecto!
                                    </Link>
                                </Button>
                                <Button variant={"destructive"} onClick={() => console.log("Borrar proyecto")}>
                                    ¡Borrar proyecto!
                                </Button>
                            </ul>
                        ))}
                    </>
                )}
            </div>
        </>
    )

} 
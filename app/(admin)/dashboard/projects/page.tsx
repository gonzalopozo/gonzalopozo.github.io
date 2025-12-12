import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { LifeBuoyIcon } from "lucide-react";
import Link from "next/link";

interface Skill {
    name: string;
    id: number;
}
interface ProjectInfo {
    id: number;
    title: string;
    description: string;
    url: string | null;
    repoUrl: string | null;
    status: "active" | "archived" | "in-progress";
    order: number;
    createdAt: Date;
    updatedAt: Date;
    projectSkills: { skill: Skill }[];
}

export default async function ProjectsDashboardPage() {
    const projectsData: ProjectInfo[] = await db.query.projects.findMany({
        with: {
            projectSkills: {
                columns: {},
                with: {
                    skill: {
                        columns: {
                            id: true,
                            name: true
                        },
                    }
                }
            }
        }
    })

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
                                <h4>Skills:</h4>
                                <ul>
                                    {project.projectSkills.map(({ skill }) => (
                                        <li key={`${project.id} - ${skill.id}`}>{skill.name}</li>
                                    ))}
                                </ul>
                                <Button variant={"link"}>
                                    <Link href={`/dashboard/projects/${project.id}/edit`}>
                                        ¡Editar proyecto!
                                    </Link>
                                </Button>
                                <Button variant={"destructive"} >
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
import "server-only"
import { db } from "@/db";
import { ProjectInfo } from "@/lib/types";

export async function getProjects(): Promise<ProjectInfo[]> {
    return await db.query.projects.findMany({
        with: {
            projectSkills: {
                columns: {},
                with: {
                    skill: {
                        columns: {
                            id: true,
                            name: true,
                            icon: true
                        },
                    }
                }
            }
        },
        orderBy: ( projects, { asc }) => [asc(projects.order)]
    });
}

export async function getProjectById(id: number): Promise<ProjectInfo | undefined> {
    return await db.query.projects.findFirst({
        where: (projects, { eq } ) => (eq(projects.id, id)),
        with: {
            projectSkills: {
                columns: {},
                with: {
                    skill: {
                        columns: {
                            id: true,
                            name: true,
                            icon: true
                        },
                    }
                }
            }
        },
        orderBy: ( projects, { asc }) => [asc(projects.order)]
    });
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectsTable } from "@/components/admin/projects-table";
import { db } from "@/db";
import { deleteProject } from "@/lib/actions/projects";
import { ProjectInfo } from "@/lib/types";
import { Plus, FolderKanban } from "lucide-react";
import Link from "next/link";

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
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus proyectos del portfolio
                    </p>
                </div>
                <Button asChild size="lg" className="gap-2">
                    <Link href="/dashboard/projects/new">
                        <Plus className="size-4" />
                        Nuevo Proyecto
                    </Link>
                </Button>
            </div>

            {/* Content */}
            {projectsData.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <FolderKanban className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay proyectos todavía</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-6">
                            Comienza añadiendo tus primeros proyectos para mostrarlos en tu portfolio.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/projects/new">
                                Crear primer proyecto
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Todos los Proyectos</CardTitle>
                        <CardDescription>
                            {projectsData.length} {projectsData.length === 1 ? 'proyecto registrado' : 'proyectos registrados'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProjectsTable projects={projectsData} onDelete={deleteProject} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 
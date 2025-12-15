import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { deleteProject } from "@/lib/actions/projects";
import { ProjectInfo } from "@/lib/types";
import { Plus, Pencil, ExternalLink, Trash, FolderKanban, Github } from "lucide-react";
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

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
            active: "default",
            "in-progress": "secondary",
            archived: "outline",
        };
        return variants[status] || "secondary";
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            active: "Activo",
            "in-progress": "En progreso",
            archived: "Archivado",
        };
        return labels[status] || status;
    };

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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Orden</TableHead>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="max-w-[200px]">Descripción</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Skills</TableHead>
                                    <TableHead>Enlaces</TableHead>
                                    <TableHead>Actualizado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projectsData.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {project.order}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {project.title}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="truncate text-sm text-muted-foreground">
                                                {project.description || '—'}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(project.status)}>
                                                {getStatusLabel(project.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                {project.projectSkills.length > 0 ? (
                                                    project.projectSkills.slice(0, 3).map(({ skill }) => (
                                                        <Badge key={skill.id} variant="secondary" className="text-xs">
                                                            {skill.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                )}
                                                {project.projectSkills.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{project.projectSkills.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {project.url && (
                                                    <a
                                                        href={project.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-primary hover:text-primary/80"
                                                        title="Ver proyecto"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                )}
                                                {project.repoUrl && (
                                                    <a
                                                        href={project.repoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center text-muted-foreground hover:text-foreground"
                                                        title="Ver repositorio"
                                                    >
                                                        <Github className="size-4" />
                                                    </a>
                                                )}
                                                {!project.url && !project.repoUrl && (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(project.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link
                                                        href={`/dashboard/projects/${project.id}/edit`}
                                                        className="gap-1.5"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Editar
                                                    </Link>
                                                </Button>
                                                <Button onClick={deleteProject.bind(null, project.id)} variant="destructive" size="sm" className="gap-1.5">
                                                    <Trash className="size-3.5" />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 
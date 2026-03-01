"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProjectInfo } from "@/lib/types";
import { Pencil, ExternalLink, Trash, Github } from "lucide-react";
import Link from "next/link";
// import { SortableRow } from "@/components/admin/sortable-row";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useDroppable, DragDropProvider } from '@dnd-kit/react';
import { isSortable, useSortable } from '@dnd-kit/react/sortable';
import { RxDragHandleDots2 } from "react-icons/rx";
import { updateProjectOrder } from "@/lib/actions/projects";
import { toast } from "sonner";

function SortableRow({ children, id, index }: { children: ReactNode; id: number, index: number }) {
    const [element, setElement] = useState<Element | null>(null);
    const handleRef = useRef<HTMLButtonElement | null>(null);
    useSortable({ id, index, element, handle: handleRef });

    return (
        <TableRow ref={setElement}>
            <TableCell>
                <Button ref={handleRef} variant={"secondary"}>
                    <RxDragHandleDots2 />
                </Button>
            </TableCell>

            {children}
        </TableRow>
    )
}


interface ProjectsTableProps {
    projects: ProjectInfo[];
    onDelete: (id: number) => void;
}

function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
        active: "default",
        "in-progress": "secondary",
        archived: "outline",
    };
    return variants[status] || "secondary";
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        active: "Activo",
        "in-progress": "En progreso",
        archived: "Archivado",
    };
    return labels[status] || status;
}

export function ProjectsTable({ projects: serverProjects, onDelete }: ProjectsTableProps) {
    const [projects, setProjects] = useState(serverProjects);
    const { ref } = useDroppable({ id: 'droppable' });

    useEffect(() => {
        setProjects(serverProjects);
    }, [serverProjects]);

    return (
        <DragDropProvider
            onDragEnd={async ({ operation }) => {
                const { source } = operation;
                if (isSortable(source)) {
                    const projectId = source.id as number;
                    const newOrder = source.index + 1;

                    setProjects(prev => {
                        const oldIndex = prev.findIndex(p => p.id === projectId);
                        if (oldIndex === -1) return prev;
                        const reordered = [...prev];
                        const [moved] = reordered.splice(oldIndex, 1);
                        reordered.splice(source.index, 0, moved);
                        return reordered.map((p, i) => ({ ...p, order: i + 1 }));
                    });

                    try {
                        const projectName = await updateProjectOrder(projectId, newOrder);
                        if (projectName) toast.success(`Proyecto "${projectName}" actualizado a la posición ${newOrder}`);
                    } catch {
                        toast.error("Error al actualizar el orden");
                        setProjects(serverProjects);
                    }
                }
            }}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-8"></TableHead>
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
                <TableBody ref={ref}>
                    {projects.map((project, index) => (
                        <SortableRow key={project.id} id={project.id} index={index}>
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
                                    {project.description || "—"}
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
                                    <Button
                                        onClick={() => onDelete(project.id)}
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        <Trash className="size-3.5" />
                                        Eliminar
                                    </Button>
                                </div>
                            </TableCell>
                        </SortableRow>))}
                </TableBody>
            </Table>
        </DragDropProvider>
    );
}

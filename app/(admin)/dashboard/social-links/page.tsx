import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { socialLinks } from "@/db/schema/portfolio";
import { deleteSocialLink } from "@/lib/actions/social-links";
import { Plus, Pencil, ExternalLink, Trash, Link2 } from "lucide-react";
import Link from "next/link";

export default async function SocialLinksDashboardPage() {
    const socialLinksData = await db.select().from(socialLinks);

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Links</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus enlaces a redes sociales
                    </p>
                </div>
                <Button asChild size="lg" className="gap-2">
                    <Link href="/dashboard/social-links/new">
                        <Plus className="size-4" />
                        Nuevo Enlace
                    </Link>
                </Button>
            </div>

            {/* Content */}
            {socialLinksData.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Link2 className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay enlaces sociales todavía</h3>
                        <p className="text-muted-foreground text-center max-w-sm mb-6">
                            Comienza añadiendo tus perfiles de redes sociales para mostrarlos en tu portfolio.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/social-links/new">
                                Crear primer enlace
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Todos los Enlaces</CardTitle>
                        <CardDescription>
                            {socialLinksData.length} {socialLinksData.length === 1 ? 'enlace registrado' : 'enlaces registrados'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Orden</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>URL</TableHead>
                                    <TableHead>Icono</TableHead>
                                    <TableHead>Creado</TableHead>
                                    <TableHead>Actualizado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {socialLinksData.map((socialLink) => (
                                    <TableRow key={socialLink.id}>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono">
                                                {socialLink.order}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {socialLink.name}
                                        </TableCell>
                                        <TableCell>
                                            {socialLink.url ? (
                                                <a
                                                    href={socialLink.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline max-w-[200px] truncate"
                                                >
                                                    {socialLink.url}
                                                    <ExternalLink className="size-3 shrink-0" />
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {socialLink.icon || '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(socialLink.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(socialLink.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link
                                                        href={`/dashboard/social-links/${socialLink.id}/edit`}
                                                        className="gap-1.5"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        Editar
                                                    </Link>
                                                </Button>
                                                <form action={deleteSocialLink.bind(null, socialLink.id)}>
                                                    <Button variant="destructive" size="sm" type="submit" className="gap-1.5">
                                                        <Trash className="size-3.5" />
                                                        Eliminar
                                                    </Button>
                                                </form>
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
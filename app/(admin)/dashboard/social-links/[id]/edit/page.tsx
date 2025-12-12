import { db } from "@/db"
import { socialLinks } from "@/db/schema/portfolio"
import { updateSocialLink } from "@/lib/actions/social-links";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function UpdateSocialLinkDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const socialLink = await db.select().from(socialLinks).where(eq(socialLinks.id, Number(id)))
    const socialLinkResult = socialLink[0];
    if (!socialLinkResult) return (<p>Enlace social no encontrado</p>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/social-links">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Editar Enlace Social</h1>
                    <p className="text-muted-foreground mt-1">
                        Modifica los datos de <span className="font-medium text-foreground">{socialLinkResult.name}</span>
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Información del enlace</CardTitle>
                    <CardDescription>
                        Actualiza los campos que necesites modificar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={updateSocialLink.bind(null, Number(id))} className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Ej: GitHub, LinkedIn, Twitter..."
                                defaultValue={socialLinkResult.name}
                                required
                            />
                        </div>

                        {/* URL Field */}
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                type="url"
                                name="url"
                                id="url"
                                placeholder="https://..."
                                defaultValue={socialLinkResult.url || ""}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enlace a tu perfil en la red social
                            </p>
                        </div>

                        {/* Icon Field */}
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icono</Label>
                            <Input
                                type="text"
                                name="icon"
                                id="icon"
                                placeholder="Ej: github, linkedin, twitter..."
                                defaultValue={socialLinkResult.icon || ""}
                            />
                            <p className="text-xs text-muted-foreground">
                                Nombre del icono para mostrar (opcional)
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit" className="gap-2">
                                <Save className="size-4" />
                                Guardar cambios
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/social-links">
                                    Cancelar
                                </Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
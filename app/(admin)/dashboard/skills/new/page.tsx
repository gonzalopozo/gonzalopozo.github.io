import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSkill } from "@/lib/actions/skills";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

export default async function NewSkillDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/skills">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nueva Habilidad</h1>
                    <p className="text-muted-foreground mt-1">
                        Añade una nueva habilidad o tecnología a tu portfolio
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Información de la habilidad</CardTitle>
                    <CardDescription>
                        Completa los datos de la nueva habilidad
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createSkill} className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Ej: TypeScript, React, PostgreSQL..."
                                required
                            />
                        </div>

                        {/* Type Field */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Categoría</Label>
                            <select
                                name="type"
                                id="type"
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] dark:bg-input/30"
                                required
                            >
                                <option value="fullstack">Full Stack</option>
                                <option value="frontend">Frontend</option>
                                <option value="backend">Backend</option>
                                <option value="database">Base de datos</option>
                                <option value="devops">DevOps</option>
                                <option value="practices">Buenas prácticas</option>
                                <option value="tools">Herramientas</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        {/* Icon Field */}
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icono</Label>
                            <Input
                                type="text"
                                name="icon"
                                id="icon"
                                placeholder="Ej: typescript, react, github..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Identificador del icono a mostrar (opcional)
                            </p>
                        </div>

                        {/* URL Field */}
                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                type="url"
                                name="url"
                                id="url"
                                placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Enlace a documentación o recurso oficial (opcional)
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit" className="gap-2">
                                <Plus className="size-4" />
                                Crear habilidad
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/skills">
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

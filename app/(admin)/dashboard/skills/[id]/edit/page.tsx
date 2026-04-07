import { db } from "@/db";
import { skills } from "@/db/schema/portfolio";
import { updateSkill } from "@/lib/actions/skills";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import dynamic from "next/dynamic";
import { IconPickerSkeleton } from "@/components/admin/icon-picker";
import { notFound } from "next/navigation";

const IconPicker = dynamic(
    () =>
        import("@/components/admin/icon-picker").then((mod) => mod.IconPicker),
    {
        loading: () => <IconPickerSkeleton />,
    },
);

export default async function UpdateSkillDashboardPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const id = params.id;

    const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.id, Number(id)));

    if (!skill) notFound();

    const updateSkillWithId = updateSkill.bind(null, Number(id));

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/skills" aria-label="Back to skills">
                        <ArrowLeft aria-hidden="true" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-pretty">
                        Editar Habilidad
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Modifica los datos de{" "}
                        <span className="font-medium text-foreground">
                            {skill.name}
                        </span>
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Información de la habilidad</CardTitle>
                    <CardDescription>
                        Actualiza los campos que necesites modificar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        action={updateSkillWithId}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Ej: React, TypeScript, Node.js…"
                                defaultValue={skill.name}
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="type">Categoría</Label>
                            <select
                                name="type"
                                id="type"
                                defaultValue={skill.type}
                                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] dark:bg-input/30"
                            >
                                <option value="fullstack">Full Stack</option>
                                <option value="frontend">Frontend</option>
                                <option value="backend">Backend</option>
                                <option value="database">
                                    Base de datos
                                </option>
                                <option value="devops">DevOps</option>
                                <option value="practices">
                                    Buenas prácticas
                                </option>
                                <option value="tools">Herramientas</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="icon">Icono</Label>
                            <IconPicker fullName={skill.icon ?? undefined} />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                type="url"
                                name="url"
                                id="url"
                                placeholder="https://…"
                                defaultValue={skill.url || ""}
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enlace a la documentación oficial o sitio web
                                (opcional)
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit">
                                <Save data-icon="inline-start" />
                                Guardar cambios
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/skills">Cancelar</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

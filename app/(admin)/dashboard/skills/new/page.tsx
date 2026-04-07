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
import { createSkill } from "@/lib/actions/skills";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { IconPickerSkeleton } from "@/components/admin/icon-picker";

const IconPicker = dynamic(
    () =>
        import("@/components/admin/icon-picker").then((mod) => mod.IconPicker),
    {
        loading: () => <IconPickerSkeleton />,
    },
);

export default async function NewSkillDashboardPage() {
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
                        Nueva Habilidad
                    </h1>
                    <p className="mt-1 text-muted-foreground">
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
                    <form
                        action={createSkill}
                        className="flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                placeholder="Ej: TypeScript, React, PostgreSQL…"
                                required
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
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
                            <IconPicker />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                type="url"
                                name="url"
                                id="url"
                                placeholder="https://…"
                                autoComplete="off"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enlace a documentación o recurso oficial
                                (opcional)
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit">
                                <Plus data-icon="inline-start" />
                                Crear habilidad
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

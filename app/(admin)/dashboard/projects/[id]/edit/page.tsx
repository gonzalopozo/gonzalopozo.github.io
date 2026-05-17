import { SkillsMultiSelect } from '@/components/skills-multi-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/db';
import { projects, skills } from '@/db/schema/portfolio';
import { updateProject } from '@/lib/actions/projects';
import { type ProjectInfo } from '@/lib/types';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

export default async function UpdateProjectDashboardPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const id = Number(params.id);

	const project: ProjectInfo | undefined = await db.query.projects.findFirst({
		where: eq(projects.id, id),
		with: {
			projectSkills: {
				columns: {},
				with: {
					skill: {
						columns: {
							id: true,
							name: true,
							icon: true,
						},
					},
				},
			},
		},
	});

	if (!project) return <p className="text-muted-foreground">Proyecto no encontrado</p>;

	const projectSkill = project.projectSkills.map(({ skill }) => skill.id);

	const skillsList = await db.select({ id: skills.id, name: skills.name }).from(skills);

	const updateProjectWithId = updateProject.bind(null, id);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard/projects">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Editar Proyecto</h1>
					<p className="text-muted-foreground mt-1">
						Modifica los datos de{' '}
						<span className="text-foreground font-medium">{project.title}</span>
					</p>
				</div>
			</div>

			{/* Form Card */}
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Información del proyecto</CardTitle>
					<CardDescription>Actualiza los campos que necesites modificar</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updateProjectWithId} className="space-y-6">
						{/* Title Field */}
						<div className="space-y-2">
							<Label htmlFor="title">Título</Label>
							<Input
								type="text"
								name="title"
								id="title"
								placeholder="Ej: Mi Portfolio, E-commerce App..."
								defaultValue={project.title}
								required
							/>
						</div>

						{/* Description Field */}
						<div className="space-y-2">
							<Label htmlFor="description">Descripción</Label>
							<Textarea
								name="description"
								id="description"
								placeholder="Describe brevemente el proyecto, sus objetivos y características principales..."
								rows={4}
								defaultValue={project.description}
							/>
						</div>

						{/* URL Field */}
						<div className="space-y-2">
							<Label htmlFor="url">URL del proyecto</Label>
							<Input
								type="url"
								name="url"
								id="url"
								placeholder="https://miproyecto.com"
								defaultValue={project.url ?? ''}
							/>
							<p className="text-muted-foreground text-xs">
								Enlace a la versión desplegada del proyecto (opcional)
							</p>
						</div>

						{/* Repository URL Field */}
						<div className="space-y-2">
							<Label htmlFor="repoUrl">URL del repositorio</Label>
							<Input
								type="url"
								name="repoUrl"
								id="repoUrl"
								placeholder="https://github.com/usuario/proyecto"
								defaultValue={project.repoUrl ?? ''}
							/>
							<p className="text-muted-foreground text-xs">
								Enlace al repositorio en GitHub, GitLab, etc. (opcional)
							</p>
						</div>

						{/* Skills Field */}
						<div className="space-y-2">
							<Label>Tecnologías utilizadas</Label>
							<SkillsMultiSelect
								skills={skillsList}
								defaultValue={projectSkill}
								name="skillIds"
							/>
							<p className="text-muted-foreground text-xs">
								Selecciona las tecnologías y herramientas usadas en el proyecto
							</p>
						</div>

						{/* Status Field */}
						<div className="space-y-2">
							<Label htmlFor="status">Estado</Label>
							<select
								name="status"
								id="status"
								className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
								defaultValue={project.status}
							>
								<option value="in-progress">En progreso</option>
								<option value="active">Activo</option>
								<option value="archived">Archivado</option>
							</select>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-3 pt-4">
							<Button type="submit" className="gap-2">
								<Save className="size-4" />
								Guardar cambios
							</Button>
							<Button type="button" variant="outline" asChild>
								<Link href="/dashboard/projects">Cancelar</Link>
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

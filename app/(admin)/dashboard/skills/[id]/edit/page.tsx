import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { SkillForm } from '@/components/admin/skill-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/db';
import { skills } from '@/db/schema/portfolio';
import { updateSkill } from '@/lib/actions/skills';

export default async function UpdateSkillDashboardPage(props: { params: Promise<{ id: string }> }) {
	const { id } = await props.params;
	const [skill] = await db
		.select()
		.from(skills)
		.where(eq(skills.id, Number(id)));
	if (!skill) notFound();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/dashboard/skills" aria-label="Back to skills">
						<ArrowLeft aria-hidden="true" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-semibold tracking-tight text-pretty">
						Editar Habilidad
					</h1>
					<p className="mt-1 text-muted-foreground">
						Modifica los datos de{' '}
						<span className="font-medium text-foreground">{skill.name}</span>
					</p>
				</div>
			</div>

			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Información de la habilidad</CardTitle>
					<CardDescription>Actualiza los campos que necesites modificar</CardDescription>
				</CardHeader>
				<CardContent>
					<SkillForm action={updateSkill.bind(null, Number(id))} initialValues={skill} />
				</CardContent>
			</Card>
		</div>
	);
}

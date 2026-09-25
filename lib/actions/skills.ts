'use server';

import { db } from '@/db';
import { skills } from '@/db/schema/portfolio';
import { PUBLIC_EXPERIENCES_CACHE_TAG, PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';
import { skillSchema } from '@/lib/schemas/skills';
import { getServerSession } from '@/lib/server-session';
import { eq } from 'drizzle-orm';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export type SkillActionState = { error: string | null };

function parseSkill(formData: FormData) {
	return skillSchema.safeParse({
		name: formData.get('name'),
		type: formData.get('type'),
		icon: formData.get('icon') ?? '',
		url: formData.get('url') ?? '',
		useColor: formData.get('useColor') === 'on',
		customColor: formData.get('customColor'),
	});
}

function updatePublicSkillTags() {
	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	updateTag(PUBLIC_EXPERIENCES_CACHE_TAG);
}

export async function createSkill(
	_previousState: SkillActionState,
	formData: FormData,
): Promise<SkillActionState> {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const parsed = parseSkill(formData);
	if (!parsed.success) return { error: 'Revisa los datos de la habilidad y el color.' };

	try {
		await db.insert(skills).values({
			...parsed.data,
			icon: parsed.data.icon || null,
			url: parsed.data.url || null,
		});
	} catch {
		return { error: 'No se pudo crear la habilidad. Inténtalo de nuevo.' };
	}

	updatePublicSkillTags();
	redirect('/dashboard/skills');
}

export async function updateSkill(
	id: number,
	_previousState: SkillActionState,
	formData: FormData,
): Promise<SkillActionState> {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const parsed = parseSkill(formData);
	if (!parsed.success) return { error: 'Revisa los datos de la habilidad y el color.' };

	try {
		await db
			.update(skills)
			.set({
				...parsed.data,
				icon: parsed.data.icon || null,
				url: parsed.data.url || null,
				customColor: parsed.data.useColor ? parsed.data.customColor : undefined,
			})
			.where(eq(skills.id, id));
	} catch {
		return { error: 'No se pudo guardar la habilidad. Inténtalo de nuevo.' };
	}

	updatePublicSkillTags();
	redirect('/dashboard/skills');
}

export async function deleteSkill(id: number) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	await db.delete(skills).where(eq(skills.id, id));

	updatePublicSkillTags();
	revalidatePath('/dashboard/skills');
}

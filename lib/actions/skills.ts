'use server';

import { db } from '@/db';
import { skills } from '@/db/schema/portfolio';
import { PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';
import { getServerSession } from '@/lib/server-session';
import type { SkillType } from '@/lib/types';
import { eq } from 'drizzle-orm';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSkill(formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const name = formData.get('name') as string;
	const type = formData.get('type') as SkillType;
	const icon = formData.get('icon') ? (formData.get('icon') as string) : undefined;
	const url = formData.get('url') ? (formData.get('url') as string) : undefined;

	await db.insert(skills).values({
		name,
		type,
		icon,
		url,
	});

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	redirect('/dashboard/skills');
}

export async function updateSkill(id: number, formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const name = formData.get('name') as string;
	const type = formData.get('type') as SkillType;
	const icon = formData.get('icon') ? (formData.get('icon') as string) : undefined;
	const url = formData.get('url') ? (formData.get('url') as string) : undefined;

	await db
		.update(skills)
		.set({
			name,
			type,
			icon,
			url,
		})
		.where(eq(skills.id, id));

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	redirect('/dashboard/skills');
}

export async function deleteSkill(id: number) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	await db.delete(skills).where(eq(skills.id, id));

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	revalidatePath('/dashboard/skills');
}

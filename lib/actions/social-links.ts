'use server';

import { db } from '@/db';
import { socialLinks } from '@/db/schema/portfolio';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSocialLink(formData: FormData) {
	const name = formData.get('name') as string;
	const url = formData.get('url') as string;
	const icon = formData.get('icon') ? (formData.get('icon') as string) : undefined;

	const result = await db
		.select({ maxOrder: sql<number>`COALESCE(MAX(${socialLinks.order}), 0)` })
		.from(socialLinks);
	const order = result[0].maxOrder + 1;

	await db.insert(socialLinks).values({
		name,
		url,
		icon,
		order,
	});

	redirect('/dashboard/social-links');
}

export async function updateSocialLink(id: number, formData: FormData) {
	const name = formData.get('name') as string;
	const url = formData.get('url') ? (formData.get('url') as string) : undefined;
	const icon = formData.get('icon') ? (formData.get('icon') as string) : undefined;
	// TODO: el orden? 'order'

	await db
		.update(socialLinks)
		.set({
			name,
			url,
			icon,
		})
		.where(eq(socialLinks.id, id));

	redirect('/dashboard/social-links');
}

export async function deleteSocialLink(id: number) {
	await db.delete(socialLinks).where(eq(socialLinks.id, id));

	revalidatePath('/dashboard/social-links');
}

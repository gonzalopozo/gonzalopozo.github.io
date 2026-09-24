'use server';

import { db } from '@/db';
import { socialLinks } from '@/db/schema/portfolio';
import { getServerSession } from '@/lib/server-session';
import { eq, sql } from 'drizzle-orm';
import { PUBLIC_SOCIAL_LINKS_CACHE_TAG } from '@/lib/cache-tags';
import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { socialLinkSchema } from '@/lib/schemas/social-links';

export type SocialLinkActionState = { error: string | null };

function parseSocialLink(formData: FormData) {
	return socialLinkSchema.safeParse({
		name: formData.get('name'),
		url: formData.get('url'),
		icon: formData.get('icon') ?? '',
		color: formData.get('color'),
	});
}

export async function createSocialLink(
	_previousState: SocialLinkActionState,
	formData: FormData,
): Promise<SocialLinkActionState> {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const parsed = parseSocialLink(formData);
	if (!parsed.success)
		return { error: 'Revisa los datos del enlace y selecciona un color válido.' };

	try {
		const result = await db
			.select({ maxOrder: sql<number>`COALESCE(MAX(${socialLinks.order}), 0)` })
			.from(socialLinks);
		const order = result[0].maxOrder + 1;

		await db.insert(socialLinks).values({
			...parsed.data,
			icon: parsed.data.icon || null,
			order,
		});
	} catch {
		return { error: 'No se pudo crear el enlace. Inténtalo de nuevo.' };
	}

	updateTag(PUBLIC_SOCIAL_LINKS_CACHE_TAG);
	redirect('/dashboard/social-links');
}

export async function updateSocialLink(
	id: number,
	_previousState: SocialLinkActionState,
	formData: FormData,
): Promise<SocialLinkActionState> {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const parsed = parseSocialLink(formData);
	if (!parsed.success)
		return { error: 'Revisa los datos del enlace y selecciona un color válido.' };

	try {
		await db
			.update(socialLinks)
			.set({ ...parsed.data, icon: parsed.data.icon || null })
			.where(eq(socialLinks.id, id));
	} catch {
		return { error: 'No se pudo guardar el enlace. Inténtalo de nuevo.' };
	}

	updateTag(PUBLIC_SOCIAL_LINKS_CACHE_TAG);
	redirect('/dashboard/social-links');
}

export async function deleteSocialLink(id: number) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	await db.delete(socialLinks).where(eq(socialLinks.id, id));

	updateTag(PUBLIC_SOCIAL_LINKS_CACHE_TAG);
	revalidatePath('/dashboard/social-links');
}

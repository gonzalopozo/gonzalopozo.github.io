import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { socialLinks } from '@/db/schema/portfolio';
import { PUBLIC_SOCIAL_LINKS_CACHE_TAG } from '@/lib/cache-tags';
import { type SocialLinkInfo } from '@/lib/types';

export async function getSocialLinks(): Promise<SocialLinkInfo[]> {
	return await db.query.socialLinks.findMany({
		orderBy: (socialLinks, { asc }) => [asc(socialLinks.order), asc(socialLinks.id)],
	});
}

export async function getAllSocialLinks() {
	return await db.select().from(socialLinks);
}

export async function getSocialLinkById(
	id: number,
): Promise<typeof socialLinks.$inferSelect | undefined> {
	const [socialLink] = await db.select().from(socialLinks).where(eq(socialLinks.id, id));
	return socialLink;
}

export async function getPublicSocialLinks() {
	'use cache';
	cacheLife('hours');
	cacheTag(PUBLIC_SOCIAL_LINKS_CACHE_TAG);

	return await db.query.socialLinks.findMany({
		columns: { id: true, name: true, url: true, icon: true, color: true },
		orderBy: (socialLinks, { asc }) => [asc(socialLinks.order), asc(socialLinks.id)],
	});
}

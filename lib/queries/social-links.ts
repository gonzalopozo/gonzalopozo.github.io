import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/db';
import { PUBLIC_SOCIAL_LINKS_CACHE_TAG } from '@/lib/cache-tags';

export async function getPublicSocialLinks() {
	'use cache';
	cacheLife('hours');
	cacheTag(PUBLIC_SOCIAL_LINKS_CACHE_TAG);

	return await db.query.socialLinks.findMany({
		columns: { id: true, name: true, url: true, icon: true },
		orderBy: (socialLinks, { asc }) => [asc(socialLinks.order), asc(socialLinks.id)],
	});
}

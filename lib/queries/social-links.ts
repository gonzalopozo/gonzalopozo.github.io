import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/db';
import { PUBLIC_SOCIAL_LINKS_CACHE_TAG } from '@/lib/cache-tags';
import { type SocialLinkInfo } from '@/lib/types';

export async function getSocialLinks(): Promise<SocialLinkInfo[]> {
	return await db.query.socialLinks.findMany({
		orderBy: (socialLinks, { asc }) => [asc(socialLinks.order), asc(socialLinks.id)],
	});
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

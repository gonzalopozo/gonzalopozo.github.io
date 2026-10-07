import 'server-only';
import { db } from '@/db';
import { type Settings } from '@/lib/types';

export async function getSiteSettings(): Promise<Settings | undefined> {
	return await db.query.siteSettings.findFirst();
}

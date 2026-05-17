'use server';

import { db } from '@/db';
import { employmentHistory, siteSettings } from '@/db/schema/portfolio';
import { PUBLIC_SETTINGS_CACHE_TAG } from '@/lib/cache-tags';
import { eq } from 'drizzle-orm/sql';
import { revalidatePath, updateTag } from 'next/cache';

export async function updateSiteSettings(formData: FormData) {
	const isEmployed = formData.get('isEmployed')
		? (formData.get('isEmployed') as string)
		: undefined;
	const resumeUrl = formData.get('resumeUrl') as string;
	const statusMessage = formData.get('statusMessage')
		? (formData.get('statusMessage') as string)
		: undefined;

	const [existingSettings] = await db.select().from(siteSettings).limit(1);

	if (existingSettings.isEmployed !== Boolean(isEmployed)) {
		await db.insert(employmentHistory).values({
			isEmployed: Boolean(isEmployed),
		});
	}

	await db
		.update(siteSettings)
		.set({
			isEmployed: Boolean(isEmployed),
			resumeUrl,
			statusMessage,
		})
		.where(eq(siteSettings.id, existingSettings.id));

	updateTag(PUBLIC_SETTINGS_CACHE_TAG);
	revalidatePath('/dashboard/settings');
}

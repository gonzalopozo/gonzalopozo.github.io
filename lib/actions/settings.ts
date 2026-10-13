'use server';

import { db } from '@/db';
import { employmentHistory, siteSettings } from '@/db/schema/portfolio';
import { PUBLIC_SETTINGS_CACHE_TAG } from '@/lib/cache-tags';
import { requireAdmin } from '@/lib/admin';
import { eq } from 'drizzle-orm/sql';
import { revalidatePath, updateTag } from 'next/cache';
import { settingsSchema } from '@/lib/schemas/settings';

export async function updateSiteSettings(formData: FormData) {
	await requireAdmin();

	const result = settingsSchema.safeParse({
		isEmployed: formData.get('isEmployed') === 'on',
		resumeUrl: formData.get('resumeUrl') ?? '',
		statusMessage: formData.get('statusMessage') ?? '',
	});
	if (!result.success) throw new Error('Invalid settings data.');
	const { isEmployed, resumeUrl, statusMessage } = result.data;

	const [existingSettings] = await db.select().from(siteSettings).limit(1);

	if (!existingSettings) throw new Error('Settings not found.');
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

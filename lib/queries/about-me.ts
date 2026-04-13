import 'server-only';
import { db } from '@/db';
import { type Settings } from '@/lib/types';

type InformationAboutMe = Omit<Settings, 'id' | 'updatedAt'>;

export async function getInfoAboutMe(): Promise<InformationAboutMe | undefined> {
	return await db.query.siteSettings.findFirst({
		columns: {
			isEmployed: true,
			resumeUrl: true,
			statusMessage: true,
		},
	});
}

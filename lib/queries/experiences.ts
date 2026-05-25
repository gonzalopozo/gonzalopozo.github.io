import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/db';
import { PUBLIC_EXPERIENCES_CACHE_TAG } from '@/lib/cache-tags';
import { type ExperienceData } from '@/lib/types';

async function findExperiences(): Promise<ExperienceData[]> {
	return await db.query.experiences.findMany({
		with: {
			experienceSkills: {
				columns: {},
				with: {
					skill: {
						columns: {
							id: true,
							name: true,
							icon: true,
						},
					},
				},
			},
		},
		orderBy: (experiences, { asc }) => [asc(experiences.order)],
	});
}

export async function getExperiences(): Promise<ExperienceData[]> {
	return await findExperiences();
}

export async function getPublicExperiences(): Promise<ExperienceData[]> {
	'use cache';
	cacheLife('hours');
	cacheTag(PUBLIC_EXPERIENCES_CACHE_TAG);

	return await findExperiences();
}

export async function getExperienceById(id: number): Promise<ExperienceData | undefined> {
	return await db.query.experiences.findFirst({
		where: (experiences, { eq }) => eq(experiences.id, id),
		with: {
			experienceSkills: {
				columns: {},
				with: {
					skill: {
						columns: {
							id: true,
							name: true,
							icon: true,
						},
					},
				},
			},
		},
		orderBy: (experiences, { asc }) => [asc(experiences.order)],
	});
}

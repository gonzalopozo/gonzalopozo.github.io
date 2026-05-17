import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/db';
import { PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';
import { type ProjectInfo } from '@/lib/types';

async function findProjects(): Promise<ProjectInfo[]> {
	return await db.query.projects.findMany({
		with: {
			projectSkills: {
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
		orderBy: (projects, { asc }) => [asc(projects.order)],
	});
}

export async function getProjects(): Promise<ProjectInfo[]> {
	return await findProjects();
}

export async function getPublicProjects(): Promise<ProjectInfo[]> {
	'use cache';
	cacheLife('hours');
	cacheTag(PUBLIC_PROJECTS_CACHE_TAG);

	return await findProjects();
}

export async function getProjectById(id: number): Promise<ProjectInfo | undefined> {
	return await db.query.projects.findFirst({
		where: (projects, { eq }) => eq(projects.id, id),
		with: {
			projectSkills: {
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
		orderBy: (projects, { asc }) => [asc(projects.order)],
	});
}

'use server';

import { db } from '@/db';
import { projects, projectSkills } from '@/db/schema/portfolio';
import { and, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { type ProjectStatus } from '@/lib/types';
import { revalidatePath, updateTag } from 'next/cache';
import { PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';
import { getServerSession } from '@/lib/server-session';
import { deleteOldImageInVercelBlob, saveImageInVercelBlob } from '@/lib/og-image';

interface ProjectSkill {
	projectId: number;
	skillId: number;
}

export async function createProject(formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const url = formData.get('url') ? (formData.get('url') as string) : undefined;
	const repoUrl = formData.get('repoUrl') ? (formData.get('repoUrl') as string) : undefined;
	const status = formData.get('status') as ProjectStatus;

	const result = await db
		.select({ maxOrder: sql<number>`COALESCE(MAX(${projects.order}), 0)` })
		.from(projects);
	const newOrder = result[0].maxOrder + 1;

	const projectSkillsData = formData.getAll('skillIds').map(Number);

	const projectIdData = await db
		.insert(projects)
		.values({
			title,
			description,
			url,
			repoUrl,
			status,
			order: newOrder,
		})
		.returning({ insertedId: projects.id });

	const newProjectId = projectIdData[0].insertedId;

	const projectSkillsInsert: ProjectSkill[] = projectSkillsData.map((skill) => {
		return { projectId: newProjectId, skillId: skill };
	});

	await db.insert(projectSkills).values(projectSkillsInsert);

	if (url) {
		try {
			const uploadedImageUrl = await saveImageInVercelBlob(url, newProjectId);

			if (uploadedImageUrl) {
				try {
					await db
						.update(projects)
						.set({ ogImageUrl: uploadedImageUrl })
						.where(eq(projects.id, newProjectId));
				} catch (e) {
					console.error(e);
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	redirect('/dashboard/projects');
}

export async function updateProject(id: number, formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const title = formData.get('title') as string;
	const description = formData.get('description') as string;
	const url = formData.get('url') ? (formData.get('url') as string) : undefined;
	const repoUrl = formData.get('repoUrl') ? (formData.get('repoUrl') as string) : undefined;
	const status = formData.get('status') as ProjectStatus;

	const oldUrls = await db
		.select({ url: projects.url, ogImageUrl: projects.ogImageUrl })
		.from(projects)
		.where(eq(projects.id, id));

	const oldOpenGraphImageUrl = oldUrls[0].ogImageUrl;

	await db
		.update(projects)
		.set({
			title,
			description,
			url,
			repoUrl,
			status,
		})
		.where(eq(projects.id, id));

	const projectSkillsData = formData.getAll('skillIds').map(Number);

	const projectSkillsToReview: ProjectSkill[] = projectSkillsData.map((skill) => {
		return { projectId: id, skillId: skill };
	});

	const formerProjectSkills: ProjectSkill[] = await db.query.projectSkills.findMany({
		where: eq(projectSkills.projectId, id),
		columns: {
			projectId: true,
			skillId: true,
		},
	});

	const formerProjectSkillIds = new Set(formerProjectSkills.map((skill) => skill.skillId));
	const projectSkillsToInsert = projectSkillsToReview.filter(
		(skillToReview) => !formerProjectSkillIds.has(skillToReview.skillId),
	);

	if (projectSkillsToInsert.length > 0) {
		await db.insert(projectSkills).values(projectSkillsToInsert);
	}

	const nextProjectSkillIds = new Set(projectSkillsToReview.map((skill) => skill.skillId));
	const projectSkillIdsToDelete = formerProjectSkills
		.filter((formerSkill) => !nextProjectSkillIds.has(formerSkill.skillId))
		.map((formerSkill) => formerSkill.skillId);

	if (projectSkillIdsToDelete.length > 0) {
		await db
			.delete(projectSkills)
			.where(
				and(
					eq(projectSkills.projectId, id),
					inArray(projectSkills.skillId, projectSkillIdsToDelete),
				),
			);
	}

	if (url && url !== oldUrls[0].url) {
		try {
			const uploadedImageUrl = await saveImageInVercelBlob(url, id);

			if (uploadedImageUrl) {
				try {
					await db
						.update(projects)
						.set({ ogImageUrl: uploadedImageUrl })
						.where(eq(projects.id, id));

					if (oldOpenGraphImageUrl) {
						await deleteOldImageInVercelBlob(oldOpenGraphImageUrl);
					}
				} catch (e) {
					console.error(e);
				}
			}
		} catch (e) {
			console.error(e);
		}
	} else if (!url) {
		if (oldOpenGraphImageUrl) {
			await deleteOldImageInVercelBlob(oldOpenGraphImageUrl);

			try {
				await db.update(projects).set({ ogImageUrl: null }).where(eq(projects.id, id));
			} catch (e) {
				console.error(e);
			}
		}
	}

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	redirect('/dashboard/projects');
}

export async function deleteProject(id: number) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const [oldUrl] = await db
		.select({ ogImageUrl: projects.ogImageUrl })
		.from(projects)
		.where(eq(projects.id, id));

	if (oldUrl && oldUrl.ogImageUrl) {
		await deleteOldImageInVercelBlob(oldUrl.ogImageUrl);
	}

	await db.delete(projects).where(eq(projects.id, id));

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	revalidatePath('/dashboard/projects');
}

export async function updateProjectOrder(projectId: number, newOrder: number): Promise<string> {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const [project] = await db
		.select({ order: projects.order, title: projects.title })
		.from(projects)
		.where(eq(projects.id, projectId));

	const oldOrder = project.order;
	if (oldOrder === newOrder) return '';

	const isBigger = newOrder > oldOrder;

	await db.update(projects).set({ order: newOrder }).where(eq(projects.id, projectId));

	await db
		.update(projects)
		.set({ order: isBigger ? sql`${projects.order} - 1` : sql`${projects.order} + 1` })
		.where(
			and(
				isBigger ? lte(projects.order, newOrder) : gte(projects.order, newOrder),
				ne(projects.id, projectId),
				isBigger ? gte(projects.order, oldOrder) : lte(projects.order, oldOrder),
			),
		);

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	revalidatePath('/dashboard/projects');

	return project.title;
}

export async function refreshProjectOgImage(projectId: number): Promise<void | null> {
	const session = await getServerSession();
	if (!session) return null;

	const [project] = await db
		.select({ url: projects.url, ogImageUrl: projects.ogImageUrl })
		.from(projects)
		.where(eq(projects.id, projectId));

	if (!project.url) throw Error("Can't fetch OG image from nothing");

	const uploadedImageUrl = await saveImageInVercelBlob(project.url, projectId);

	if (!uploadedImageUrl) return null;

	try {
		await db
			.update(projects)
			.set({ ogImageUrl: uploadedImageUrl })
			.where(eq(projects.id, projectId));
	} catch (e) {
		console.error(e);
		return null;
	}

	const previousOgUrl = project.ogImageUrl;
	if (previousOgUrl && previousOgUrl !== uploadedImageUrl) {
		await deleteOldImageInVercelBlob(previousOgUrl);
	}

	updateTag(PUBLIC_PROJECTS_CACHE_TAG);
	revalidatePath('/dashboard/projects');
}

'use server';

import { db } from '@/db';
import { projects, projectSkills } from '@/db/schema/portfolio';
import { and, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { projectSchema } from '@/lib/schemas/projects';
import { entityIdSchema } from '@/lib/schemas/common';
import { revalidatePath, updateTag } from 'next/cache';
import { PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';
import { requireAdmin } from '@/lib/admin';
import { deleteOldImageInVercelBlob, saveImageInVercelBlob } from '@/lib/og-image';

interface ProjectSkill {
	projectId: number;
	skillId: number;
}

function validateProjectId(id: number) {
	if (!entityIdSchema.safeParse(id).success) throw new Error('Invalid project.');
}

function parseProject(formData: FormData) {
	const result = projectSchema.safeParse({
		title: formData.get('title'),
		description: formData.get('description'),
		url: formData.get('url') ?? '',
		repoUrl: formData.get('repoUrl') ?? '',
		status: formData.get('status'),
		skillIds: formData.getAll('skillIds'),
	});
	if (!result.success) throw new Error('Invalid project data.');
	return result.data;
}

export async function createProject(formData: FormData) {
	await requireAdmin();

	const { title, description, url, repoUrl, status, skillIds } = parseProject(formData);

	const result = await db
		.select({ maxOrder: sql<number>`COALESCE(MAX(${projects.order}), 0)` })
		.from(projects);
	const newOrder = result[0].maxOrder + 1;

	const projectSkillsData = skillIds;

	const projectIdData = await db
		.insert(projects)
		.values({
			title,
			description,
			url: url || null,
			repoUrl: repoUrl || null,
			status,
			order: newOrder,
		})
		.returning({ insertedId: projects.id });

	const newProjectId = projectIdData[0].insertedId;

	const projectSkillsInsert: ProjectSkill[] = projectSkillsData.map((skill) => {
		return { projectId: newProjectId, skillId: skill };
	});

	if (projectSkillsInsert.length) await db.insert(projectSkills).values(projectSkillsInsert);

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
	await requireAdmin();

	validateProjectId(id);
	const { title, description, url, repoUrl, status, skillIds } = parseProject(formData);

	const oldUrls = await db
		.select({ url: projects.url, ogImageUrl: projects.ogImageUrl })
		.from(projects)
		.where(eq(projects.id, id));

	if (!oldUrls[0]) throw new Error('Project not found.');
	const oldOpenGraphImageUrl = oldUrls[0].ogImageUrl;

	await db
		.update(projects)
		.set({
			title,
			description,
			url: url || null,
			repoUrl: repoUrl || null,
			status,
		})
		.where(eq(projects.id, id));

	const projectSkillsData = skillIds;

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
	const projectSkillIdsToDelete = formerProjectSkills.reduce<number[]>(
		(skillIds, formerSkill) => {
			if (!nextProjectSkillIds.has(formerSkill.skillId)) {
				skillIds.push(formerSkill.skillId);
			}

			return skillIds;
		},
		[],
	);

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
	await requireAdmin();
	validateProjectId(id);

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
	await requireAdmin();
	validateProjectId(projectId);
	if (!entityIdSchema.safeParse(newOrder).success) throw new Error('Invalid project position.');
	const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(projects);
	if (newOrder > total) throw new Error('Invalid project position.');

	const [project] = await db
		.select({ order: projects.order, title: projects.title })
		.from(projects)
		.where(eq(projects.id, projectId));

	if (!project) throw new Error('Project not found.');
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
	await requireAdmin();
	validateProjectId(projectId);

	const [project] = await db
		.select({ url: projects.url, ogImageUrl: projects.ogImageUrl })
		.from(projects)
		.where(eq(projects.id, projectId));

	if (!project?.url) throw new Error('Project has no image source.');

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

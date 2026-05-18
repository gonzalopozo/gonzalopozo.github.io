'use server';

import { db } from '@/db';
import { experiences, experienceSkills } from '@/db/schema/portfolio';
import { getServerSession } from '@/lib/server-session';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

interface ExperienceSkill {
	experienceId: number;
	skillId: number;
}

export async function createExperience(formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const role = formData.get('role') as string;
	const company = formData.get('company') as string;
	const companyUrl = formData.get('companyUrl')
		? (formData.get('companyUrl') as string)
		: undefined;
	const companyLogo = formData.get('companyLogo')
		? (formData.get('companyLogo') as string)
		: undefined;
	const description = formData.get('description') as string;
	const startDateStr = formData.get('startDate') as string | null;
	const endDateStr = formData.get('endDate') as string | null;
	const startDate = startDateStr ? new Date(startDateStr) : undefined;
	const endDate = endDateStr ? new Date(endDateStr) : undefined;
	const location = formData.get('location') as string;

	const result = await db
		.select({ maxOrder: sql<number>`COALESCE(MAX(${experiences.order}), 0)` })
		.from(experiences);
	const newOrder = result[0].maxOrder + 1;

	const experienceSkillsData = formData.getAll('skillIds').map(Number);

	const experienceIdData = await db
		.insert(experiences)
		.values({
			role,
			company,
			companyUrl,
			companyLogo,
			description,
			startDate,
			endDate,
			location,
			order: newOrder,
		})
		.returning({ insertedId: experiences.id });

	const experienceSkillsInsert: ExperienceSkill[] = experienceSkillsData.map((skill) => {
		return { experienceId: experienceIdData[0].insertedId, skillId: skill };
	});

	await db.insert(experienceSkills).values(experienceSkillsInsert);

	redirect('/dashboard/experiences');
}

export async function updateExperience(id: number, formData: FormData) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	const role = formData.get('role') as string;
	const company = formData.get('company') as string;
	const companyUrl = formData.get('companyUrl')
		? (formData.get('companyUrl') as string)
		: undefined;
	const companyLogo = formData.get('companyLogo')
		? (formData.get('companyLogo') as string)
		: undefined;
	const description = formData.get('description') as string;
	const startDateStr = formData.get('startDate') as string | null;
	const endDateStr = formData.get('endDate') as string | null;
	const startDate = startDateStr ? new Date(startDateStr) : undefined;
	const endDate = endDateStr ? new Date(endDateStr) : undefined;
	const location = formData.get('location') as string;

	const experienceIdData = await db
		.update(experiences)
		.set({
			role,
			company,
			companyUrl,
			companyLogo,
			description,
			startDate,
			endDate,
			location,
		})
		.where(eq(experiences.id, id))
		.returning({ insertedId: experiences.id });

	const experienceSkillsData = formData.getAll('skillIds').map(Number);

	const experienceSkillsToReview: ExperienceSkill[] = experienceSkillsData.map((skill) => {
		return { experienceId: experienceIdData[0].insertedId, skillId: skill };
	});

	const formerExperienceSkills: ExperienceSkill[] = await db.query.experienceSkills.findMany({
		where: eq(experienceSkills.experienceId, id),
		columns: {
			experienceId: true,
			skillId: true,
		},
	});

	const formerExperienceSkillIds = new Set(formerExperienceSkills.map((skill) => skill.skillId));
	const experienceSkillsToInsert = experienceSkillsToReview.filter(
		(skillToReview) => !formerExperienceSkillIds.has(skillToReview.skillId),
	);

	if (experienceSkillsToInsert.length > 0) {
		await db.insert(experienceSkills).values(experienceSkillsToInsert);
	}

	const nextExperienceSkillIds = new Set(experienceSkillsToReview.map((skill) => skill.skillId));
	const experienceSkillIdsToDelete = formerExperienceSkills
		.filter((formerSkill) => !nextExperienceSkillIds.has(formerSkill.skillId))
		.map((formerSkill) => formerSkill.skillId);

	if (experienceSkillIdsToDelete.length > 0) {
		await db
			.delete(experienceSkills)
			.where(
				and(
					eq(experienceSkills.experienceId, id),
					inArray(experienceSkills.skillId, experienceSkillIdsToDelete),
				),
			);
	}

	redirect('/dashboard/experiences');
}

export async function deleteExperience(id: number) {
	const session = await getServerSession();
	if (!session) redirect('/login');

	await db.delete(experiences).where(eq(experiences.id, id));

	revalidatePath('/dashboard/experiences');
}

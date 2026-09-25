import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { and, asc, count, desc, eq, isNotNull, ne } from 'drizzle-orm';
import { unionAll } from 'drizzle-orm/sqlite-core';
import { db } from '@/db';
import { experienceSkills, projectSkills, skills } from '@/db/schema/portfolio';
import { PUBLIC_EXPERIENCES_CACHE_TAG, PUBLIC_PROJECTS_CACHE_TAG } from '@/lib/cache-tags';

const usedSkillIds = unionAll(
	db.select({ skillId: projectSkills.skillId }).from(projectSkills),
	db.select({ skillId: experienceSkills.skillId }).from(experienceSkills),
).as('used_skill_ids');

export async function getPublicUsedSkills() {
	'use cache';
	cacheLife('hours');
	cacheTag(PUBLIC_PROJECTS_CACHE_TAG, PUBLIC_EXPERIENCES_CACHE_TAG);

	return db
		.select({
			id: skills.id,
			name: skills.name,
			icon: skills.icon,
			url: skills.url,
			useColor: skills.useColor,
			customColor: skills.customColor,
			usageCount: count(usedSkillIds.skillId),
		})
		.from(skills)
		.innerJoin(usedSkillIds, eq(skills.id, usedSkillIds.skillId))
		.where(and(isNotNull(skills.icon), ne(skills.icon, '')))
		.groupBy(skills.id)
		.orderBy(desc(count(usedSkillIds.skillId)), asc(skills.name), asc(skills.id));
}

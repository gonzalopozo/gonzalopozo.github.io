"use server"

import { db } from "@/db";
import { projects, projectSkills } from "@/db/schema/portfolio";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProjectStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface ProjectSkill {
    projectId: number,
    skillId: number
}

export async function createProject(formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') ? formData.get('url') as string : undefined;
    const repoUrl = formData.get('repoUrl') ? formData.get('repoUrl') as string : undefined;
    const status = formData.get('status') as ProjectStatus;

    const result = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${projects.order}), 0)` }).from(projects);
    const newOrder = result[0].maxOrder + 1;

    const projectSkillsData = formData.getAll('skillIds').map(Number)

    const projectIdData = await db.insert(projects).values({
        title,
        description,
        url,
        repoUrl,
        status,
        order: newOrder,
    }).returning({ insertedId: projects.id });

    console.log("projectIdData", projectIdData);
    console.log("projectSkillsData", projectSkillsData);

    const projectSkillsInsert: ProjectSkill[] = projectSkillsData.map(skill => {
        return { projectId: projectIdData[0].insertedId, skillId: skill }
    }) 

    console.log("projectSkillsInsert", projectSkillsInsert);

    await db.insert(projectSkills).values(projectSkillsInsert);
    
    redirect("/dashboard/projects")
}

export async function updateProject(id: number, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') ? formData.get('url') as string : undefined;
    const repoUrl = formData.get('repoUrl') ? formData.get('repoUrl') as string : undefined;
    const status = formData.get('status') as ProjectStatus;

    const projectIdData = await db.update(projects).set({
        title,
        description,
        url,
        repoUrl,
        status,
    }).where(eq(projects.id, id)).returning({ insertedId: projects.id });

    const projectSkillsData = formData.getAll('skillIds').map(Number);

    const projectSkillsToReview: ProjectSkill[] = projectSkillsData.map(skill => {
        return { projectId: projectIdData[0].insertedId, skillId: skill }
    })

    const formerProjectSkills: ProjectSkill[] = await db.query.projectSkills.findMany({
        where: eq(projectSkills.projectId, id),
        columns: {
            projectId: true,
            skillId: true,
        }
    })

    // Insert new skills that don't exist yet
    for (const skillToReview of projectSkillsToReview) {
        const alreadyExists = formerProjectSkills.some(
            formerSkill => formerSkill.projectId === skillToReview.projectId && formerSkill.skillId === skillToReview.skillId
        );

        if (!alreadyExists) {
            await db.insert(projectSkills).values(skillToReview);
        } 
    }

    // Delete skills that were removed
    for (const formerSkill of formerProjectSkills) {
        const stillExists = projectSkillsToReview.some(
            skillToReview => skillToReview.projectId === formerSkill.projectId && skillToReview.skillId === formerSkill.skillId
        );

        if (!stillExists) {
            await db.delete(projectSkills).where(and(eq(projectSkills.projectId, id), eq(projectSkills.skillId, formerSkill.skillId)));
        } 
    }
    

    redirect("/dashboard/projects")
}

export async function deleteProject(id: number) {
    await db.delete(projects).where(eq(projects.id, id));

    revalidatePath("/dashboard/projects")
}

export async function updateProjectOrder(projectId: number, newOrder: number): Promise<string> {
    const [project] = await db
        .select({ order: projects.order, title: projects.title })
        .from(projects)
        .where(eq(projects.id, projectId));

    const oldOrder = project.order;
    if (oldOrder === newOrder) return "";

    const isBigger = newOrder > oldOrder;

    await db.update(projects).set({ order: newOrder }).where(eq(projects.id, projectId));

    await db.update(projects)
        .set({ order: isBigger ? sql`${projects.order} - 1` : sql`${projects.order} + 1` })
        .where(and(
            isBigger ? lte(projects.order, newOrder) : gte(projects.order, newOrder),
            ne(projects.id, projectId),
            isBigger ? gte(projects.order, oldOrder) : lte(projects.order, oldOrder)
        ));

    revalidatePath("/dashboard/projects");

    return project.title;
}
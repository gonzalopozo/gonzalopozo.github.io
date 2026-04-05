"use server"

import { db } from "@/db";
import { projects, projectSkills } from "@/db/schema/portfolio";
import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProjectStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/server-session";
import { deleteOldImageInVercelBlob, saveImageInVercelBlob } from "@/lib/og-image";

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

    const newProjectId = projectIdData[0].insertedId;

    const projectSkillsInsert: ProjectSkill[] = projectSkillsData.map(skill => {
        return { projectId: newProjectId, skillId: skill }
    })

    console.log("projectSkillsInsert", projectSkillsInsert);

    await db.insert(projectSkills).values(projectSkillsInsert);

    if (url) {
        try {
            const uploadedImageUrl = await saveImageInVercelBlob(url, newProjectId);

            if (uploadedImageUrl) {
                try {
                    await db.update(projects).set({ ogImageUrl: uploadedImageUrl }).where(eq(projects.id, newProjectId));
                } catch (e) {
                    console.log(e);
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    redirect("/dashboard/projects")
}

export async function updateProject(id: number, formData: FormData) {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const url = formData.get('url') ? formData.get('url') as string : undefined;
    const repoUrl = formData.get('repoUrl') ? formData.get('repoUrl') as string : undefined;
    const status = formData.get('status') as ProjectStatus;

    const oldUrls = await db.select({ url: projects.url, ogImageUrl: projects.ogImageUrl }).from(projects).where(eq(projects.id, id));

    const oldOpenGraphImageUrl = oldUrls[0].ogImageUrl;

    await db.update(projects).set({
        title,
        description,
        url,
        repoUrl,
        status,
    }).where(eq(projects.id, id));

    const projectSkillsData = formData.getAll('skillIds').map(Number);

    const projectSkillsToReview: ProjectSkill[] = projectSkillsData.map(skill => {
        return { projectId: id, skillId: skill }
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

        if (url && (url !== oldUrls[0].url)) {
            try {
                const uploadedImageUrl = await saveImageInVercelBlob(url, id);
    
                if (uploadedImageUrl) {
                    try {
                        await db.update(projects).set({ ogImageUrl: uploadedImageUrl }).where(eq(projects.id, id));

                        if (oldOpenGraphImageUrl) {
                            await deleteOldImageInVercelBlob(oldOpenGraphImageUrl);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }

            } catch (e) {
                console.log(e);
            }
        } else if (!url) {
            if (oldOpenGraphImageUrl) {
                await deleteOldImageInVercelBlob(oldOpenGraphImageUrl);

                try {
                    await db.update(projects).set({ ogImageUrl: null }).where(eq(projects.id, id));
                } catch (e) {
                    console.log(e);
                }
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

export async function refreshProjectOgImage(projectId: number) {
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
        await db.update(projects).set({ ogImageUrl: uploadedImageUrl }).where(eq(projects.id, projectId));
    } catch (e) {
        console.log(e);
        return null;
    }

    const previousOgUrl = project.ogImageUrl;
    if (previousOgUrl && previousOgUrl !== uploadedImageUrl) {
        await deleteOldImageInVercelBlob(previousOgUrl);
    }

    revalidatePath("/");
    revalidatePath("/dashboard/projects");
}
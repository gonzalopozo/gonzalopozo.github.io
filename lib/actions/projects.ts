"use server"

import { db } from "@/db";
import { projects, projectSkills } from "@/db/schema/portfolio";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProjectStatus } from "@/lib/types";

interface ProjectSkillToInsert {
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

    const projectSkillsInsert: ProjectSkillToInsert[] = projectSkillsData.map(skill => {
        return { projectId: projectIdData[0].insertedId, skillId: skill }
    }) 

    console.log("projectSkillsInsert", projectSkillsInsert);

    await db.insert(projectSkills).values(projectSkillsInsert);
    
    redirect("/dashboard/projects")
}

// export async function updateSocialLink(id: number, formData: FormData) {
//     const name = formData.get('name') as string;
//     const url = formData.get('url') as string ?? undefined;
//     const icon = formData.get('icon') as string ?? undefined;
//     // TODO: el orden? 'order'

//     await db.update(socialLinks).set({
//         name,
//         url,
//         icon,
//     }).where(eq(socialLinks.id, id));

//     redirect("/dashboard/social-links")
// }

// export async function deleteSocialLink(id: number) {
//     await db.delete(socialLinks).where(eq(socialLinks.id, id));

//     revalidatePath("/dashboard/socail-links")
// }
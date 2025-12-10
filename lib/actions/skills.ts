"use server"

import { db } from "@/db";
import { skills } from "@/db/schema/portfolio";
import type { SkillType } from "@/lib/types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSkill(formData: FormData) {
    const name = formData.get('name') as string;
    const type = formData.get('type') as SkillType;
    const icon = formData.get('icon') as string ?? undefined;
    const url = formData.get('url') as string ?? undefined;

    await db.insert(skills).values({
        name,
        type,
        icon,
        url
    })

    redirect("/dashboard/skills")
}

export async function updateSkill(id: number, formData: FormData) {
    const name = formData.get('name') as string;
    const type = formData.get('type') as SkillType;
    const icon = formData.get('icon') as string ?? undefined;
    const url = formData.get('url') as string ?? undefined;

    await db.update(skills).set({
        name,
        type,
        icon,
        url
    }).where(eq(skills.id, id));

    redirect("/dashboard/skills")
}

export async function deleteSkill(id: number) {
    await db.delete(skills).where(eq(skills.id, id));

    revalidatePath("/dashboard/skills")
}
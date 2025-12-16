"use server"

import { db } from "@/db";
import { employmentHistory, siteSettings } from "@/db/schema/portfolio";
import { eq } from "drizzle-orm/sql";
import { revalidatePath } from "next/cache";

export async function updateSiteSettings(formData: FormData) {
    const isEmployed = formData.get('isEmployed') ? formData.get('isEmployed') as string : undefined;
    const resumeUrl = formData.get('resumeUrl') as string;
    const statusMessage = formData.get('statusMessage') ? formData.get('statusMessage') as string : undefined;

    await db.update(siteSettings).set({
        isEmployed: Boolean(isEmployed),
        resumeUrl,
        statusMessage
    }).where(eq(siteSettings.id, 1));

    await db.insert(employmentHistory).values({
        isEmployed: Boolean(isEmployed),
    })

    revalidatePath("/dashboard/settings")

}
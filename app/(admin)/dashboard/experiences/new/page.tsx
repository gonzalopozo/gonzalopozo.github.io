import { SkillsMultiSelect } from "@/components/skills-multi-select";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { skills } from "@/db/schema/portfolio";
import { createExperience } from "@/lib/actions/experiences";

export default async function NewExperienceDashboardPage() {
    const skillsList = await db
        .select({ id: skills.id, name: skills.name })
        .from(skills);

    return (
        <form action={createExperience} className="flex flex-col">
            <h1>Creata a new experience!</h1>
            <div>
                <label htmlFor="role">Role:</label>
                <input type="text" name="role" id="role" placeholder="Software Engineer" />
            </div>
            <div>
                <label htmlFor="company">Company:</label>
                <input type="text" name="company" id="company" placeholder="Company" />
            </div>
            <div>
                <label htmlFor="companyUrl">Company URL:</label>
                <input type="text" name="companyUrl" id="companyUrl" placeholder="Company URL" />
            </div>
            <div>
                <label htmlFor="companyLogo">Company Logo:</label>
                <input type="text" name="companyLogo" id="companyLogo" placeholder="Company Logo" />
            </div>
            <div>
                <label htmlFor="description">Description:</label>
                <textarea name="description" id="description" placeholder="Description" />
            </div>
            <div>
                <label htmlFor="startDate">Start Date:</label>
                <input type="date" name="startDate" id="startDate" placeholder="Start Date" />
            </div>
            <div>
                <label htmlFor="endDate">End Date:</label>
                <input type="date" name="endDate" id="endDate" placeholder="End Date" />
            </div>
            <div>
                <label htmlFor="location">Location:</label>
                <input type="text" name="location" id="location" placeholder="Location" />
            </div>
            <div className="space-y-2">
                <label htmlFor="skillIds">Skills:</label>
                <SkillsMultiSelect skills={skillsList} name="skillIds" />
                <p className="text-xs text-muted-foreground">
                    Selecciona las tecnologías y herramientas usadas en la experiencia
                </p>
            </div>

            <Button variant={"default"} type="submit">Create experience!</Button>
        </form>
    )
}